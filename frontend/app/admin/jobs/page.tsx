'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, CheckCircle, XCircle, Loader2, RefreshCw, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JobDocument {
  id: string
  title: string
  status: string
  jobId: string | null
  jobStartedAt: string | null
  jobCompletedAt: string | null
  uploadedAt: string
  user: {
    name: string
    email: string
  }
  progress?: {
    state: string
    percent: number
    message: string
  }
}

export default function JobMonitorPage() {
  const [jobs, setJobs] = useState<JobDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const response = await fetch('/api/admin/jobs')
      const data = await response.json()

      if (data.success) {
        setJobs(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkJobProgress = async (jobId: string, documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/process-status?jobId=${jobId}`)
      const data = await response.json()

      if (data.success) {
        return {
          state: data.data.state,
          percent: data.data.progress?.percent || 0,
          message: data.data.progress?.message || 'Processing...',
        }
      }
    } catch (error) {
      console.error('Failed to check job progress:', error)
    }

    return null
  }

  useEffect(() => {
    fetchJobs()

    // Auto-refresh every 30 seconds to reduce server load
    const interval = setInterval(() => {
      fetchJobs(true)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check progress for active jobs
    const checkActiveJobs = async () => {
      const activeJobs = jobs.filter(job =>
        (job.status === 'PROCESSING' || job.status === 'ANALYZING') && job.jobId
      )

      for (const job of activeJobs) {
        if (job.jobId) {
          const progress = await checkJobProgress(job.jobId, job.id)
          if (progress) {
            setJobs(prev => prev.map(j =>
              j.id === job.id
                ? { ...j, progress }
                : j
            ))
          }
        }
      }
    }

    if (jobs.length > 0) {
      checkActiveJobs()
    }
  }, [jobs.length])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'Memproses' },
      ANALYZING: { color: 'bg-purple-100 text-purple-800', icon: Activity, label: 'Menganalisis' },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Selesai' },
      FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Gagal' },
      PENDING: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Menunggu' },
    }

    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className={`h-3.5 w-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'

    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const calculateDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return '-'

    const start = new Date(startDate).getTime()
    const end = endDate ? new Date(endDate).getTime() : Date.now()
    const diff = end - start

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}j ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const activeJobs = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'ANALYZING')
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED')
  const failedJobs = jobs.filter(j => j.status === 'FAILED')

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Memuat data job...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif</p>
                <p className="text-3xl font-bold text-blue-600">{activeJobs.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selesai</p>
                <p className="text-3xl font-bold text-green-600">{completedJobs.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gagal</p>
                <p className="text-3xl font-bold text-red-600">{failedJobs.length}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Monitoring Job Real-time</h2>
        <Button
          onClick={() => {
            setRefreshing(true)
            fetchJobs()
          }}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Job Processing</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada job yang sedang berjalan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dokumen</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu Mulai</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-500 truncate">ID: {job.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">{job.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{job.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-4 py-4">
                        {job.jobId ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {job.jobId.slice(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {job.progress && (job.status === 'PROCESSING' || job.status === 'ANALYZING') ? (
                          <div className="space-y-1 min-w-[200px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{job.progress.message}</span>
                              <span className="font-medium text-gray-900">{job.progress.percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${job.progress.percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(job.jobStartedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {calculateDuration(job.jobStartedAt, job.jobCompletedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
