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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📄</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Rumah Plagiasi</span>
            </div>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.key || (item.key === '/dashboard/documents' && pathname.startsWith('/dashboard/documents'))
                return (
                  <button
                    key={item.key}
                    onClick={() => router.push(item.key)}
                    className={`${isActive
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                      } px-4 py-2 text-sm font-medium transition-colors`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden lg:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your search request..."
                    className="w-64 px-4 py-2 pl-10 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Notification Icon */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* User Profile */}
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="flex items-center space-x-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">User</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
