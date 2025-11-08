import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * PUT /api/profile/update
 * Update user profile (including email, password, and profile details)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const body = await request.json()
    const {
      name,
      email,
      phone,
      institution,
      faculty,
      major,
      studentId,
      currentPassword,
      newPassword
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama harus diisi' },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email harus diisi' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if new email already exists
    if (email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim() }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email sudah digunakan oleh user lain' },
          { status: 400 }
        )
      }
    }

    // Handle password change
    let hashedPassword = undefined
    if (newPassword && newPassword.trim()) {
      // Verify current password
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Password lama harus diisi untuk mengubah password' },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Password lama tidak valid' },
          { status: 400 }
        )
      }

      // Hash new password
      hashedPassword = await bcrypt.hash(newPassword, 10)
    }

    // Update user (name, email, and optionally password)
    const userUpdateData: any = {
      name: name.trim(),
      email: email.trim(),
    }

    if (hashedPassword) {
      userUpdateData.password = hashedPassword
    }

    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    })

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: name.trim(),
        phone: phone?.trim() || '',
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
        studentId: studentId?.trim() || null,
      },
      update: {
        fullName: name.trim(),
        phone: phone?.trim() || '',
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
        studentId: studentId?.trim() || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        resource: 'user_profile',
        resourceId: profile.id,
        details: {
          name,
          email,
          institution,
          faculty,
          major,
          studentId,
          passwordChanged: !!hashedPassword,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile berhasil diperbarui',
      data: profile,
    })
  } catch (error: any) {
    console.error('[PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui profile',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/profile/update
 * Update user profile (backward compatibility)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const body = await request.json()
    const { fullName, phone, institution, faculty, major } = body

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Nama lengkap harus diisi' },
        { status: 400 }
      )
    }

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: fullName.trim(),
        phone: phone?.trim() || '',
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
      },
      update: {
        fullName: fullName.trim(),
        phone: phone?.trim() || '',
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        resource: 'user_profile',
        resourceId: profile.id,
        details: {
          fullName,
          institution,
          faculty,
          major,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: profile,
    })
  } catch (error: any) {
    console.error('[PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui profil',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/update
 * Get current user's profile
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

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Profil belum diatur',
      })
    }

    return NextResponse.json({
      success: true,
      data: profile,
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
