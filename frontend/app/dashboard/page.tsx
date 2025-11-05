'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Upload, File, X, CheckCircle } from 'lucide-react'

interface Document {
  id: string
  title: string
  originalFilename: string
  status: string
  uploadedAt: string
  fileSize: number
  requiresApproval?: boolean
  approvalStatus?: string
  rejectionReason?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
  bypasses: Array<{
    id: string
    outputFilename: string
    outputPath: string
    flagsRemoved?: number
    successRate?: number
    createdAt: string
  }>
}

interface DocumentStats {
  total: number
  completed: number
  processing: number
  failed: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Upload Dialog State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActiveDocx, setDragActiveDocx] = useState(false)
  const [dragActivePdf, setDragActivePdf] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocuments()
    }
  }, [session])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `/api/documents/user/${session?.user?.id}?limit=5`
      )
      const data = await response.json()

      if (data.success) {
        setDocuments(data.data.documents)

        // Calculate stats
        const allDocs = data.data.documents
        setStats({
          total: allDocs.length,
          completed: allDocs.filter((d: Document) => d.status === 'COMPLETED').length,
          processing: allDocs.filter((d: Document) =>
            ['PENDING', 'ANALYZING', 'PROCESSING'].includes(d.status)
          ).length,
          failed: allDocs.filter((d: Document) => d.status === 'FAILED').length,
        })
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(
        `/api/files/download?filename=${encodeURIComponent(filename)}`
      )

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        variant: 'success',
        title: 'Berhasil',
        description: 'File berhasil diunduh',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengunduh file',
      })
    }
  }

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  // Upload Dialog Handlers
  const handleDragDocx = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveDocx(true)
    } else if (e.type === 'dragleave') {
      setDragActiveDocx(false)
    }
  }

  const handleDragPdf = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActivePdf(true)
    } else if (e.type === 'dragleave') {
      setDragActivePdf(false)
    }
  }

  const handleDropDocx = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveDocx(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelectDocx(e.dataTransfer.files[0])
    }
  }

  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActivePdf(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelectPdf(e.dataTransfer.files[0])
    }
  }

  const handleFileSelectDocx = (file: File) => {
    if (!file.name.endsWith('.docx')) {
      toast({
        variant: 'destructive',
        title: 'Format File Tidak Valid',
        description: 'File DOCX harus berformat .docx',
      })
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Ukuran File Terlalu Besar',
        description: 'Ukuran file DOCX maksimal 10MB',
      })
      return
    }

    setSelectedDocxFile(file)

    const fileNameWithoutExt = file.name.replace(/\.docx$/i, '')
    const timestamp = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/[/,]/g, '-').replace(/\s/g, '_')
    setTitle(`${fileNameWithoutExt}_${timestamp}`)
  }

  const handleFileSelectPdf = (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      toast({
        variant: 'destructive',
        title: 'Format File Tidak Valid',
        description: 'File Turnitin harus berformat .pdf',
      })
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Ukuran File Terlalu Besar',
        description: 'Ukuran file PDF maksimal 10MB',
      })
      return
    }

    setSelectedPdfFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.docx')) {
        handleFileSelectDocx(file)
      } else if (file.name.endsWith('.pdf')) {
        handleFileSelectPdf(file)
      }
    }
  }

  const handleRemoveDocxFile = () => {
    setSelectedDocxFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePdfFile = () => {
    setSelectedPdfFile(null)
  }

  const handleUpload = async () => {
    // ALERT UNTUK MEMASTIKAN FUNCTION DIPANGGIL
    alert('🎬 UPLOAD BUTTON CLICKED!\n\nDOCX: ' + (selectedDocxFile?.name || 'NO') + '\nPDF: ' + (selectedPdfFile?.name || 'NO'))

    console.log('\n' + '🎬'.repeat(35))
    console.log('🎬 [CLIENT] USER CLICKED UPLOAD BUTTON')
    console.log('🎬'.repeat(35))
    console.log('   Title:', title)
    console.log('   DOCX File:', selectedDocxFile?.name || 'NOT SELECTED')
    console.log('   PDF File:', selectedPdfFile?.name || 'NOT SELECTED')
    console.log('   DOCX Size:', selectedDocxFile?.size || 0, 'bytes')
    console.log('   PDF Size:', selectedPdfFile?.size || 0, 'bytes')
    console.log('🎬'.repeat(35) + '\n')

    if (!selectedDocxFile) {
      console.error('❌ [ERROR] No DOCX file selected!')
      toast({
        variant: 'destructive',
        title: 'Peringatan',
        description: 'Harap pilih file DOCX',
      })
      return
    }

    setUploading(true)
    console.log('⏳ Setting uploading state to TRUE...')

    try {
      console.log('\n📤 [STEP 1] Creating FormData...')
      const formData = new FormData()
      formData.append('docxFile', selectedDocxFile)

      if (selectedPdfFile) {
        formData.append('pdfFile', selectedPdfFile)
        console.log('   ✅ Added DOCX + PDF to FormData')
      } else {
        console.log('   ⚠️ Added DOCX only (NO PDF)')
      }

      console.log('\n📤 [STEP 2] Uploading files to /api/files/upload...')
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()
      console.log('   Response status:', uploadResponse.status)
      console.log('   Upload success?', uploadData.success ? '✅ YES' : '❌ NO')

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Gagal mengupload file')
      }

      console.log('\n📝 [STEP 3] Creating document record in /api/documents/create...')
      const documentResponse = await fetch('/api/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          originalFilename: uploadData.data.docxFile.originalName,
          fileSize: uploadData.data.docxFile.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploadPath: uploadData.data.docxFile.path,
          userId: session?.user?.id,
          pdfPath: uploadData.data.pdfFile?.path || null,
          pdfFilename: uploadData.data.pdfFile?.originalName || null,
        }),
      })

      const documentData = await documentResponse.json()
      console.log('   Response status:', documentResponse.status)
      console.log('   Create success?', documentData.success ? '✅ YES' : '❌ NO')

      if (!documentData.success) {
        throw new Error(documentData.error || 'Gagal membuat record dokumen')
      }

      const documentId = documentData.data.id
      const hasPdfFile = selectedPdfFile || documentData.data.pdfPath

      console.log('\n' + '='.repeat(70))
      console.log('📋 [CLIENT - DASHBOARD] Document created successfully')
      console.log('='.repeat(70))
      console.log('   Document ID:', documentId)
      console.log('   Title:', title)
      console.log('   Selected DOCX File:', selectedDocxFile?.name || 'NO')
      console.log('   Selected PDF File:', selectedPdfFile?.name || 'NO')
      console.log('   PDF Path in DB:', documentData.data.pdfPath || 'NO')
      console.log('   Has PDF?', hasPdfFile ? '✅ YES' : '❌ NO')
      console.log('   Will process?', hasPdfFile ? '✅ YES - Will call backend' : '❌ NO - Skipping backend')
      console.log('='.repeat(70) + '\n')

      if (!hasPdfFile) {
        console.warn('⚠️ [WARNING] No PDF Turnitin uploaded - skipping backend processing')
        toast({
          title: '📄 Dokumen Berhasil Diupload',
          description: 'Dokumen DOCX berhasil diupload. Upload PDF Turnitin untuk memulai proses bypass.',
        })

        setUploadDialogOpen(false)
        setSelectedDocxFile(null)
        setSelectedPdfFile(null)
        setTitle('')
        fetchDocuments()
        return
      }

      if (hasPdfFile && documentId) {
        try {
          // ALERT SEBELUM PANGGIL BACKEND
          alert('🚀 WILL CALL BACKEND!\n\nDocument ID: ' + documentId + '\nEndpoint: /api/documents/' + documentId + '/process')

          console.log('\n' + '🚀'.repeat(35))
          console.log('🚀 [CLIENT] CALLING NEXT.JS API TO PROCESS DOCUMENT')
          console.log('🚀'.repeat(35))
          console.log('   Document ID:', documentId)
          console.log('   Target Endpoint:', `/api/documents/${documentId}/process`)
          console.log('   Method: POST')
          console.log('   Timestamp:', new Date().toISOString())
          console.log('🚀'.repeat(35) + '\n')

          console.log('>>> Calling fetch() to Next.js API endpoint...')

          const fetchStartTime = Date.now()
          const processResponse = await fetch(`/api/documents/${documentId}/process`, {
            method: 'POST',
          })
          const fetchDuration = Date.now() - fetchStartTime

          // ALERT SETELAH DAPAT RESPONSE
          alert('📡 BACKEND RESPONDED!\n\nStatus: ' + processResponse.status + '\nOK: ' + processResponse.ok + '\nTime: ' + fetchDuration + 'ms')

          console.log('\n' + '📡'.repeat(35))
          console.log(`📡 [CLIENT] RESPONSE RECEIVED in ${fetchDuration}ms`)
          console.log('📡'.repeat(35))
          console.log('   Status:', processResponse.status, processResponse.statusText)
          console.log('   OK?', processResponse.ok ? '✅ YES' : '❌ NO')
          console.log('   Headers:', Object.fromEntries(processResponse.headers.entries()))
          console.log('📡'.repeat(35) + '\n')

          if (processResponse.ok) {
            const processData = await processResponse.json()

            if (processData.data?.jobId) {
              localStorage.setItem(`doc-job-${documentId}`, processData.data.jobId)
            }

            toast({
              variant: 'success',
              title: 'Proses Dimulai',
              description: 'Dokumen sedang diproses...',
            })

            // Close dialog and refresh
            setUploadDialogOpen(false)
            setSelectedDocxFile(null)
            setSelectedPdfFile(null)
            setTitle('')
            fetchDocuments()

            // Redirect to document detail
            setTimeout(() => {
              router.push(`/dashboard/documents/${documentId}`)
            }, 800)
          } else {
            // Process failed - check if it's approval required
            const errorData = await processResponse.json()

            if (errorData.requiresApproval) {
              toast({
                title: '⏳ Menunggu Persetujuan',
                description: errorData.message || 'Dokumen berhasil diupload dan sedang menunggu persetujuan admin.',
              })
            } else {
              toast({
                variant: 'destructive',
                title: 'Gagal Memproses',
                description: errorData.message || 'Dokumen berhasil diupload tapi gagal diproses otomatis.',
              })
            }

            // Close dialog and refresh
            setUploadDialogOpen(false)
            setSelectedDocxFile(null)
            setSelectedPdfFile(null)
            setTitle('')
            fetchDocuments()
          }
        } catch (processError) {
          console.error('Error triggering process:', processError)
          toast({
            variant: 'success',
            title: 'Upload Berhasil',
            description: 'Dokumen berhasil diupload',
          })

          setUploadDialogOpen(false)
          setSelectedDocxFile(null)
          setSelectedPdfFile(null)
          setTitle('')
          fetchDocuments()
        }
      } else {
        toast({
          variant: 'success',
          title: 'Berhasil',
          description: 'Dokumen berhasil diupload',
        })

        setUploadDialogOpen(false)
        setSelectedDocxFile(null)
        setSelectedPdfFile(null)
        setTitle('')
        fetchDocuments()
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal Upload',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupload',
      })
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50'
      case 'PROCESSING':
      case 'ANALYZING':
        return 'text-blue-600 bg-blue-50'
      case 'FAILED':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div>
      <div className="max-w-[1400px] mx-auto">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Main Stats Card */}
          <div className="col-span-12 lg:col-span-7">
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Aktivitas Dokumen</h2>
                  <p className="text-sm text-gray-500">Track your progress</p>
                </div>
                <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300">
                  <option>Minggu Ini</option>
                  <option>Bulan Ini</option>
                  <option>Tahun Ini</option>
                </select>
              </div>

              {/* Stats Display */}
              <div className="mb-8">
                <div className="text-sm text-gray-500 mb-2">{stats.total} Total Documents</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">+{stats.completed}</div>
                <p className="text-gray-500 text-sm">Documents processed this week</p>
              </div>

              {/* Chart Area - Simple Bar Visualization */}
              <div className="relative h-48 flex items-end justify-around gap-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                  const randomHeight = Math.random() * 80 + 40
                  const isToday = index === 3 // Wednesday as example
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative flex items-end justify-center" style={{ height: '160px' }}>
                        <div
                          className={`w-full ${isToday
                            ? 'bg-[#3674B5]'
                            : 'bg-[#A1E3F9]'
                            } rounded-lg transition-colors hover:bg-[#578FCA]`}
                          style={{ height: `${randomHeight}%` }}
                        ></div>
                      </div>
                      <div className={`mt-3 w-9 h-9 ${isToday ? 'bg-[#3674B5] text-white' : 'bg-[#D1F8EF] text-gray-700'} rounded-lg flex items-center justify-center font-medium`}>
                        <span className="text-xs">{day}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Documents */}
          <div className="col-span-12 lg:col-span-5">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Recent Documents</h3>
                  <p className="text-xs text-gray-500 mt-1">Your latest uploads</p>
                </div>
                <Link href="/dashboard/documents">
                  <button className="px-4 py-2 bg-[#A1E3F9] hover:bg-[#578FCA] text-gray-800 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    See All →
                  </button>
                </Link>
              </div>

              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Belum ada dokumen</p>
                    <Button
                      onClick={handleUploadClick}
                      className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-10 px-6 text-sm"
                    >
                      Upload Dokumen
                    </Button>
                  </div>
                ) : (
                  documents.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-[#D1F8EF] rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[#3674B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.status === 'COMPLETED' && (
                          <span className="px-2 py-1 bg-[#D1F8EF] text-[#3674B5] rounded-md text-xs font-medium">
                            Selesai
                          </span>
                        )}
                        {doc.status === 'PROCESSING' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            Diproses
                          </span>
                        )}
                        {doc.requiresApproval && doc.approvalStatus === 'PENDING' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Menunggu Persetujuan
                          </span>
                        )}
                        {doc.approvalStatus === 'APPROVED' && doc.status === 'PENDING' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                            Disetujui
                          </span>
                        )}
                        {doc.approvalStatus === 'REJECTED' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                            Ditolak
                          </span>
                        )}
                        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row - Three Cards */}
          {/* Quick Actions Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aksi Cepat</h3>
              <p className="text-sm text-gray-500 mb-6">Upload dan kelola dokumen Anda</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#D1F8EF] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#3674B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <button className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-sm">Upload Dokumen</p>
                    <p className="text-xs text-gray-500">Tambah dokumen baru</p>
                  </button>
                  <button className="w-8 h-8 bg-[#3674B5] hover:bg-[#578FCA] rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-white text-lg">+</span>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleUploadClick}
                className="w-full bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-11"
              >
                Upload Sekarang
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Stats Summary Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Ringkasan Status</h3>
              <p className="text-sm text-gray-500 mb-6">Statistik dokumen Anda</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dokumen Selesai</span>
                  <span className="text-2xl font-semibold text-gray-900">{stats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sedang Diproses</span>
                  <span className="text-2xl font-semibold text-gray-900">{stats.processing}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Dokumen</span>
                  <span className="text-2xl font-semibold text-gray-900">{stats.total}</span>
                </div>
              </div>

              <div className="mt-6 h-2 bg-[#A1E3F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3674B5] rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Tingkat Keberhasilan
              </p>
            </div>
          </div>

          {/* Activity Progress Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Progress Dokumen</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  Hari ini
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Berhasil diproses</span>
                    <span className="font-semibold text-gray-900">{stats.completed}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={`completed-${i}`}
                        className={`flex-1 h-12 rounded-md ${i < stats.completed ? 'bg-[#3674B5]' : 'bg-[#D1F8EF]'
                          }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Sedang diproses</span>
                    <span className="font-semibold text-gray-900">{stats.processing}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={`processing-${i}`}
                        className={`flex-1 h-12 rounded-md ${i < stats.processing ? 'bg-[#578FCA]' : 'bg-[#D1F8EF]'
                          }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Pending/Gagal</span>
                    <span className="font-semibold text-gray-900">{stats.failed}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={`failed-${i}`}
                        className={`flex-1 h-12 rounded-md ${i < stats.failed ? 'bg-[#A1E3F9]' : 'bg-[#D1F8EF]'
                          }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Upload Dokumen</DialogTitle>
            <DialogDescription>
              Unggah file DOCX dan opsional PDF Turnitin untuk analisis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* DOCX File Upload */}
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                File DOCX <span className="text-red-500">*</span>
              </Label>

              {!selectedDocxFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActiveDocx
                    ? 'border-[#3674B5] bg-blue-50'
                    : 'border-gray-300 hover:border-[#3674B5] hover:bg-gray-50'
                    }`}
                  onDragEnter={handleDragDocx}
                  onDragLeave={handleDragDocx}
                  onDragOver={handleDragDocx}
                  onDrop={handleDropDocx}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-16 h-16 bg-[#D1F8EF] rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#3674B5]" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag & drop file DOCX
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Atau klik untuk memilih file</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#3674B5] hover:bg-[#578FCA] text-white"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File DOCX
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">
                    Format: .docx | Maksimal: 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-[#D1F8EF] border border-[#578FCA] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-[#3674B5] rounded-lg flex items-center justify-center flex-shrink-0">
                        <File className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {selectedDocxFile.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatFileSize(selectedDocxFile.size)}
                        </p>
                        <div className="flex items-center mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-700 font-medium">
                            File siap diupload
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDocxFile}
                      disabled={uploading}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PDF File Upload (Optional) */}
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                File PDF Turnitin <span className="text-gray-500 text-sm">(Opsional)</span>
              </Label>

              {!selectedPdfFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActivePdf
                    ? 'border-[#578FCA] bg-blue-50'
                    : 'border-gray-300 hover:border-[#578FCA] hover:bg-gray-50'
                    }`}
                  onDragEnter={handleDragPdf}
                  onDragLeave={handleDragPdf}
                  onDragOver={handleDragPdf}
                  onDrop={handleDropPdf}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelectPdf(e.target.files[0])
                      }
                    }}
                    className="hidden"
                    disabled={uploading}
                    id="pdf-input"
                  />
                  <div className="w-16 h-16 bg-[#A1E3F9] rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#3674B5]" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag & drop file PDF
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Untuk analisis lebih akurat</p>
                  <Button
                    type="button"
                    onClick={() => document.getElementById('pdf-input')?.click()}
                    className="bg-[#578FCA] hover:bg-[#3674B5] text-white"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File PDF
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">
                    Format: .pdf | Maksimal: 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-[#A1E3F9] border border-[#578FCA] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-[#3674B5] rounded-lg flex items-center justify-center flex-shrink-0">
                        <File className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {selectedPdfFile.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatFileSize(selectedPdfFile.size)}
                        </p>
                        <div className="flex items-center mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-700 font-medium">
                            File siap diupload
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePdfFile}
                      disabled={uploading}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpload}
                disabled={!selectedDocxFile || uploading}
                className="flex-1 h-12 bg-[#3674B5] hover:bg-[#578FCA] text-white font-semibold disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengupload...
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    {selectedDocxFile && selectedPdfFile ? 'Upload Dokumen & PDF' : 'Upload Dokumen'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedDocxFile(null)
                  setSelectedPdfFile(null)
                  setTitle('')
                }}
                disabled={uploading}
                className="px-8 h-12"
              >
                Batal
              </Button>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium mb-2">Informasi:</p>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• File DOCX wajib diunggah</li>
                <li>• File PDF Turnitin opsional untuk analisis lebih akurat</li>
                <li>• Ukuran maksimal 10MB per file</li>
                <li>• Dokumen akan dianalisis secara otomatis setelah upload</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
