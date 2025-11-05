import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
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

    // Update document status to APPROVED
    await prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil disetujui',
    })
  } catch (error) {
    console.error('Error approving document:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
