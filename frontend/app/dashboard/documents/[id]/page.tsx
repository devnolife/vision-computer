'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Download,
  File,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react'

interface Document {
  id: string
  title: string
  originalFilename: string
  fileSize: number
  status: string
  createdAt: string
  uploadPath: string
  pdfPath?: string
  pdfFilename?: string
  requiresApproval?: boolean
  approvalStatus?: string
  rejectionReason?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
  bypasses: Array<{
    id: string
    strategy: string
    status: string
    outputFilename: string
    successRate?: number
    flagsRemoved?: number
    createdAt: string
  }>
}

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [documentData, setDocumentData] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<any>(null)
  const [jobResult, setJobResult] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)

  const documentId = params.id as string

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  // Auto-refresh for processing documents
  useEffect(() => {
    if (!documentData || documentData.status !== 'PROCESSING' || !jobId) {
      return
    }

    // Initial check immediately
    checkProcessingStatus()

    // Then poll every 5 minutes to avoid overwhelming the server
    const interval = setInterval(() => {
      checkProcessingStatus()
    }, 5 * 60 * 1000) // Check every 5 minutes (300000ms)

    return () => clearInterval(interval)
  }, [documentData?.status, jobId])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()

      if (data.success) {
        setDocumentData(data.data)
        console.log('[Document] Status:', data.data.status)
        console.log('[Document] Full data:', data.data)

        // Try to load jobId from localStorage or database
        const savedJobId = localStorage.getItem(`doc-job-${documentId}`)
        const dbJobId = data.data.jobId

        const activeJobId = dbJobId || savedJobId

        if (activeJobId) {
          console.log('[Document] Found jobId:', activeJobId, 'source:', dbJobId ? 'database' : 'localStorage')
          setJobId(activeJobId)

          // If document is already COMPLETED, fetch result immediately
          if (data.data.status === 'COMPLETED') {
            console.log('[Document] Status is COMPLETED, fetching result immediately...')
            // Set jobId first, then fetch in next tick
            setTimeout(() => {
              fetchJobResult()
            }, 100)
          }
        } else {
          console.log('[Document] No jobId found')
        }
      } else {
        throw new Error('Dokumen tidak ditemukan')
      }
    } catch (error) {
      console.error('[Document] Error fetching document:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengambil detail dokumen',
      })
      router.push('/dashboard/documents')
    } finally {
      setLoading(false)
    }
  }

  const checkProcessingStatus = async () => {
    if (!jobId) {
      console.warn('[Progress] No jobId available')
      return
    }

    try {
      console.log('[Progress] Checking status for jobId:', jobId)

      const response = await fetch(
        `/api/documents/${documentId}/process-status?jobId=${jobId}`
      )
      const data = await response.json()

      console.log('[Progress] Response:', data)

      if (data.success) {
        const { state, progress, result } = data.data

        // Update progress with state info
        const progressData = {
          ...progress,
          state: state,
          percent: progress?.percent || 0,
          current: progress?.current || 0,
          total: progress?.total || 13,
          message: progress?.message || 'Memproses dokumen...',
        }

        console.log('[Progress] Setting progress:', progressData)
        setProcessingProgress(progressData)

        // Refresh document to get updated status
        if (
          state === 'SUCCESS' ||
          state === 'COMPLETED' ||
          state === 'FAILURE' ||
          state === 'FAILED'
        ) {
          console.log('[Progress] Process complete:', state)

          // Fetch result jika sukses
          if (state === 'SUCCESS' || state === 'COMPLETED') {
            await fetchJobResult()
          }

          setTimeout(() => {
            fetchDocument()
            localStorage.removeItem(`doc-job-${documentId}`)
            setJobId(null)
          }, 500)
        }
      } else {
        console.error('[Progress] Request failed:', data)
      }
    } catch (error) {
      console.error('[Progress] Error checking status:', error)
    }
  }

  const fetchJobResult = async () => {
    if (!jobId) {
      console.log('[Result] No jobId available')
      return
    }

    try {
      console.log('[Result] 📡 Fetching result from Python backend...')
      console.log('[Result] Job ID:', jobId)

      const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
      const apiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || ''

      console.log('[Result] URL:', `${pythonApiUrl}/jobs/${jobId}/result`)

      const response = await fetch(`${pythonApiUrl}/jobs/${jobId}/result`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      })

      console.log('[Result] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Result] ❌ Failed to fetch result:', errorText)
        throw new Error(`Failed to fetch result: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[Result] ✅ Got result:', result)
      console.log('[Result] Statistics:')
      console.log('   - Total Flags:', result.total_flags)
      console.log('   - Total Matched:', result.total_matched)
      console.log('   - Match Percentage:', result.match_percentage)
      console.log('   - Total Replacements:', result.total_replacements)
      console.log('   - Output File:', result.output_file)

      setJobResult(result)

      toast({
        title: '✅ Proses Selesai!',
        description: `${result.total_matched} dari ${result.total_flags} flags berhasil di-bypass (${result.match_percentage?.toFixed(1)}%)`,
      })
    } catch (error) {
      console.error('[Result] Error fetching result:', error)
    }
  }

  const handleDownload = async (filename: string, isBypassResult: boolean = false) => {
    setDownloading(true)
    try {
      let response

      if (isBypassResult) {
        // Download dari Python backend untuk hasil bypass
        const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
        const apiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || ''

        console.log('[Download] 📥 Downloading bypass result from Python backend')
        console.log('[Download] URL:', `${pythonApiUrl}/bypass/download/${filename}`)

        toast({
          title: '⏳ Mengunduh...',
          description: 'Sedang mengunduh file hasil bypass',
        })

        response = await fetch(
          `${pythonApiUrl}/bypass/download/${encodeURIComponent(filename)}`,
          {
            method: 'GET',
            headers: {
              'X-API-Key': apiKey,
            },
          }
        )
      } else {
        // Download dari NextJS API untuk file original
        console.log('[Download] 📄 Downloading original file from Next.js API')
        console.log('[Download] URL:', `/api/files/download?filename=${filename}`)

        response = await fetch(
          `/api/files/download?filename=${encodeURIComponent(filename)}`
        )
      }

      console.log('[Download] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Download] ❌ Download failed:', errorText)
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log('[Download] ✅ Blob received, size:', blob.size, 'bytes')

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log('[Download] ✅ Download completed:', filename)

      toast({
        title: '✅ Berhasil',
        description: 'File berhasil didownload',
      })
    } catch (error: any) {
      console.error('[Download] ❌ Error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Gagal mengunduh file',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadResult = async () => {
    if (!jobResult?.output_file) {
      console.error('[DownloadResult] ❌ No output_file in jobResult')
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'File output tidak ditemukan',
      })
      return
    }

    console.log('[DownloadResult] 📦 Starting download...')
    console.log('[DownloadResult] Output file path:', jobResult.output_file)

    // Extract filename from path (outputs/unified_bypass_xxx.docx -> unified_bypass_xxx.docx)
    const filename = jobResult.output_file.split('/').pop()

    console.log('[DownloadResult] Extracted filename:', filename)
    console.log('[DownloadResult] Calling handleDownload with bypass flag = true')

    await handleDownload(filename, true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Selesai</span>
          </div>
        )
      case 'PROCESSING':
      case 'ANALYZING':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Proses</span>
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Gagal</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail dokumen...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/documents')}
            className="mb-6 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Card className="shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Dokumen tidak ditemukan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/documents')}
          className="mb-6 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dokumen
        </Button>

        {/* Header */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D1F8EF] rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="h-6 w-6 text-[#3674B5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {documentData.title}
                </h1>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {documentData.originalFilename}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(documentData.status)}
                {documentData.pdfPath && (
                  <span className="text-xs bg-[#A1E3F9] text-[#3674B5] px-2 py-1 rounded font-medium">
                    PDF ✓
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Status Banner */}
        {documentData.requiresApproval && documentData.approvalStatus === 'PENDING' && (
          <Card className="mb-6 shadow-sm border border-yellow-300 bg-yellow-50 rounded-xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    ⏳ Menunggu Persetujuan Admin
                  </h3>
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    Dokumen Anda sedang dalam antrian persetujuan admin. Proses dokumen akan dimulai secara otomatis setelah admin menyetujui dokumen ini. Anda akan menerima notifikasi setelah dokumen disetujui.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Status Banner */}
        {documentData.approvalStatus === 'REJECTED' && (
          <Card className="mb-6 shadow-sm border border-red-300 bg-red-50 rounded-xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">
                    ❌ Dokumen Ditolak
                  </h3>
                  <p className="text-xs text-red-800 leading-relaxed mb-2">
                    Dokumen Anda telah ditolak oleh admin. Silakan perbaiki dan upload ulang dokumen Anda.
                  </p>
                  {documentData.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-900">Alasan:</p>
                      <p className="text-xs text-red-800 mt-1">{documentData.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Status Banner */}
        {documentData.approvalStatus === 'APPROVED' && documentData.status === 'PENDING' && (
          <Card className="mb-6 shadow-sm border border-green-300 bg-green-50 rounded-xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-1">
                    ✅ Dokumen Disetujui
                  </h3>
                  <p className="text-xs text-green-800 leading-relaxed">
                    Dokumen Anda telah disetujui oleh admin. Anda dapat memulai proses bypass sekarang.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Monitoring Card - Compact */}
        {(documentData.status === 'PROCESSING' || documentData.status === 'ANALYZING') && (
          <Card className="mb-6 shadow-sm border border-blue-200 bg-blue-50 rounded-xl">
            <CardContent className="pt-4 pb-4">
              {processingProgress ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {processingProgress.message || 'Memproses dokumen...'}
                        </p>
                        <p className="text-xs text-blue-600">Halaman akan diperbarui otomatis</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">
                      {processingProgress.percent || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${processingProgress.percent || 0}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-blue-700">Menghubungkan ke server...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Info */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ukuran File</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatFileSize(documentData.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tanggal Upload</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(documentData.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {documentData.analysis && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Bendera</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {documentData.analysis.flagCount}
                    </p>
                  </div>
                  {documentData.analysis.similarityScore !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Similaritas</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {documentData.analysis.similarityScore.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-1.5" />
              File Dokumen
            </h3>
            <div className="space-y-2">
              {/* DOCX File */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {documentData.originalFilename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(documentData.fileSize)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(documentData.originalFilename)}
                  className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span className="text-xs">Download</span>
                </Button>
              </div>

              {/* PDF File */}
              {documentData.pdfPath && documentData.pdfFilename && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {documentData.pdfFilename}
                      </p>
                      <p className="text-xs text-gray-500">File Turnitin</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(documentData.pdfFilename!)}
                    className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Progress */}
        {processingProgress && documentData?.status === 'PROCESSING' && (
          <Card className="shadow-lg border-2 border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <Zap className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  Sedang Memproses Dokumen
                </h3>
                <span className="text-2xl font-bold text-blue-600">
                  {processingProgress.percent?.toFixed(0) || 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4 shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${processingProgress.percent || 0}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center gap-3 text-sm text-gray-700 mb-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <p className="font-medium">{processingProgress.message || 'Memproses dokumen...'}</p>
              </div>

              {/* Steps Counter */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Step {processingProgress.current || 0} dari {processingProgress.total || 13}
                </span>
                <span className="text-blue-600 font-semibold">
                  {processingProgress.state || 'PROCESSING'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Result - Modern Card */}
        {jobResult && documentData?.status === 'COMPLETED' && (
          <Card className="shadow-xl border-2 border-green-200 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Proses Selesai!</h3>
                    <p className="text-green-100 text-sm">Dokumen berhasil di-bypass</p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadResult}
                  disabled={downloading}
                  className="bg-white hover:bg-green-50 text-green-700 font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl h-12 px-6"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download Hasil
                    </>
                  )}
                </Button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {jobResult.total_flags}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Total Plagiarism</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {jobResult.total_matched}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Berhasil Di-bypass</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {jobResult.match_percentage?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Success Rate</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {jobResult.total_replacements}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Total Replacements</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">File Original:</span>
                  <span className="text-sm text-gray-900 font-semibold truncate ml-2" title={jobResult.original_filename}>
                    {jobResult.original_filename}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">File Turnitin:</span>
                  <span className="text-sm text-gray-900 font-semibold truncate ml-2" title={jobResult.turnitin_filename}>
                    {jobResult.turnitin_filename}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Total Halaman:</span>
                  <span className="text-sm text-gray-900 font-semibold">{jobResult.total_pages} halaman</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Total Highlights:</span>
                  <span className="text-sm text-gray-900 font-semibold">{jobResult.total_highlights || 0} highlights</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Metode:</span>
                  <span className="text-sm text-gray-900 font-semibold">{jobResult.method}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Document Type:</span>
                  <span className="text-sm text-gray-900 font-semibold">{jobResult.original_doc_type || 'DOCX'}</span>
                </div>
              </div>

              {/* Bypass Settings */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">Homoglyph Density</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {((jobResult.homoglyph_density || 0.95) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">Invisible Density</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {((jobResult.invisible_density || 0.40) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Matched vs Unmatched Warning */}
              {jobResult.total_unmatched > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        {jobResult.total_unmatched} item tidak dapat di-bypass
                      </p>
                      <p className="text-xs text-yellow-700">
                        Item ini mungkin tidak ditemukan dalam dokumen original atau memiliki similarity score terlalu rendah.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Matched Items Table */}
              {jobResult.matched_items && jobResult.matched_items.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Matched Items ({jobResult.total_matched})
                  </h4>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Flagged Text
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Matched Text
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-24">
                              Similarity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {jobResult.matched_items.slice(0, 10).map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="max-w-xs truncate" title={item.flagged_text}>
                                  {item.flagged_text}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <div className="max-w-md truncate" title={item.matched_text}>
                                  {item.matched_text}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.similarity_score === 100
                                  ? 'bg-green-100 text-green-800'
                                  : item.similarity_score >= 90
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {item.similarity_score}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {jobResult.matched_items.length > 10 && (
                      <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          Menampilkan 10 dari {jobResult.matched_items.length} matched items
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unmatched Items */}
              {jobResult.unmatched_items && jobResult.unmatched_items.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    Unmatched Items ({jobResult.total_unmatched})
                  </h4>
                  <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-red-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase">
                              Flagged Text
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase w-24">
                              Best Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {jobResult.unmatched_items.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-red-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.flagged_text}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  {item.best_score}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bypass History */}
        {documentData.bypasses && documentData.bypasses.length > 0 && (
          <Card className="shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-1.5" />
                Riwayat Bypass
              </h3>
              <div className="space-y-2">
                {documentData.bypasses.map((bypass) => (
                  <div
                    key={bypass.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {bypass.strategy}
                        </p>
                        {bypass.status === 'COMPLETED' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                            Selesai
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {bypass.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {new Date(bypass.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {bypass.outputFilename}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {bypass.successRate !== undefined && (
                          <span className="text-xs text-gray-600">
                            Success: {bypass.successRate.toFixed(1)}%
                          </span>
                        )}
                        {bypass.flagsRemoved !== undefined && (
                          <span className="text-xs text-gray-600">
                            Removed: {bypass.flagsRemoved}
                          </span>
                        )}
                      </div>
                    </div>
                    {bypass.status === 'COMPLETED' && bypass.outputFilename && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(bypass.outputFilename, true)}
                        className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3 flex-shrink-0"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        <span className="text-xs">Download</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
