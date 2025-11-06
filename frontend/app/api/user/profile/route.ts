import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserActiveSubscription } from '@/lib/package-access'
import prisma from '@/lib/prisma'

/**
 * GET /api/user/profile
 * Get user profile with subscription package info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    })

    // Get user's active subscription
    const subscription = await getUserActiveSubscription(userId)

    const response = {
      success: true,
      data: {
        name: user?.name || session.user.name,
        email: user?.email || session.user.email,
        username: user?.email?.split('@')[0] || 'user',
        phone: user?.profile?.phone || null,
        institution: user?.profile?.institution || null,
        faculty: user?.profile?.faculty || null,
        major: user?.profile?.major || null,
        studentId: user?.profile?.studentId || null,
        subscription: subscription ? {
          package: {
            code: subscription.package.code,
            name: subscription.package.name,
          },
          expiresAt: subscription.endDate,
          isActive: subscription.isActive,
        } : null,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil profil user'
      },
      { status: 500 }
    )
  }
}
