import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/profile
 * Get current user's profile with subscription information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        package: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile,
        subscription,
      },
    })
  } catch (error: any) {
    console.error('[PROFILE_GET_ERROR]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil profil',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
