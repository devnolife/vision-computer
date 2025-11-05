import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan' },
        { status: 401 }
      )
    }

    const documentId = params.id

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        originalFilename: true,
        fileSize: true,
        fileType: true,
        uploadPath: true,
        uploadedAt: true,
        userId: true,
        status: true,
        pdfPath: true,
        pdfFilename: true,
        jobId: true,  // Include jobId for progress tracking
        jobStartedAt: true,
        jobCompletedAt: true,
        pageCount: true,
        wordCount: true,
        requiresApproval: true,
        approvalStatus: true,
        rejectionReason: true,
        analysis: true,
        bypasses: {
          select: {
            id: true,
            strategy: true,
            status: true,
            outputPath: true,
            outputFilename: true,
            flagsRemoved: true,
            processingTime: true,
            successRate: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (document.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke dokumen ini' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error: any) {
    console.error('[DOCUMENT_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil dokumen', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan' },
        { status: 401 }
      )
    }

    const documentId = params.id

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (document.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke dokumen ini' },
        { status: 403 }
      )
    }

    // Delete files from filesystem
    try {
      if (document.uploadPath) {
        const filePath = join(process.cwd(), 'uploads', 'documents', document.uploadPath.split('/').pop() || '')
        await unlink(filePath)
      }

      if (document.pdfPath) {
        const pdfPath = join(process.cwd(), 'uploads', 'documents', document.pdfPath.split('/').pop() || '')
        await unlink(pdfPath)
      }
    } catch (fileError) {
      console.warn('[FILE_DELETE_WARNING]', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil dihapus',
    })
  } catch (error: any) {
    console.error('[DOCUMENT_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal menghapus dokumen', details: error.message },
      { status: 500 }
    )
  }
}
