from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import base64
import json
import re

app = FastAPI(title="EXAMCBT AI Engine")

# Production CORS: Localhost aur public domain dono allow karta hai
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "EXAMCBT backend is online and running successfully"}

@app.post("/api/convert-pdf-to-cbt")
async def convert_pdf_to_cbt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    full_text = ""
    # Har page ka text aur blocks store karein
    page_data = []

    for page_idx, page in enumerate(doc):
        text = page.get_text()
        full_text += text + "\n"
        page_data.append({
            "page_num": page_idx + 1,
            "page_obj": page,
            "text": text
        })

    # TCS iON Question pattern (Q.1, Q.2 ... Q.100)
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

        # Multi-line statement extraction
        q_lines = question_part.split('\n')
        q_header = re.sub(r'^Q\.\s*\d+\s*', '', q_lines[0]).strip()
        sub_lines = [
            l.strip() for l in q_lines[1:] 
            if l.strip() and not l.startswith('Section :') and not l.startswith('www.') and not 'Exam Guide' in l
        ]

        full_question = q_header
        if sub_lines:
            full_question += "\n" + "\n".join(sub_lines)

        # Precise Answer Key Detection (Tick Marks & Chosen Option)
        detected_correct_num = None
        for line in options_part.split('\n'):
            line_str = line.strip()
            tick_match = re.search(r'([✔✓√\u2713\u2714\u221a]|ans\s*[✔✓√\u2713\u2714\u221a])\s*([1-4])\.', line_str, re.IGNORECASE)
            if tick_match:
                detected_correct_num = int(tick_match.group(2))
                break

        # Extract Options (1 to 4)
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

        # High-Accuracy Diagram Crop Rendering:
        # Check if question relies on figures
        has_diagram = any(w in full_question.lower() for w in ['figure', 'diagram', 'dice', 'fold', 'cube', 'pattern', 'mirror', 'embedded']) or len(full_question.strip()) < 15

        diagram_img = None
        if has_diagram:
            # Locate which page contains this Q.X
            target_page = None
            for p in page_data:
                if f"Q.{q_num}" in p["text"] or f"Q. {q_num}" in p["text"]:
                    target_page = p["page_obj"]
                    break

            if target_page:
                try:
                    # Find rect coordinate of Q.X on the page
                    search_res = target_page.search_for(f"Q.{q_num}") or target_page.search_for(f"Q. {q_num}")
                    if search_res:
                        q_rect = search_res[0]
                        # Crop area below the question heading (standard diagram zone in TCS sheets)
                        # rect: [x0, y0, x1, y1]
                        crop_rect = fitz.Rect(
                            target_page.rect.x0 + 40,
                            q_rect.y1 + 5,
                            target_page.rect.x1 - 40,
                            min(target_page.rect.y1 - 80, q_rect.y1 + 220)
                        )
                        # Render cropped area to crisp image (zoom 1.5x)
                        mat = fitz.Matrix(1.5, 1.5)
                        pix = target_page.get_pixmap(matrix=mat, clip=crop_rect)
                        img_bytes = pix.tobytes("png")
                        if len(img_bytes) > 2000:
                            diagram_img = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
                except Exception as e:
                    print(f"Crop diagram error for Q.{q_num}:", e)

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