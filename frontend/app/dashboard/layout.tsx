'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)

  // Check subscription status
  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (!data.success || !data.data?.subscription?.package?.name) {
        // No active subscription, redirect to package selection
        router.push('/subscription/select-package')
        return
      }

      setSubscriptionChecked(true)
    } catch (error) {
      console.error('Error checking subscription:', error)
      // Redirect to package selection on error
      router.push('/subscription/select-package')
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      router.push('/admin')
    } else if (status === 'authenticated' && session?.user?.role === 'USER' && !subscriptionChecked) {
      checkSubscription()
    }
  }, [status, session, router, subscriptionChecked])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role === 'ADMIN') {
    return null
  }

  // Show loading while checking subscription
  if (!subscriptionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa Subscription...</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { key: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { key: '/dashboard/documents', label: 'Dokumen', icon: FileText },
    { key: '/dashboard/profile', label: 'Profil', icon: User },
  ]

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
