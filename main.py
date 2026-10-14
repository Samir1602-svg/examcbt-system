from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import fitz  # PyMuPDF
import base64
import json
import re
import feedparser

app = FastAPI(title="EXAMCBT AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central In-Memory Store (Can be mapped to PostgreSQL / Cloud Database)
LIVE_TESTS_STORE = []
REGISTERED_STUDENTS_STORE = []
GRIEVANCES_STORE = []

@app.get("/")
def home():
    return {"status": "EXAMCBT backend is online and running successfully"}

# ----------------- GRIEVANCE & SUPPORT DESK APIS -----------------
@app.get("/api/grievances")
def get_all_grievances():
    return {"status": "success", "grievances": GRIEVANCES_STORE}

@app.post("/api/grievances/submit")
def submit_grievance(item: dict):
    if "status" not in item:
        item["status"] = "PENDING"
    GRIEVANCES_STORE.insert(0, item)
    return {"status": "success", "message": "Grievance logged centrally"}

@app.post("/api/grievances/resolve")
def resolve_grievance(data: dict):
    grievance_id = data.get("id")
    for g in GRIEVANCES_STORE:
        if g.get("id") == grievance_id:
            g["status"] = "RESOLVED"
            return {"status": "success", "message": "Marked as resolved"}
    return {"status": "error", "message": "Grievance not found"}

# ----------------- LIVE EXAM UPDATES API (Automated Ticker) -----------------
@app.get("/api/live-exam-updates")
def get_live_exam_updates():
    try:
        feed = feedparser.parse("https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1")
        updates = []
        for entry in feed.entries[:6]:
            updates.append({
                "text": entry.title,
                "link": entry.link if hasattr(entry, 'link') else "https://india.gov.in"
            })
        if not updates:
            raise Exception("No entries found")
        return {"status": "success", "updates": updates}
    except Exception as e:
        fallback_updates = [
            {"text": "SSC CGL Tier-I Notification & Exam Date Schedule Announced 2026", "link": "https://ssc.gov.in"},
            {"text": "NTA Annual Examination Calendar & Directorate Circular Released", "link": "https://nta.ac.in"},
            {"text": "Railway RRB NTPC Computer Based Test City Intimation Live", "link": "https://indianrailways.gov.in"},
            {"text": "UPSC Civil Services Examination Official Policy Notification", "link": "https://upsc.gov.in"},
            {"text": "Ministry of Education - National Educational Policy Guidelines Update", "link": "https://www.education.gov.in"}
        ]
        return {"status": "success", "updates": fallback_updates}

# ----------------- TEST APIS -----------------
@app.get("/api/tests")
def get_all_tests():
    return {"status": "success", "tests": LIVE_TESTS_STORE}

@app.post("/api/tests/save")
def save_live_test(test_data: dict):
    existing_idx = next((i for i, t in enumerate(LIVE_TESTS_STORE) if t.get("id") == test_data.get("id")), None)
    if existing_idx is not None:
        LIVE_TESTS_STORE[existing_idx] = test_data
    else:
        LIVE_TESTS_STORE.insert(0, test_data)
    return {"status": "success", "message": "Test synced centrally across all devices"}

@app.delete("/api/tests/{test_id}")
def delete_live_test(test_id: str):
    global LIVE_TESTS_STORE
    LIVE_TESTS_STORE = [t for t in LIVE_TESTS_STORE if t.get("id") != test_id]
    return {"status": "success"}

# ----------------- STUDENT ROSTER & AUTH APIS -----------------
@app.get("/api/students")
def get_all_students():
    return {"status": "success", "students": REGISTERED_STUDENTS_STORE}

@app.post("/api/students/register")
def register_student(student: dict):
    if "tier" not in student:
        student["tier"] = "FREE"
    
    existing = next((s for s in REGISTERED_STUDENTS_STORE if s.get("id") == student.get("id") or (s.get("email") and s.get("email").lower() == student.get("email", "").lower())), None)
    if not existing:
        REGISTERED_STUDENTS_STORE.insert(0, student)
    else:
        idx = REGISTERED_STUDENTS_STORE.index(existing)
        REGISTERED_STUDENTS_STORE[idx].update(student)
    return {"status": "success", "students": REGISTERED_STUDENTS_STORE}

@app.post("/api/students/login")
def login_student(data: dict):
    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "").strip()

    student = next((s for s in REGISTERED_STUDENTS_STORE if 
        (s.get("email") and s.get("email").lower() == identifier) or 
        (s.get("phone") and s.get("phone") == identifier) or
        (s.get("id") and s.get("id").lower() == identifier)
    ), None)

    if not student:
        raise HTTPException(status_code=404, detail="No candidate account found matching this identifier.")

    if student.get("password") and student.get("password") != password:
        raise HTTPException(status_code=401, detail="Incorrect password entered.")

    return {"status": "success", "student": student}

@app.post("/api/students/verify-identity")
def verify_student_identity(data: dict):
    identifier = data.get("identifier", "").strip().lower()
    phone = data.get("phone", "").strip()

    student = next((s for s in REGISTERED_STUDENTS_STORE if 
        ((s.get("email") and s.get("email").lower() == identifier) or 
         (s.get("id") and s.get("id").lower() == identifier) or
         (s.get("phone") and s.get("phone") == identifier)) and
        (s.get("phone") and s.get("phone") == phone)
    ), None)

    if not student:
        raise HTTPException(status_code=404, detail="Identity verification failed.")

    return {"status": "success", "student": student}

@app.post("/api/students/update-profile")
def update_student_profile(data: dict):
    student_id = data.get("id")
    avatar = data.get("avatar")
    for student in REGISTERED_STUDENTS_STORE:
        if student.get("id") == student_id or student.get("email") == data.get("email"):
            if avatar:
                student["avatar"] = avatar
                student["photo"] = avatar
            return {"status": "success", "message": "Profile updated successfully"}
    return {"status": "error", "message": "Student not found"}

@app.post("/api/students/update-tier")
def update_student_tier(data: dict):
    student_id = data.get("id")
    new_tier = data.get("tier")
    for student in REGISTERED_STUDENTS_STORE:
        if student.get("id") == student_id:
            student["tier"] = new_tier
            return {"status": "success", "message": f"Tier successfully updated to {new_tier}"}
    return {"status": "error", "message": "Student not found"}

# ----------------- PDF CONVERTER -----------------
@app.post("/api/convert-pdf-to-cbt")
async def convert_pdf_to_cbt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    full_text = ""
    pages_dict = []

    for page_idx, page in enumerate(doc):
        t = page.get_text()
        full_text += t + "\n"
        pages_dict.append({"page_num": page_idx, "page_obj": page, "text": t})

    q_chunks = re.split(r'\n(?=Q\.\s*\d+)', full_text)
    questions = []

    for chunk in q_chunks:
        chunk = chunk.strip()
        if not re.match(r'^Q\.\s*\d+', chunk):
            continue

        q_num_match = re.search(r'^Q\.\s*(\d+)', chunk)
        q_num = int(q_num_match.group(1)) if q_num_match else len(questions) + 1

        parts = re.split(r'\n(?=Ans\s*)', chunk, maxsplit=1)
        question_part = parts[0]
        options_part = parts[1] if len(parts) > 1 else ""

        q_lines = question_part.split('\n')
        q_header = re.sub(r'^Q\.\s*\d+\s*', '', q_lines[0]).strip()
        sub_lines = [
            l.strip() for l in q_lines[1:] 
            if l.strip() and not l.startswith('Section :') and not l.startswith('www.') and not 'Exam Guide' in l
        ]

        full_question = q_header
        if sub_lines:
            full_question += "\n" + "\n".join(sub_lines)

        detected_correct_num = None
        for line in options_part.split('\n'):
            line_str = line.strip()
            tick_match = re.search(r'([✔✓√\u2713\u2714\u221a]|ans\s*[✔✓√\u2713\u2714\u221a])\s*([1-4])\.', line_str, re.IGNORECASE)
            if tick_match:
                detected_correct_num = int(tick_match.group(2))
                break

        parsed_opts = {}
        opt_matches = re.findall(r'(?:Ans\s*)?[X✔✓√\u2713\u2714\u221a\s]*([1-4])\.\s*(.+)', options_part)
        for item in opt_matches:
            opt_no = int(item[0])
            opt_val = item[1].strip()
            opt_val = re.split(r'Question ID\s*:', opt_val)[0].strip()
            if opt_no not in parsed_opts:
                parsed_opts[opt_no] = opt_val

        options = [parsed_opts.get(i, f"Option {i}") for i in range(1, 5)]

        if detected_correct_num is None:
            chosen_match = re.search(r'Chosen Option\s*:\s*([1-4])', options_part, re.IGNORECASE)
            if chosen_match:
                detected_correct_num = int(chosen_match.group(1))

        correct_idx = (detected_correct_num - 1) if (detected_correct_num and 1 <= detected_correct_num <= 4) else 0

        diagram_img = None
        needs_diagram = any(w in full_question.lower() for w in ['figure', 'diagram', 'dice', 'cube', 'fold', 'pattern', 'mirror', 'embedded', 'triangles', 'squares']) or len(full_question.strip()) < 12

        if needs_diagram:
            for p in pages_dict:
                if f"Q.{q_num}" in p["text"] or f"Q. {q_num}" in p["text"]:
                    page_obj = p["page_obj"]
                    rects = page_obj.search_for(f"Q.{q_num}") or page_obj.search_for(f"Q. {q_num}")
                    if rects:
                        r0 = rects[0]
                        crop_box = fitz.Rect(
                            page_obj.rect.x0 + 35,
                            r0.y1 + 4,
                        page_obj.rect.x1 - 35,
                            min(page_obj.rect.y1 - 60, r0.y1 + 240)
                        )
                        pix = page_obj.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), clip=crop_box)
                        img_data = pix.tobytes("png")
                        if len(img_data) > 1500:
                            diagram_img = f"data:image/png;base64,{base64.b64encode(img_data).decode('utf-8')}"
                    break

        if not full_question.strip():
            full_question = "Select the correct option figure that satisfies the given pattern/conditions."

        questions.append({
            "id": q_num,
            "question_en": full_question,
            "question_hi": full_question,
            "image": diagram_img,
            "options_en": options,
            "options_hi": options,
            "correct_option_index": correct_idx,
            "subject": "SSC CGL Examination"
        })

    return {"status": "success", "data": {"questions": questions}}
