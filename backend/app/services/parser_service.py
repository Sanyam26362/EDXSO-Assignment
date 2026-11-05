import io
from fastapi import UploadFile, HTTPException
from pypdf import PdfReader
from docx import Document


class ParserService:
    @staticmethod
    async def extract_text(file: UploadFile) -> str:
        # BUG FIX: file.content_type can be None when uploaded via certain clients or curl
        content_type = (file.content_type or "").lower()
        filename = (file.filename or "").lower()
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")

        try:
            extracted_text = ""

            if filename.endswith(".pdf") or "pdf" in content_type:
                reader = PdfReader(io.BytesIO(content))
                extracted_pages = [page.extract_text() or "" for page in reader.pages]
                extracted_text = "\n".join(extracted_pages).strip()

            elif filename.endswith(".docx") or "wordprocessingml" in content_type or "officedocument" in content_type:
                doc = Document(io.BytesIO(content))
                paragraphs = [p.text for p in doc.paragraphs if p.text]
                extracted_text = "\n".join(paragraphs).strip()

            elif filename.endswith(".txt") or "text/plain" in content_type:
                extracted_text = content.decode("utf-8", errors="ignore").strip()

            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file format. Please upload a PDF, DOCX, or TXT file."
                )

            # Ensure file is not a blank scan or empty document
            if not extracted_text:
                raise HTTPException(
                    status_code=422,
                    detail="No readable text could be extracted from the file. If it is a scanned PDF image, please upload a text-based document or paste text directly."
                )

            return extracted_text

        # BUG FIX: Do NOT swallow custom HTTPExceptions inside generic 422 catch
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to process file: {str(e)}")


parser_service = ParserService()
