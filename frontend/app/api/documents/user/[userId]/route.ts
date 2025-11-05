import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId }
    if (status) {
      where.status = status
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: {
          id: true,
          title: true,
          originalFilename: true,
          fileSize: true,
          status: true,
          uploadedAt: true,
          uploadPath: true,
          pdfPath: true,
          requiresApproval: true,
          approvalStatus: true,
          rejectionReason: true,
          analysis: {
            select: {
              flagCount: true,
              similarityScore: true,
            },
          },
          bypasses: {
            where: {
              status: 'COMPLETED',
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              strategy: true,
              outputFilename: true,
              outputPath: true,
              createdAt: true,
              flagsRemoved: true,
              successRate: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    console.error('[USER_DOCUMENTS_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil dokumen pengguna', details: error.message },
      { status: 500 }
    )
  }
}
