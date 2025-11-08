'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatActivityAction, getActivityActionColor, getActivityActionIcon } from '@/lib/activity-formatter'
import {
  FileText,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'

interface AdminStats {
  overview: {
    totalUsers: number
    totalDocuments: number
    totalBypasses: number
    activeUsers: number
    documentsToday: number
    bypassesCompleted: number
    bypassesFailed: number
    processingNow: number
    successRate: string
  }
  recentActivity: Array<{
    id: string
    action: string
    resource: string
    createdAt: string
    user: {
      name: string
      email: string
    } | null
    details: any
  }>
  topUsers: Array<{
    id: string
    name: string
    email: string
    _count: {
      documents: number
      bypasses: number
    }
  }>
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchStats()
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchStats()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Dashboard Admin...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="p-8">
      {/* Dashboard Overview */}
      {stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overview.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.overview.activeUsers} aktif 7 hari terakhir</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Dokumen</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overview.totalDocuments}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.overview.documentsToday} diupload hari ini</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sedang Diproses</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overview.processingNow}</p>
                    <p className="text-xs text-gray-500 mt-1">Pekerjaan aktif</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tingkat Keberhasilan</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overview.successRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.overview.bypassesCompleted} selesai / {stats.overview.bypassesFailed} gagal
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</CardTitle>
                <CardDescription className="text-sm text-gray-500">Event sistem terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${getActivityActionColor(activity.action)}`}>
                          {getActivityActionIcon(activity.action)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{formatActivityAction(activity.action)}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.user?.name || 'Sistem'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-400">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Pengguna Teratas</CardTitle>
                <CardDescription className="text-sm text-gray-500">Pengguna paling aktif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900">{user._count.documents} dok</p>
                        <p className="text-xs text-gray-500">{user._count.bypasses} bypass</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
