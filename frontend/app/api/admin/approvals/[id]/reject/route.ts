import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { reason } = await request.json()

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Alasan penolakan harus diisi' },
        { status: 400 }
      )
    }

    const documentId = params.id

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update document status to REJECTED
    await prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil ditolak',
    })
  } catch (error) {
    console.error('Error rejecting document:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
