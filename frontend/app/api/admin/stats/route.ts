import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Get overall system statistics
    const [
      totalUsers,
      totalDocuments,
      totalBypasses,
      activeUsers,
      documentsToday,
      bypassesCompleted,
      bypassesFailed,
      processingNow,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.bypassHistory.count(),
      prisma.user.count({
        where: {
          documents: {
            some: {
              uploadedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
        },
      }),
      prisma.document.count({
        where: {
          uploadedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          },
        },
      }),
      prisma.bypassHistory.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      prisma.bypassHistory.count({
        where: {
          status: 'FAILED',
        },
      }),
      prisma.bypassHistory.count({
        where: {
          status: {
            in: ['PENDING', 'QUEUED', 'PROCESSING'],
          },
        },
      }),
    ])

    // Get recent activity (last 5)
    const recentActivity = await prisma.activityLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Get top users by document count
    const topUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        documents: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            documents: true,
            bypasses: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDocuments,
          totalBypasses,
          activeUsers,
          documentsToday,
          bypassesCompleted,
          bypassesFailed,
          processingNow,
          successRate:
            totalBypasses > 0
              ? ((bypassesCompleted / totalBypasses) * 100).toFixed(1)
              : 0,
        },
        recentActivity,
        topUsers,
      },
    })
  } catch (error: any) {
    console.error('[ADMIN_STATS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get statistics', details: error.message },
      { status: 500 }
    )
  }
}
