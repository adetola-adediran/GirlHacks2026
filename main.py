from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile  # for front end communication
from pydantic import BaseModel

app = FastAPI()


@app.post("/verify-task")
async def verify_homework(
    homework_image: UploadFile = File(),
):
    # STEP 1. Validate that the image is actually a JPEG or PNG.
    allowed_extensions = {".jpg", ".jpeg", ".png"}
    uploaded_extension = Path(homework_image.filename or "").suffix.lower()

    if uploaded_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are allowed.",
        )

    # STEP 2. Read the image bytes using: await homework_image.read()
    image_bytes = await homework_image.read()

    # STEP 3. Pass those bytes to your Vertex AI Gemini model.
    # STEP 4. Update your Tiger Data database if Vertex AI returns 'verified: true'.

    return {
        "filename": homework_image.filename,
        "status": "pending validation",
        "image_size_bytes": len(image_bytes),
    }



