'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Upload,
  File,
  X,
  CheckCircle,
  FileText,
  Clock,
  AlertCircle,
  Download,
  LogOut,
  User,
  Mail,
  Phone,
  Package as PackageIcon,
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Lock,
  Save
} from 'lucide-react'

interface Document {
  id: string
  title: string
  originalFilename: string
  status: string
  uploadedAt: string
  createdAt: string
  fileSize: number
  pdfPath?: string
  pdfFilename?: string
  requiresApproval?: boolean
  approvalStatus?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
}

interface UserProfile {
  name: string
  email: string
  username: string
  phone?: string
  institution?: string
  faculty?: string
  major?: string
  studentId?: string
  subscription?: {
    package: {
      name: string
      code: string
    }
    expiresAt: string
    isActive: boolean
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Upload Dialog State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [userPackage, setUserPackage] = useState<string>('FREE')
  const [uploading, setUploading] = useState(false)
  const [dragActiveDocx, setDragActiveDocx] = useState(false)
  const [dragActivePdf, setDragActivePdf] = useState(false)

  // Edit Profile Dialog State
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    faculty: '',
    major: '',
    studentId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocuments()
      fetchUserProfile()
    }
  }, [session])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/user/${session?.user?.id}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success && data.data) {
        setUserProfile(data.data)
        if (data.data.subscription?.package?.name) {
          setUserPackage(data.data.subscription.package.name)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleOpenEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        institution: userProfile.institution || '',
        faculty: userProfile.faculty || '',
        major: userProfile.major || '',
        studentId: userProfile.studentId || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async () => {
    // Validasi
    if (!editForm.name || !editForm.email) {
      toast({
        variant: 'destructive',
        title: 'Data Tidak Lengkap',
        description: 'Nama dan Email wajib diisi',
      })
      return
    }

    // Validasi password jika ingin diubah
    if (editForm.newPassword) {
      if (!editForm.currentPassword) {
        toast({
          variant: 'destructive',
          title: 'Password Lama Diperlukan',
          description: 'Masukkan password lama untuk mengubah password',
        })
        return
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Password Tidak Cocok',
          description: 'Password baru dan konfirmasi tidak cocok',
        })
        return
      }
      if (editForm.newPassword.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Password Terlalu Pendek',
          description: 'Password minimal 6 karakter',
        })
        return
      }
    }

    setIsSaving(true)

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        institution: editForm.institution || null,
        faculty: editForm.faculty || null,
        major: editForm.major || null,
        studentId: editForm.studentId || null,
      }

      // Tambahkan password jika ingin diubah
      if (editForm.newPassword) {
        payload.currentPassword = editForm.currentPassword
        payload.newPassword = editForm.newPassword
      }

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengupdate profile')
      }

      toast({
        title: 'Berhasil',
        description: 'Profile berhasil diupdate',
      })

      // Refresh profile data
      await fetchUserProfile()
      setEditProfileOpen(false)

      // Reset password fields
      setEditForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Upload handlers (sama seperti sebelumnya)
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

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Ukuran File Terlalu Besar',
        description: 'Ukuran file DOCX maksimal 10MB',
      })
      return
    }

    setSelectedDocxFile(file)
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

    const maxSize = 10 * 1024 * 1024
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedDocxFile) {
      toast({
        variant: 'destructive',
        title: 'File Belum Dipilih',
        description: 'Silakan pilih file DOCX terlebih dahulu',
      })
      return
    }

    if (!selectedPdfFile) {
      toast({
        variant: 'destructive',
        title: 'File PDF Belum Dipilih',
        description: 'File PDF Turnitin wajib diupload',
      })
      return
    }

    setUploading(true)

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

      // Generate auto title
      const fileNameWithoutExt = selectedDocxFile.name.replace(/\.[^/.]+$/, '')
      const timestamp = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/[/,]/g, '-').replace(/\s/g, '_')
      const autoTitle = `${fileNameWithoutExt}_${timestamp}`

      console.log('\n📝 [STEP 3] Creating document record in /api/documents/create...')
      const documentResponse = await fetch('/api/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: autoTitle,
          originalFilename: uploadData.data.docxFile.originalName,
          fileSize: uploadData.data.docxFile.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploadPath: uploadData.data.docxFile.path,
          userId: session?.user?.id,
          pdfPath: uploadData.data.pdfFile?.path || null,
          pdfFilename: uploadData.data.pdfFile?.originalName || null,
          fileHash: uploadData.data.docxFile.hash || null,
        }),
      })

      const documentData = await documentResponse.json()
      console.log('   Response status:', documentResponse.status)
      console.log('   Create success?', documentData.success ? '✅ YES' : '❌ NO')

      if (!documentData.success) {
        throw new Error(documentData.error || 'Gagal membuat record dokumen')
      }

      // Check if this is a duplicate document
      if (documentData.isDuplicate) {
        toast({
          title: 'Dokumen Duplikat Terdeteksi',
          description: documentData.message || 'Dokumen yang sama sudah pernah diproses. Hasil sebelumnya akan digunakan.',
          duration: 5000,
        })

        setSelectedDocxFile(null)
        setSelectedPdfFile(null)
        setUploadDialogOpen(false)
        fetchDocuments()
        return
      }

      const documentId = documentData.data.id
      const hasPdfFile = selectedPdfFile || documentData.data.pdfPath

      console.log('\n' + '='.repeat(70))
      console.log('📋 [CLIENT - DASHBOARD] Document created successfully')
      console.log('='.repeat(70))
      console.log('   Document ID:', documentId)
      console.log('   Title:', autoTitle)
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

        setSelectedDocxFile(null)
        setSelectedPdfFile(null)
        setUploadDialogOpen(false)
        fetchDocuments()
        return
      }

      // Trigger background processing (PDF is now required)
      if (hasPdfFile && documentId) {
        try {
          console.log('\n' + '🚀'.repeat(35))
          console.log('🚀 [CLIENT - DASHBOARD] CALLING NEXT.JS API TO PROCESS DOCUMENT')
          console.log('🚀'.repeat(35))
          console.log('   Document ID:', documentId)
          console.log('   Target Endpoint:', `/api/documents/${documentId}/process`)
          console.log('   Method: POST')
          console.log('   Timestamp:', new Date().toISOString())
          console.log('🚀'.repeat(35) + '\n')

          const fetchStartTime = Date.now()
          const processResponse = await fetch(`/api/documents/${documentId}/process`, {
            method: 'POST',
          })
          const fetchDuration = Date.now() - fetchStartTime

          console.log('\n' + '📡'.repeat(35))
          console.log(`📡 [CLIENT - DASHBOARD] RESPONSE RECEIVED in ${fetchDuration}ms`)
          console.log('📡'.repeat(35))
          console.log('   Status:', processResponse.status, processResponse.statusText)
          console.log('   OK?', processResponse.ok ? '✅ YES' : '❌ NO')
          console.log('📡'.repeat(35) + '\n')

          if (processResponse.ok) {
            const processData = await processResponse.json()

            // Save jobId to localStorage for progress tracking
            if (processData.data?.jobId) {
              localStorage.setItem(`doc-job-${documentId}`, processData.data.jobId)
            }

            toast({
              title: 'Proses Dimulai',
              description: 'Dokumen sedang diproses. Anda bisa melihat progressnya di halaman dokumen.',
            })

            setSelectedDocxFile(null)
            setSelectedPdfFile(null)
            setUploadDialogOpen(false)
            fetchDocuments()

            // Optional: Redirect to document detail page
            setTimeout(() => {
              router.push(`/dashboard/documents/${documentId}`)
            }, 1500)
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

            setSelectedDocxFile(null)
            setSelectedPdfFile(null)
            setUploadDialogOpen(false)
            fetchDocuments()
          }
        } catch (processError) {
          console.error('Error triggering process:', processError)
          toast({
            variant: 'warning',
            title: 'Upload Berhasil',
            description: 'Dokumen berhasil diupload, tapi gagal memulai proses otomatis. Silakan coba proses manual dari halaman dokumen.',
          })

          setSelectedDocxFile(null)
          setSelectedPdfFile(null)
          setUploadDialogOpen(false)
          fetchDocuments()
        }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return '-'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-xl text-xs font-bold shadow-md">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Selesai</span>
          </div>
        )
      case 'PROCESSING':
      case 'ANALYZING':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-bold shadow-md animate-pulse">
            <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '2s' }} />
            <span>Proses</span>
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-coral text-white rounded-xl text-xs font-bold shadow-md">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Gagal</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-md">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        )
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-brand-purple mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-brand-purple/30 opacity-20 mx-auto"></div>
          </div>
          <p className="text-brand-navy-dark font-medium mt-4">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container - Full Page Layout */}
      <div className="flex h-screen">

        {/* LEFT SIDE - Document List (70%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/40 backdrop-blur-sm">

          {/* Document List */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Search and Upload - Modern Header */}
            <div className="mb-6">
              {/* Title with Gradient */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-brand-blue mb-1">
                  Dokumen Saya
                </h2>
                <p className="text-brand-navy text-xs">Kelola dan proses dokumen Anda dengan mudah</p>
              </div>

              {/* Search and Upload Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-blue" />
                  <Input
                    type="text"
                    placeholder="Cari berdasarkan judul atau nama file..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm bg-white/80 backdrop-blur border-brand-blue-light/50 rounded-xl focus:ring-2 focus:ring-brand-aqua focus:border-transparent shadow-sm hover:shadow-md transition-all"
                  />
                </div>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-brand-purple hover:bg-brand-lavender text-white font-semibold px-4 h-9 text-sm rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Upload
                </Button>
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                {/* Ilustrasi */}
                <div className="mb-4">
                  {searchQuery ? (
                    <img
                      src="/assets/Document Searching.png"
                      alt="Searching documents"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  ) : (
                    <img
                      src="/assets/Document_Overload.png"
                      alt="No documents"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  )}
                </div>
                <h3 className="text-lg font-bold text-brand-navy-dark mb-1.5">
                  {searchQuery ? 'Tidak ada dokumen ditemukan' : 'Belum ada dokumen'}
                </h3>
                <p className="text-brand-navy text-sm mb-4 max-w-md">
                  {searchQuery ? 'Coba kata kunci lain atau hapus filter pencarian' : 'Mulai upload dokumen pertama Anda dan kelola plagiarisme dengan mudah'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-brand-purple hover:bg-brand-aqua text-white font-semibold px-5 py-2 text-sm rounded-xl shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload Dokumen
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden transform hover:scale-[1.01]"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon with Animation */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-brand-blue rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                          <div className="relative w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:rotate-3 transition-transform">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-3">
                              <h3 className="text-base font-bold text-brand-navy-dark truncate mb-0.5 group-hover:text-brand-blue transition-colors">
                                {doc.title}
                              </h3>
                              <p className="text-xs text-brand-navy truncate flex items-center gap-1.5">
                                <File className="h-3 w-3 text-brand-aqua" />
                                {doc.originalFilename}
                              </p>
                            </div>
                            {getStatusBadge(doc.status)}
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center gap-2 text-xs text-brand-navy mb-2">
                            <span className="flex items-center gap-1 bg-brand-secondary px-2 py-1 rounded-lg">
                              <Calendar className="h-3 w-3" />
                              {formatDate(doc.uploadedAt || doc.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 bg-brand-secondary px-2 py-1 rounded-lg">
                              <File className="h-3 w-3" />
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-brand-purple hover:bg-brand-lavender-light rounded-lg px-3 h-7 text-xs group-hover:bg-brand-blue-light transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/documents/${doc.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Profile Section (30%) */}
        <div className="w-80 bg-white backdrop-blur-xl border-l border-gray-200 flex flex-col">

          {/* Profile Header - Modern */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="relative mb-4">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-10 blur-lg"></div>

              {/* Profile Card */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-brand-sage-light">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-purple rounded-full blur opacity-40"></div>
                    <div className="relative w-12 h-12 bg-brand-purple rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-brand-navy-dark truncate">
                      {userProfile?.name || session?.user?.name || 'User'}
                    </h2>
                    <p className="text-xs text-brand-navy truncate">
                      {userProfile?.email || session?.user?.email || '-'}
                    </p>
                  </div>
                  {/* Logout Button */}
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-brand-coral hover:bg-brand-coral-light hover:text-brand-coral rounded-lg h-8 w-8 p-0"
                    title="Keluar"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Package Badge - Modern */}
                {userProfile?.subscription?.package && (
                  <div className="relative overflow-hidden p-3 bg-brand-peach rounded-xl shadow-md">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                    <div className="relative flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/30 backdrop-blur rounded-lg flex items-center justify-center">
                        <PackageIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white/80 mb-0.5">Paket Aktif</p>
                        <p className="text-sm font-bold text-white">
                          {userProfile.subscription.package.name}
                        </p>
                        {userProfile.subscription.expiresAt && (
                          <p className="text-xs text-white/70 mt-0.5">
                            Berakhir: {formatDate(userProfile.subscription.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details - Modern */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                Data Diri
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEditProfile}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs rounded-lg"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-2">
              {/* Nama Lengkap */}
              <div className="flex items-start gap-2 p-2.5 bg-white backdrop-blur rounded-xl border border-gray-200 hover:border-brand-purple hover:bg-gray-50 transition-all">
                <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-navy mb-0.5">Nama Lengkap</p>
                  <p className="text-xs font-semibold text-brand-navy-dark">
                    {userProfile?.name || session?.user?.name || '-'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2 p-2.5 bg-white backdrop-blur rounded-xl border border-gray-200 hover:border-brand-blue hover:bg-gray-50 transition-all">
                <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-navy mb-0.5">Email</p>
                  <p className="text-xs font-semibold text-brand-navy-dark truncate">
                    {userProfile?.email || session?.user?.email || '-'}
                  </p>
                </div>
              </div>

              {/* Phone */}
              {userProfile?.phone && (
                <div className="flex items-start gap-2 p-2.5 bg-white backdrop-blur rounded-xl border border-gray-200 hover:border-brand-coral hover:bg-gray-50 transition-all">
                  <div className="w-8 h-8 bg-brand-coral rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-navy mb-0.5">Telepon</p>
                    <p className="text-xs font-semibold text-brand-navy-dark">
                      {userProfile.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              {(userProfile?.institution || userProfile?.faculty || userProfile?.major || userProfile?.studentId) && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-brand-navy-dark mb-4">Informasi Akademik</h3>
                </div>
              )}

              {/* Institution */}
              {userProfile?.institution && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-navy mb-0.5">Institusi</p>
                    <p className="text-sm font-medium text-brand-navy-dark">
                      {userProfile.institution}
                    </p>
                  </div>
                </div>
              )}

              {/* Faculty */}
              {userProfile?.faculty && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-navy mb-0.5">Fakultas</p>
                    <p className="text-sm font-medium text-brand-navy-dark">
                      {userProfile.faculty}
                    </p>
                  </div>
                </div>
              )}

              {/* Major/Jurusan */}
              {userProfile?.major && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-brand-aqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-navy mb-0.5">Program Studi</p>
                    <p className="text-sm font-medium text-brand-navy-dark">
                      {userProfile.major}
                    </p>
                  </div>
                </div>
              )}

              {/* Student ID */}
              {userProfile?.studentId && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-navy mb-0.5">NIM/NIS</p>
                    <p className="text-sm font-medium text-brand-navy-dark">
                      {userProfile.studentId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-purple rounded-xl flex items-center justify-center shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-brand-navy-dark">
                  Edit Profile
                </DialogTitle>
                <p className="text-sm text-brand-navy mt-0.5">Update informasi pribadi dan akademik Anda</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Data Pribadi */}
            <div>
              <h3 className="text-sm font-semibold text-brand-navy-dark mb-3">Data Pribadi</h3>
              <div className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Telepon */}
                <div>
                  <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                    Nomor Telepon
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="081234567890"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Informasi Akademik */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-brand-navy-dark mb-3">Informasi Akademik</h3>
              <div className="space-y-4">
                {/* Institusi */}
                <div>
                  <Label htmlFor="edit-institution" className="text-sm font-medium text-gray-700">
                    Institusi/Universitas
                  </Label>
                  <Input
                    id="edit-institution"
                    type="text"
                    value={editForm.institution}
                    onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                    placeholder="Contoh: Universitas Indonesia"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Fakultas */}
                <div>
                  <Label htmlFor="edit-faculty" className="text-sm font-medium text-gray-700">
                    Fakultas
                  </Label>
                  <Input
                    id="edit-faculty"
                    type="text"
                    value={editForm.faculty}
                    onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                    placeholder="Contoh: Fakultas Ilmu Komputer"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Program Studi */}
                <div>
                  <Label htmlFor="edit-major" className="text-sm font-medium text-gray-700">
                    Program Studi/Jurusan
                  </Label>
                  <Input
                    id="edit-major"
                    type="text"
                    value={editForm.major}
                    onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                    placeholder="Contoh: Sistem Informasi"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* NIM/NIS */}
                <div>
                  <Label htmlFor="edit-studentId" className="text-sm font-medium text-gray-700">
                    NIM/NIS
                  </Label>
                  <Input
                    id="edit-studentId"
                    type="text"
                    value={editForm.studentId}
                    onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                    placeholder="Contoh: 2021010001"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Ubah Password */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-brand-navy-dark mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Ubah Password (Opsional)
              </h3>
              <div className="space-y-4">
                {/* Password Lama */}
                <div>
                  <Label htmlFor="edit-current-password" className="text-sm font-medium text-gray-700">
                    Password Lama
                  </Label>
                  <Input
                    id="edit-current-password"
                    type="password"
                    value={editForm.currentPassword}
                    onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    placeholder="Masukkan password lama"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Password Baru */}
                <div>
                  <Label htmlFor="edit-new-password" className="text-sm font-medium text-gray-700">
                    Password Baru
                  </Label>
                  <Input
                    id="edit-new-password"
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <Label htmlFor="edit-confirm-password" className="text-sm font-medium text-gray-700">
                    Konfirmasi Password Baru
                  </Label>
                  <Input
                    id="edit-confirm-password"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password baru"
                    className="mt-1.5"
                    disabled={isSaving}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tips:</strong> Kosongkan field password jika tidak ingin mengubah password
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 h-11 text-base bg-brand-purple hover:bg-brand-blue text-white font-semibold shadow-lg"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </div>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProfileOpen(false)}
                disabled={isSaving}
                className="px-8 h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog - Modern Design (sama seperti sebelumnya) */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-brand-navy-dark">
                  Upload Dokumen Baru
                </DialogTitle>
                <p className="text-sm text-brand-navy mt-0.5">Unggah dokumen DOCX dan PDF Turnitin</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-blue-900 mb-1">
                    ℹ️ Informasi Penting
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>• Dokumen akan menunggu persetujuan admin sebelum diproses</li>
                    <li>• Proses dimulai otomatis setelah disetujui</li>
                    <li>• Kedua file (DOCX + PDF) wajib diupload</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* DOCX Upload */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                <Label className="text-base font-semibold text-brand-navy-dark">
                  File DOCX Original <span className="text-brand-coral">*</span>
                </Label>
              </div>
              {!selectedDocxFile ? (
                <div
                  onDragEnter={handleDragDocx}
                  onDragLeave={handleDragDocx}
                  onDragOver={handleDragDocx}
                  onDrop={handleDropDocx}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${dragActiveDocx
                    ? 'border-brand-blue bg-blue-50 scale-105'
                    : 'border-gray-300 hover:border-brand-blue hover:bg-gray-50'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src="/assets/Upload_File.png"
                    alt="Upload file"
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                  <p className="text-base font-semibold text-brand-navy-dark mb-1">
                    Drag & drop file DOCX
                  </p>
                  <p className="text-sm text-brand-navy mb-4">Atau klik untuk memilih file</p>
                  <p className="text-xs text-brand-aqua">
                    Format: .docx | Maksimal: 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-brand-blue rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <File className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-navy-dark truncate">
                          {selectedDocxFile.name}
                        </p>
                        <p className="text-xs text-brand-navy mt-0.5">
                          {formatFileSize(selectedDocxFile.size)}
                        </p>
                        <div className="flex items-center mt-2">
                          <CheckCircle className="h-4 w-4 text-brand-primary mr-1.5" />
                          <span className="text-xs text-brand-primary font-medium">
                            File siap diupload
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDocxFile}
                      disabled={uploading}
                      className="text-brand-coral hover:bg-brand-coral-light hover:text-brand-coral h-9 w-9 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Upload */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-purple rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                <Label className="text-base font-semibold text-brand-navy-dark">
                  File PDF Turnitin <span className="text-brand-coral">*</span>
                </Label>
              </div>
              {!selectedPdfFile ? (
                <div
                  onDragEnter={handleDragPdf}
                  onDragLeave={handleDragPdf}
                  onDragOver={handleDragPdf}
                  onDrop={handleDropPdf}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${dragActivePdf
                    ? 'border-purple-400 bg-purple-50 scale-105'
                    : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src="/assets/Upload_File.png"
                    alt="Upload PDF file"
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    Drag & drop file PDF
                  </p>
                  <p className="text-sm text-gray-600 mb-4">Atau klik untuk memilih file</p>
                  <p className="text-xs text-gray-400">
                    Format: .pdf | Maksimal: 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <File className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {selectedPdfFile.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatFileSize(selectedPdfFile.size)}
                        </p>
                        <div className="flex items-center mt-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                          <span className="text-xs text-green-700 font-medium">
                            File siap diupload
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePdfFile}
                      disabled={uploading}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 h-9 w-9 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Info Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                <div className="w-5 h-5 bg-amber-500 rounded-full mr-2 flex items-center justify-center text-xs text-white font-bold">i</div>
                Informasi Penting
              </h4>
              <ul className="text-xs text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">✓</span>
                  <span>File DOCX original <strong>wajib</strong> diunggah</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">✓</span>
                  <span>File PDF Turnitin <strong>wajib</strong> diunggah</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">✓</span>
                  <span>Ukuran file maksimal <strong>10MB</strong> per file</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">✓</span>
                  <span>Nama otomatis: <strong>NamaFile_Paket_KodeUnik</strong></span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading || !selectedDocxFile || !selectedPdfFile}
                className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengupload DOCX + PDF...
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    {selectedDocxFile && selectedPdfFile ? 'Upload DOCX + PDF' : 'Upload Dokumen'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedDocxFile(null)
                  setSelectedPdfFile(null)
                }}
                disabled={uploading}
                className="px-8 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
