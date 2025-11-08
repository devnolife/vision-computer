#!/usr/bin/env python3
"""
Main FastAPI Application
Turnitin Bypass System Backend - Clean Version
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.bypass_engine import BypassEngine
from app.content_analyzer import ContentAnalyzer
from app.models import BypassRequest, BypassResponse
from app.middleware import APIKeyMiddleware
from config import API_CONFIG, MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS

# Celery imports
from app.tasks import (
    analyze_detect_flags_task,
    match_flags_task,
    bypass_matched_flags_task,
    process_document_unified_task  # Unified task
)
from celery.result import AsyncResult

# Initialize FastAPI app
app = FastAPI(
    title="Turnitin Bypass API",
    description="Backend API untuk concurrent document processing dengan Celery + Unified Endpoint",
    version="2.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Authentication Middleware
# Public endpoints yang tidak perlu API key: /, /health, /docs
app.add_middleware(
    APIKeyMiddleware,
    exclude_paths=["/", "/health", "/docs", "/openapi.json", "/redoc"]
)

# Initialize engines
engine = BypassEngine()
analyzer = ContentAnalyzer()

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Turnitin Bypass API",
        "version": "2.1.0",
        "concurrent_processing": "enabled",
        "unified_endpoint": "available",
        "new_feature": "🚀 One-stop processing: POST /jobs/process-document"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "engine": "ready",
        "upload_folder": os.path.exists("uploads"),
        "output_folder": os.path.exists("outputs"),
        "temp_folder": os.path.exists("temp")
    }

# ============================================================================
# ASYNC JOB ENDPOINTS (Celery Background Tasks)
# ============================================================================

@app.post("/jobs/analyze/detect-flags")
async def submit_analyze_job(file: UploadFile = File(...)):
    """
    Submit analyze job ke background queue

    Process:
    - Detect colored highlights dari Turnitin PDF
    - OCR dengan ocrmypdf --force-ocr
    - Extract text dari highlighted areas

    Returns:
    - job_id: UUID untuk tracking progress
    - status_url: URL untuk check status
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        from datetime import datetime

        # Save uploaded file
        content = await file.read()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = file.filename.replace(" ", "_")
        temp_path = f"temp/job_{timestamp}_{safe_filename}"

        with open(temp_path, "wb") as f:
            f.write(content)

        # Submit task to Celery
        task = analyze_detect_flags_task.delay(temp_path, file.filename)

        return JSONResponse(content={
            "success": True,
            "job_id": task.id,
            "message": "Analysis job submitted successfully",
            "status_url": f"/jobs/{task.id}/status"
        })

    except Exception as e:
        print(f"Submit analyze job error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/match-flags")
async def submit_match_job(
    turnitin_pdf: UploadFile = File(...),
    original_doc: UploadFile = File(...)
):
    """
    Submit match job ke background queue

    Process:
    - Extract flagged items dari Turnitin PDF
    - Extract text dari original document (DOCX/PDF/TXT)
    - Fuzzy matching dengan threshold 80%

    Returns:
    - job_id: UUID untuk tracking progress
    - status_url: URL untuk check status
    """
    if not turnitin_pdf.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Turnitin file must be PDF")

    if not original_doc.filename.lower().endswith(('.docx', '.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Original document must be DOCX, PDF, or TXT")

    try:
        from datetime import datetime

        # Save uploaded files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        pdf_content = await turnitin_pdf.read()
        pdf_path = f"temp/job_{timestamp}_turnitin.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_content)

        doc_content = await original_doc.read()
        doc_ext = original_doc.filename.split('.')[-1]
        doc_path = f"temp/job_{timestamp}_original.{doc_ext}"
        with open(doc_path, "wb") as f:
            f.write(doc_content)

        # Submit task to Celery
        task = match_flags_task.delay(
            pdf_path,
            doc_path,
            turnitin_pdf.filename,
            original_doc.filename
        )

        return JSONResponse(content={
            "success": True,
            "job_id": task.id,
            "message": "Match job submitted successfully",
            "status_url": f"/jobs/{task.id}/status"
        })

    except Exception as e:
        print(f"Submit match job error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/bypass-matched-flags")
async def submit_bypass_job(
    original_doc: UploadFile = File(...),
    flagged_text: str = Form(...),
    homoglyph_density: float = Form(default=0.95),
    invisible_density: float = Form(default=0.40)
):
    """
    Submit bypass job ke background queue

    Process:
    - Load original DOCX
    - Find ALL occurrences dari flagged texts
    - Apply homoglyph (95%) + invisible chars (40%)
    - Save modified document

    Returns:
    - job_id: UUID untuk tracking progress
    - status_url: URL untuk check status
    """
    if not original_doc.filename.lower().endswith('.docx'):
        raise HTTPException(status_code=400, detail="Original document must be DOCX")

    try:
        from datetime import datetime

        # Save uploaded file
        content = await original_doc.read()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        doc_path = f"temp/job_{timestamp}_bypass.docx"

        with open(doc_path, "wb") as f:
            f.write(content)

        # Submit task to Celery
        task = bypass_matched_flags_task.delay(
            doc_path,
            flagged_text,
            original_doc.filename,
            homoglyph_density,
            invisible_density
        )

        return JSONResponse(content={
            "success": True,
            "job_id": task.id,
            "message": "Bypass job submitted successfully",
            "status_url": f"/jobs/{task.id}/status"
        })

    except Exception as e:
        print(f"Submit bypass job error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/process-document")
async def submit_unified_job(
    turnitin_pdf: UploadFile = File(...),
    original_doc: UploadFile = File(...),
    homoglyph_density: float = Form(default=0.95),
    invisible_density: float = Form(default=0.40)
):
    """
    🚀 UNIFIED ENDPOINT - One-stop processing

    Combines all 3 phases in one request:
    1. ANALYZE: Detect flags from Turnitin PDF (OCR + highlight detection)
    2. MATCH: Fuzzy match flags with original document (80% threshold)
    3. BYPASS: Apply homoglyph + invisible chars to matched items

    Process Flow:
    - Phase 1/3 (Steps 1-5): Analyze & detect flags
    - Phase 2/3 (Steps 6-9): Match flags with original
    - Phase 3/3 (Steps 10-13): Bypass matched flags

    Input:
    - turnitin_pdf: Turnitin PDF with highlighted plagiarism (PDF)
    - original_doc: Original document to modify (DOCX only)
    - homoglyph_density: 0.0-1.0 (default 0.95)
    - invisible_density: 0.0-1.0 (default 0.40)

    Returns:
    - job_id: UUID for tracking progress
    - status_url: URL to check real-time progress (13 unified steps)
    - result_url: URL to get final results when complete

    Usage:
    1. Submit files to this endpoint
    2. Poll /jobs/{job_id}/status to watch progress (0-100%)
    3. When state=SUCCESS, get results from /jobs/{job_id}/result
    4. Download modified file from /bypass/download/{filename}
    """
    print(f"\n{'='*60}")
    print(f"🚀 [PROCESS-DOCUMENT] Request received!")
    print(f"   Turnitin PDF: {turnitin_pdf.filename}")
    print(f"   Original DOC: {original_doc.filename}")
    print(f"   Homoglyph density: {homoglyph_density}")
    print(f"   Invisible density: {invisible_density}")
    print(f"{'='*60}\n")
    
    # Validate file types
    if not turnitin_pdf.filename.endswith('.pdf'):
        error_msg = f"Turnitin file must be PDF (received: {turnitin_pdf.filename})"
        print(f"❌ [VALIDATION ERROR] {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

    if not original_doc.filename.lower().endswith('.docx'):
        error_msg = f"Original document must be DOCX (received: {original_doc.filename})"
        print(f"❌ [VALIDATION ERROR] {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

    try:
        from datetime import datetime

        # Save uploaded files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save Turnitin PDF
        pdf_content = await turnitin_pdf.read()
        pdf_path = f"temp/unified_{timestamp}_turnitin.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_content)

        # Save original DOCX
        doc_content = await original_doc.read()
        doc_path = f"temp/unified_{timestamp}_original.docx"
        with open(doc_path, "wb") as f:
            f.write(doc_content)

        # Submit unified task to Celery
        task = process_document_unified_task.delay(
            pdf_path,
            doc_path,
            turnitin_pdf.filename,
            original_doc.filename,
            homoglyph_density,
            invisible_density
        )

        return JSONResponse(content={
            "success": True,
            "job_id": task.id,
            "message": "Unified processing job submitted successfully",
            "phases": [
                "Phase 1/3: Analyze & Detect Flags (Steps 1-5)",
                "Phase 2/3: Match Flags (Steps 6-9)",
                "Phase 3/3: Bypass Matched Flags (Steps 10-13)"
            ],
            "total_steps": 13,
            "status_url": f"/jobs/{task.id}/status",
            "result_url": f"/jobs/{task.id}/result"
        })

    except Exception as e:
        print(f"Submit unified job error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """
    Check job status dan progress

    States:
    - PENDING: Job waiting in queue (0%)
    - PROGRESS: Job is processing (1-99%)
    - SUCCESS: Job completed (100%)
    - FAILURE: Job failed (0%)

    Returns:
    - state: Current job state
    - progress: Percentage (0-100)
    - message: Status message
    - result_url: URL untuk get result (if SUCCESS)
    """
    try:
        task_result = AsyncResult(job_id)

        if task_result.state == 'PENDING':
            response = {
                "job_id": job_id,
                "state": "PENDING",
                "message": "Job is waiting in queue...",
                "progress": 0
            }

        elif task_result.state == 'PROGRESS':
            response = {
                "job_id": job_id,
                "state": "PROGRESS",
                "message": task_result.info.get('message', 'Processing...'),
                "progress": task_result.info.get('percent', 0),
                "current": task_result.info.get('current', 0),
                "total": task_result.info.get('total', 0)
            }

        elif task_result.state == 'SUCCESS':
            response = {
                "job_id": job_id,
                "state": "SUCCESS",
                "message": "Job completed successfully!",
                "progress": 100,
                "result_url": f"/jobs/{job_id}/result"
            }

        elif task_result.state == 'FAILURE':
            response = {
                "job_id": job_id,
                "state": "FAILURE",
                "message": str(task_result.info),
                "progress": 0
            }

        else:
            response = {
                "job_id": job_id,
                "state": task_result.state,
                "message": str(task_result.info),
                "progress": 0
            }

        return JSONResponse(content=response)

    except Exception as e:
        print(f"Get job status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}/result")
async def get_job_result(job_id: str):
    """
    Get final result dari completed job

    Only works for SUCCESS state.
    Returns full result object dari background task.
    """
    try:
        task_result = AsyncResult(job_id)

        if task_result.state == 'SUCCESS':
            return JSONResponse(content=task_result.result)

        elif task_result.state == 'FAILURE':
            raise HTTPException(status_code=500, detail=f"Job failed: {str(task_result.info)}")

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Job not completed yet. Current state: {task_result.state}"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get job result error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.post("/bypass/upload", response_model=BypassResponse)
async def bypass_document(
    file: UploadFile = File(...),
    homoglyph_density: Optional[float] = Form(None),
    invisible_density: Optional[float] = Form(None)
):
    """
    Legacy synchronous bypass endpoint (for backward compatibility)

    Uses header_focused strategy (default):
    - Homoglyph: 95%
    - Invisible: 40%
    - Target: Headers and standard phrases

    Note: For concurrent processing, use /jobs/bypass-matched-flags instead.
    """
    if not file.filename.lower().endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only DOCX files are supported")

    try:
        from datetime import datetime

        # Save uploaded file
        content = await file.read()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_filename = file.filename.replace(" ", "_")
        input_path = f"uploads/{input_filename}"

        with open(input_path, "wb") as f:
            f.write(content)

        # Process dengan bypass engine
        result = engine.process_bypass(
            input_path=input_path,
            strategy='header_focused',
            homoglyph_density=homoglyph_density,
            invisible_density=invisible_density
        )

        return BypassResponse(
            success=True,
            message="Document processed successfully",
            output_file=result['output_file'],
            header_count=result['header_count'],
            phrase_count=result['phrase_count'],
            total_modifications=result['total_modifications']
        )

    except Exception as e:
        print(f"Bypass error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bypass/download/{filename}")
async def download_result(filename: str):
    """Download hasil bypass dari outputs directory"""
    # Support both old path and new backend/outputs/ path
    file_path = f"backend/outputs/{filename}"

    # Fallback to old path if file not found
    if not os.path.exists(file_path):
        file_path = f"outputs/{filename}"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Determine media type based on file extension
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if filename.lower().endswith('.pdf'):
        media_type = 'application/pdf'

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )


@app.get("/config/strategies")
async def get_strategies():
    """Get available bypass strategies"""
    from config import TARGETED_CONFIG, TARGETED_AGGRESSIVE_CONFIG, HEADER_CONFIG

    return {
        "strategies": {
            "natural": {
                "name": "Natural",
                "homoglyph_density": TARGETED_CONFIG['homoglyph_density'],
                "invisible_density": TARGETED_CONFIG['invisible_density'],
                "description": "Balanced approach untuk natural look"
            },
            "aggressive": {
                "name": "Aggressive",
                "homoglyph_density": TARGETED_AGGRESSIVE_CONFIG['homoglyph_density'],
                "invisible_density": TARGETED_AGGRESSIVE_CONFIG['invisible_density'],
                "description": "Ultra-aggressive untuk maximum bypass"
            },
            "header_focused": {
                "name": "Header Focused (Recommended)",
                "homoglyph_density": HEADER_CONFIG['homoglyph_density'],
                "invisible_density": HEADER_CONFIG['invisible_density'],
                "description": "Optimal strategy - focus on headers & standard phrases"
            }
        }
    }


@app.get("/config/default")
async def get_default_config():
    """Get default configuration"""
    from config import DEFAULT_CONFIG

    return DEFAULT_CONFIG


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
