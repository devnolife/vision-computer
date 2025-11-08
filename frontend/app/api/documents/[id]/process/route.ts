import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

const BACKEND_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'
const isDev = process.env.NODE_ENV === 'development'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestStartTime = Date.now()
  try {
    console.log('\n' + '='.repeat(70))
    console.log('🚀 [NEXT.JS API] /api/documents/[id]/process - REQUEST RECEIVED')
    console.log('   Timestamp:', new Date().toISOString())
    console.log('   Document ID:', params.id)
    console.log('   Backend URL:', BACKEND_URL)
    console.log('   Python API Key:', process.env.PYTHON_API_KEY ? `${process.env.PYTHON_API_KEY.substring(0, 20)}...` : 'NOT SET')
    console.log('   Request Method:', request.method)
    console.log('   Request URL:', request.url)
    console.log('='.repeat(70) + '\n')

    // Test backend connectivity first
    console.log('[PROCESS] 🔍 Testing backend connectivity...')
    try {
      const healthCheck = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      console.log(`[PROCESS] ✅ Backend is reachable - Status: ${healthCheck.status}`)
    } catch (healthError: any) {
      console.error('[PROCESS] ❌ Backend NOT reachable!')
      console.error('   Error:', healthError.message)
      console.error('   URL:', `${BACKEND_URL}/health`)
      return NextResponse.json(
        {
          error: 'Backend Python tidak dapat dijangkau',
          details: `Cannot connect to ${BACKEND_URL}. Error: ${healthError.message}`,
          suggestion: 'Pastikan backend Python running dengan: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'
        },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[PROCESS] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Tidak diizinkan' },
        { status: 401 }
      )
    }

    const documentId = params.id
    console.log(`[PROCESS] 🚀 Starting process for document: ${documentId}`)
    console.log(`[PROCESS] 👤 User: ${session.user.name} (${session.user.email})`)

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      if (isDev) console.log('[PROCESS] ❌ Document not found')
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    if (isDev) console.log(`[PROCESS] ✓ Document found: ${document.title}`)

    // Verify ownership
    if (document.userId !== session.user.id && session.user.role !== 'ADMIN') {
      if (isDev) console.log('[PROCESS] ❌ Access denied - Not owner')
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke dokumen ini' },
        { status: 403 }
      )
    }

    // ===== CHECK APPROVAL STATUS =====
    if (document.requiresApproval && document.approvalStatus !== 'APPROVED') {
      if (isDev) console.log(`[PROCESS] ⏳ Document requires approval - Status: ${document.approvalStatus}`)

      let message = 'Dokumen ini memerlukan persetujuan admin sebelum dapat diproses.'

      if (document.approvalStatus === 'REJECTED') {
        message = `Dokumen ditolak oleh admin. Alasan: ${document.rejectionReason || 'Tidak ada alasan'}`
      } else if (document.approvalStatus === 'PENDING') {
        message = 'Dokumen sedang menunggu persetujuan admin. Mohon tunggu hingga admin menyetujui dokumen Anda.'
      }

      return NextResponse.json(
        {
          error: 'Approval required',
          message,
          requiresApproval: true,
          approvalStatus: document.approvalStatus,
        },
        { status: 403 }
      )
    }
    // ===== END CHECK APPROVAL STATUS =====

    // Check if document has both DOCX and PDF
    console.log('[PROCESS] 📄 Checking files:')
    console.log(`   - DOCX uploadPath: ${document.uploadPath}`)
    console.log(`   - PDF pdfPath: ${document.pdfPath}`)

    if (!document.uploadPath || !document.pdfPath) {
      console.log('[PROCESS] ❌ Missing files - DOCX or PDF not found')

      if (!document.pdfPath) {
        return NextResponse.json(
          {
            error: 'PDF Turnitin tidak ditemukan',
            message: 'Dokumen harus memiliki PDF Turnitin untuk dapat diproses. Silakan upload ulang dengan menyertakan PDF Turnitin.'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Dokumen harus memiliki file DOCX dan PDF Turnitin untuk diproses' },
        { status: 400 }
      )
    }

    if (isDev) console.log(`[PROCESS] ✓ Files check passed - DOCX: ${document.uploadPath}, PDF: ${document.pdfPath}`)

    // Update document status to ANALYZING
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'ANALYZING',
        jobStartedAt: new Date(),
      },
    })

    if (isDev) console.log('[PROCESS] ✓ Status updated to ANALYZING')

    // Prepare file paths
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents')
    const docxFileName = path.basename(document.uploadPath)
    const pdfFileName = document.pdfPath ? path.basename(document.pdfPath) : null

    const docxPath = path.join(uploadsDir, docxFileName)
    const pdfPath = pdfFileName ? path.join(uploadsDir, pdfFileName) : null

    // Check if files exist
    try {
      await fs.access(docxPath)
      if (isDev) console.log(`[PROCESS] ✓ DOCX file exists: ${docxPath}`)

      if (pdfPath) {
        await fs.access(pdfPath)
        if (isDev) console.log(`[PROCESS] ✓ PDF file exists: ${pdfPath}`)
      }
    } catch (error) {
      if (isDev) console.log(`[PROCESS] ❌ File not found on disk: ${error}`)
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })
      return NextResponse.json(
        { error: 'File dokumen tidak ditemukan di server' },
        { status: 400 }
      )
    }

    // Read files as binary
    const docxBuffer = await fs.readFile(docxPath)
    const pdfBuffer = pdfPath ? await fs.readFile(pdfPath) : null

    // Create FormData for backend
    const formData = new FormData()

    // Add files with correct parameter names matching Python backend
    const docxBlob = new Blob([docxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const pdfBlob = pdfBuffer
      ? new Blob([pdfBuffer], { type: 'application/pdf' })
      : null

    // Python backend expects: original_doc, turnitin_pdf, homoglyph_density, invisible_density
    formData.append('original_doc', docxBlob, docxFileName)
    if (pdfBlob) {
      formData.append('turnitin_pdf', pdfBlob, pdfFileName!)
    }

    // Add density parameters (Python backend requires these as Form data)
    formData.append('homoglyph_density', '0.95')
    formData.append('invisible_density', '0.40')

    console.log('[PROCESS] FormData prepared with:')
    console.log('   - original_doc:', docxFileName)
    console.log('   - turnitin_pdf:', pdfFileName)
    console.log('   - homoglyph_density: 0.95')
    console.log('   - invisible_density: 0.40')

    // Call backend API
    console.log(`\n${'='.repeat(70)}`)
    console.log('[PROCESS] STEP 8: Preparing to call Python backend')
    console.log(`[PROCESS] 📡 Target URL: ${BACKEND_URL}/jobs/process-document`)
    console.log(`[PROCESS] 📦 FormData contents:`)
    console.log(`   - original_doc: ${docxFileName} (${docxBuffer.length} bytes)`)
    console.log(`   - turnitin_pdf: ${pdfFileName || 'NOT PROVIDED'} ${pdfBuffer ? `(${pdfBuffer.length} bytes)` : ''}`)
    console.log(`   - API Key: ${process.env.PYTHON_API_KEY ? process.env.PYTHON_API_KEY.substring(0, 30) + '...' : 'NOT SET'}`)
    console.log(`[PROCESS] 🚀 Initiating fetch request...`)
    console.log('='.repeat(70))

    let backendResponse
    try {
      console.log('[PROCESS] >>> fetch() called - waiting for response...')
      const fetchStartTime = Date.now()

      backendResponse = await fetch(`${BACKEND_URL}/jobs/process-document`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-API-Key': process.env.PYTHON_API_KEY || '',
        },
      })

      const fetchDuration = Date.now() - fetchStartTime
      console.log(`[PROCESS] <<< fetch() completed in ${fetchDuration}ms`)
      console.log(`[PROCESS] ✅ Backend response received!`)
      console.log(`[PROCESS] 📡 Status: ${backendResponse.status} ${backendResponse.statusText}`)
      console.log(`[PROCESS] 📡 Headers:`, Object.fromEntries(backendResponse.headers.entries()))
      console.log(`[PROCESS] 📡 Response OK: ${backendResponse.ok}`)
    } catch (fetchError: any) {
      console.error('[PROCESS] ❌ FETCH ERROR - Cannot connect to Python backend:')
      console.error('   Error:', fetchError.message)
      console.error('   Backend URL:', BACKEND_URL)
      console.error('   Cause:', fetchError.cause)

      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        {
          error: 'Tidak dapat terhubung ke backend Python',
          details: `${fetchError.message}. Pastikan backend Python running di ${BACKEND_URL}`,
          backendUrl: BACKEND_URL
        },
        { status: 503 }
      )
    }

    if (!backendResponse.ok) {
      const error = await backendResponse.text()
      console.error('[PROCESS] ❌ Backend error:', error)

      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        { error: 'Gagal mengirim dokumen ke backend', details: error },
        { status: 500 }
      )
    }

    const backendData = await backendResponse.json()
    const jobId = backendData.job_id || backendData.task_id

    if (isDev) console.log(`[PROCESS] ✓ Backend response received - Job ID: ${jobId}`)

    // Save jobId to database for admin monitoring
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PROCESSING',
        jobId: jobId,
      },
    })

    if (isDev) console.log(`[PROCESS] ✅ Process completed successfully - Document status: PROCESSING`)

    return NextResponse.json({
      success: true,
      data: {
        documentId,
        jobId: jobId,
        status: 'PROCESSING',
        statusUrl: backendData.status_url,
      },
    })
  } catch (error: any) {
    if (isDev) {
      console.error('[PROCESS] ❌ Fatal error:', error)
      console.error('[PROCESS] Error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      })
    }

    // Try to update status to FAILED
    try {
      await prisma.document.update({
        where: { id: params.id },
        data: { status: 'FAILED' },
      })
    } catch { }

    return NextResponse.json(
      { error: 'Gagal memproses dokumen', details: error.message },
      { status: 500 }
    )
  }
}
