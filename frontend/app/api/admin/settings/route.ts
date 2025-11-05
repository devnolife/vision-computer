import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/settings
 * Get all system settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    // Get all settings from database
    const settingsRecords = await prisma.systemSetting.findMany({
      select: {
        key: true,
        value: true,
        description: true,
      },
    })

    // Convert to key-value map
    const settings: Record<string, any> = {}

    settingsRecords.forEach((record) => {
      try {
        // Try to parse as JSON first
        settings[record.key] = JSON.parse(record.value)
      } catch {
        // If not JSON, use as string
        settings[record.key] = record.value
      }
    })

    // Set defaults if not found
    const response = {
      autoApproveDocuments: settings.autoApproveDocuments ?? false,
      autoApproveMaxFileSize: settings.autoApproveMaxFileSize ?? 10,
      requirePaymentVerification: settings.requirePaymentVerification ?? true,
      enableEmailNotifications: settings.enableEmailNotifications ?? false,
      maintenanceMode: settings.maintenanceMode ?? false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ADMIN] Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings
 * Update system settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      autoApproveDocuments,
      autoApproveMaxFileSize,
      requirePaymentVerification,
      enableEmailNotifications,
      maintenanceMode,
    } = body

    // Update or create each setting
    const updates = [
      {
        key: 'autoApproveDocuments',
        value: JSON.stringify(autoApproveDocuments),
        description: 'Automatically approve documents that meet validation criteria',
      },
      {
        key: 'autoApproveMaxFileSize',
        value: JSON.stringify(autoApproveMaxFileSize),
        description: 'Maximum file size in MB for auto-approval',
      },
      {
        key: 'requirePaymentVerification',
        value: JSON.stringify(requirePaymentVerification),
        description: 'Require payment verification before using features',
      },
      {
        key: 'enableEmailNotifications',
        value: JSON.stringify(enableEmailNotifications),
        description: 'Send email notifications for important events',
      },
      {
        key: 'maintenanceMode',
        value: JSON.stringify(maintenanceMode),
        description: 'Enable maintenance mode to disable user access',
      },
    ]

    // Use transaction to update all settings atomically
    await prisma.$transaction(
      updates.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            description: setting.description,
            updatedBy: session.user.id,
          },
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updatedBy: session.user.id,
          },
        })
      )
    )

    console.log(`[ADMIN] ✅ Settings updated by ${session.user.name}`)
    console.log(`  - Auto-Approve: ${autoApproveDocuments}`)
    console.log(`  - Max File Size: ${autoApproveMaxFileSize} MB`)
    console.log(`  - Payment Verification: ${requirePaymentVerification}`)
    console.log(`  - Email Notifications: ${enableEmailNotifications}`)
    console.log(`  - Maintenance Mode: ${maintenanceMode}`)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('[ADMIN] Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
