'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Filter, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { useToast } from '@/hooks/use-toast'

interface Document {
  id: string
  title: string
  originalFilename: string
  status: string
  uploadedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  analysis?: {
    flagCount: number
    analyzedAt: string
  }
  bypasses: Array<{
    id: string
    strategy: string
    status: string
    progress: number
    createdAt: string
    completedAt?: string
    flagsRemoved?: number
    processingTime?: number
    errorMessage?: string
  }>
}

export default function AdminDocumentsPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents/all?limit=100')
      const data = await response.json()
      if (data.success) {
        setDocuments(data.data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
      case 'ANALYZING':
      case 'QUEUED':
        return 'bg-blue-100 text-blue-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove document from list
        setDocuments(documents.filter(d => d.id !== documentToDelete.id))

        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil dihapus',
        })
      } else {
        throw new Error(data.error || 'Gagal menghapus dokumen')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal menghapus dokumen',
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setDocumentToDelete(null)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dokumen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dokumen</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diproses</p>
                <p className="text-2xl font-bold text-blue-600">
                  {documents.filter(d => ['PROCESSING', 'ANALYZING', 'QUEUED'].includes(d.status)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gagal</p>
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter(d => d.status === 'FAILED').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6 border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari dokumen, user, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="COMPLETED">Selesai</option>
              <option value="PROCESSING">Diproses</option>
              <option value="ANALYZING">Analisis</option>
              <option value="QUEUED">Antrian</option>
              <option value="FAILED">Gagal</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center border shadow-sm">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Tidak ada dokumen yang sesuai dengan filter'
              : 'Belum ada dokumen'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">{doc.originalFilename}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>User: <span className="text-gray-700 font-medium">{doc.user.name}</span></span>
                          <span>•</span>
                          <span>{doc.user.email}</span>
                          <span>•</span>
                          <span>Upload: {formatDate(doc.uploadedAt)}</span>
                        </div>

                        {/* Progress Bar for Active Jobs */}
                        {doc.bypasses[0] && ['PENDING', 'QUEUED', 'PROCESSING'].includes(doc.bypasses[0].status) && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-700 font-medium">Progres Pemrosesan</span>
                              <span className="font-medium text-gray-900">{doc.bypasses[0].progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${doc.bypasses[0].progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Strategi: {doc.bypasses[0].strategy}
                            </p>
                          </div>
                        )}

                        {/* Completed Info */}
                        {doc.bypasses[0] && doc.bypasses[0].status === 'COMPLETED' && (
                          <div className="mt-3 flex gap-6 text-sm text-gray-700">
                            {doc.bypasses[0].flagsRemoved !== undefined && (
                              <span>Flag Dihapus: <span className="font-medium text-green-600">{doc.bypasses[0].flagsRemoved}</span></span>
                            )}
                            {doc.bypasses[0].processingTime && (
                              <span>Waktu Proses: <span className="font-medium text-blue-600">{doc.bypasses[0].processingTime}s</span></span>
                            )}
                          </div>
                        )}

                        {/* Error Info */}
                        {doc.bypasses[0] && doc.bypasses[0].status === 'FAILED' && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-700">
                              Error: {doc.bypasses[0].errorMessage || 'Error tidak diketahui'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" title="Lihat Detail">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen ini?
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium text-gray-900">{documentToDelete?.title}</p>
                <p className="text-sm text-gray-600 mt-1">{documentToDelete?.originalFilename}</p>
                <p className="text-sm text-gray-500 mt-1">
                  User: {documentToDelete?.user.name} ({documentToDelete?.user.email})
                </p>
              </div>
              <p className="mt-3 text-red-600 font-medium">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait dokumen akan dihapus permanen.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
