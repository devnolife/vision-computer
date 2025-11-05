import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserActiveSubscription } from '@/lib/package-access'

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

    // Get user's active subscription
    const subscription = await getUserActiveSubscription(userId)

    const response = {
      success: true,
      data: {
        user: {
          id: userId,
          email: session.user.email,
          name: session.user.name,
        },
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          package: {
            code: subscription.package.code,
            name: subscription.package.name,
          },
          endDate: subscription.endDate,
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
