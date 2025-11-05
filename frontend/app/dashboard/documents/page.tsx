'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  File,
  Download,
  Trash2,
  Eye,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  X,
  Zap,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRef } from 'react'

interface Document {
  id: string
  title: string
  originalFilename: string
  fileSize: number
  status: string
  createdAt?: string
  uploadedAt?: string
  uploadPath: string
  pdfPath?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
  bypasses: Array<{
    id: string
    strategy: string
    status: string
  }>
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Detail Dialog State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // Upload Dialog State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActiveDocx, setDragActiveDocx] = useState(false)
  const [dragActivePdf, setDragActivePdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userPackage, setUserPackage] = useState<string>('FREE')

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocuments()
      fetchUserPackage()
    }
  }, [session])

  const fetchUserPackage = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success && data.data?.subscription?.package?.name) {
        setUserPackage(data.data.subscription.package.name)
      } else {
        // Default to FREE if no subscription data
        setUserPackage('FREE')
      }
    } catch (error) {
      console.error('Error fetching user package:', error)
      // Default to FREE on error
      setUserPackage('FREE')
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/user/${session?.user?.id}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengambil daftar dokumen',
      })
    } finally {
      setLoading(false)
    }
  }

  const openDetailDialog = (doc: Document) => {
    setSelectedDocument(doc)
    setDetailDialogOpen(true)
  }

  const openDeleteDialog = (documentId: string) => {
    setDocumentToDelete(documentId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus dokumen')
      }

      setDocuments(documents.filter((d) => d.id !== documentToDelete))

      toast({
        variant: 'success',
        title: 'Berhasil',
        description: 'Dokumen berhasil dihapus',
      })

      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menghapus dokumen',
      })
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

  const getDocumentDate = (doc: Document) => {
    return doc.uploadedAt || doc.createdAt || null
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return '-'
    }
  }

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })
    } catch (error) {
      return '-'
    }
  }

  const formatDateMedium = (dateString: string | null | undefined) => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.docx')) {
        handleFileSelectDocx(file)
      } else {
        toast({
          variant: 'destructive',
          title: 'Format File Tidak Valid',
          description: 'Hanya file .docx yang diperbolehkan',
        })
      }
    }
  }

  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActivePdf(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.pdf')) {
        handleFileSelectPdf(file)
      } else {
        toast({
          variant: 'destructive',
          title: 'Format File Tidak Valid',
          description: 'Hanya file .pdf yang diperbolehkan',
        })
      }
    }
  }

  const handleFileSelectDocx = (file: File) => {
    if (!file.name.endsWith('.docx')) {
      toast({
        variant: 'destructive',
        title: 'Format File Tidak Valid',
        description: 'Dokumen utama harus berformat .docx',
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
      const formData = new FormData()
      formData.append('docxFile', selectedDocxFile)
      if (selectedPdfFile) {
        formData.append('pdfFile', selectedPdfFile)
      }

      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload gagal')
      }

      // Generate automatic title: filename_packagename_uniquecode
      const fileNameWithoutExt = selectedDocxFile.name.replace(/\.[^/.]+$/, '')
      const uniqueCode = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      const autoTitle = `${fileNameWithoutExt}_${userPackage}_${uniqueCode}`

      const createDocResponse = await fetch('/api/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: autoTitle,
          originalFilename: uploadData.data.docxFile.originalName,
          uploadPath: uploadData.data.docxFile.path,
          pdfPath: uploadData.data.pdfFile?.path || null,
          pdfFilename: uploadData.data.pdfFile?.originalName || null,
          fileSize: uploadData.data.docxFile.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          userId: session?.user?.id,
          fileHash: uploadData.data.docxFile.hash,
          pageCount: 0, // Will be updated after processing
          wordCount: 0, // Will be updated after processing
          characterCount: 0, // Will be updated after processing
        }),
      })

      if (!createDocResponse.ok) {
        throw new Error('Gagal membuat dokumen')
      }

      const createData = await createDocResponse.json()

      toast({
        variant: 'success',
        title: 'Berhasil',
        description: createData.message || 'Dokumen berhasil diupload',
      })

      // Reset form
      setSelectedDocxFile(null)
      setSelectedPdfFile(null)
      setUploadDialogOpen(false)

      // Refresh documents list
      fetchDocuments()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat upload',
      })
    } finally {
      setUploading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'ALL' || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dokumen...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dokumen Saya</h2>
            <p className="text-gray-500 text-xs">Kelola dan pantau dokumen yang sudah diunggah</p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium h-9 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Upload Dokumen</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg border-gray-200 focus:border-gray-300 focus:ring-gray-300"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white h-9"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="ANALYZING">Dianalisis</option>
                <option value="PROCESSING">Diproses</option>
                <option value="COMPLETED">Selesai</option>
                <option value="FAILED">Gagal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-3">
              {documents.length === 0
                ? 'Belum ada dokumen yang diunggah'
                : 'Tidak ada dokumen yang sesuai dengan pencarian'}
            </p>
            {documents.length === 0 && (
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium rounded-lg h-9 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Upload Dokumen Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#D1F8EF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="h-5 w-5 text-[#3674B5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.originalFilename}
                      </p>
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Ukuran</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Upload</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {formatDateShort(getDocumentDate(doc))}
                      </p>
                    </div>
                    {doc.analysis && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Bendera</p>
                          <p className="text-xs font-semibold text-gray-900">
                            {doc.analysis.flagCount}
                          </p>
                        </div>
                        {doc.analysis.similarityScore !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500">Similaritas</p>
                            <p className="text-xs font-semibold text-gray-900">
                              {doc.analysis.similarityScore.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {(doc as any).isDuplicate && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium" title="Dokumen ini menggunakan hasil dari dokumen yang sama yang pernah diproses">
                          Duplikat
                        </span>
                      )}
                      {doc.pdfPath && (
                        <span className="text-xs bg-[#A1E3F9] text-[#3674B5] px-2 py-1 rounded font-medium">
                          PDF ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(doc)}
                        className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="text-xs">Detail</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.originalFilename)}
                        className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(doc.id)}
                        className="h-8 px-3 text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-300 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <File className="h-5 w-5 text-[#3674B5]" />
                  {selectedDocument.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Document Info */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Ukuran File</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatFileSize(selectedDocument.fileSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tanggal Upload</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateMedium(getDocumentDate(selectedDocument))}
                        </p>
                      </div>
                      {selectedDocument.analysis && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Bendera</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedDocument.analysis.flagCount}
                            </p>
                          </div>
                          {selectedDocument.analysis.similarityScore !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500">Similaritas</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedDocument.analysis.similarityScore.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Files */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="pt-4 pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-1.5" />
                      File Dokumen
                    </h3>
                    <div className="space-y-2">
                      {/* DOCX */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedDocument.originalFilename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedDocument.fileSize)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(selectedDocument.originalFilename)}
                          className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span className="text-xs">Download</span>
                        </Button>
                      </div>

                      {/* PDF */}
                      {selectedDocument.pdfPath && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                PDF Turnitin
                              </p>
                              <p className="text-xs text-gray-500">File Turnitin</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument.originalFilename.replace('.docx', '.pdf'))}
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

                {/* Bypass History */}
                {selectedDocument.bypasses && selectedDocument.bypasses.length > 0 && (
                  <Card className="shadow-sm border border-gray-200">
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Zap className="h-4 w-4 mr-1.5" />
                        Riwayat Bypass ({selectedDocument.bypasses.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedDocument.bypasses.map((bypass) => (
                          <div
                            key={bypass.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
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
                              </div>
                              {bypass.status === 'COMPLETED' && (
                                <Button
                                  size="sm"
                                  className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3 ml-2"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Download</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#3674B5]" />
              Upload Dokumen Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* DOCX Upload Area */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">
                File DOCX <span className="text-red-500">*</span>
              </Label>
              {!selectedDocxFile ? (
                <div
                  onDragEnter={handleDragDocx}
                  onDragLeave={handleDragDocx}
                  onDragOver={handleDragDocx}
                  onDrop={handleDropDocx}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActiveDocx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Klik untuk upload atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Format: .docx (Maksimal 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedDocxFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedDocxFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDocxFile}
                    disabled={uploading}
                    className="h-8 px-3 text-red-600 hover:bg-red-50 border-red-200 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* PDF Upload Area (Required) */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">
                File PDF Turnitin <span className="text-red-500">*</span>
              </Label>
              {!selectedPdfFile ? (
                <div
                  onDragEnter={handleDragPdf}
                  onDragLeave={handleDragPdf}
                  onDragOver={handleDragPdf}
                  onDrop={handleDropPdf}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActivePdf
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Klik untuk upload atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Format: .pdf (Maksimal 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedPdfFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedPdfFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePdfFile}
                    disabled={uploading}
                    className="h-8 px-3 text-red-600 hover:bg-red-50 border-red-200 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>File DOCX original <strong>wajib</strong> diupload</li>
                    <li>File PDF Turnitin <strong>wajib</strong> diupload</li>
                    <li>Maksimal ukuran file: 10MB per file</li>
                    <li>Nama dokumen dibuat otomatis: NamaFile_Paket_KodeUnik</li>
                    <li>Dokumen akan diproses setelah upload berhasil</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedDocxFile(null)
                  setSelectedPdfFile(null)
                }}
                disabled={uploading}
                className="flex-1 h-10"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading || !selectedDocxFile || !selectedPdfFile}
                className="flex-1 h-10 bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengupload...
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Dokumen
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
