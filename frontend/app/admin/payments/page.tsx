'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Eye, Clock, Filter, CreditCard, CheckCircle, AlertCircle, Mail, Phone, Building, FileText, Calendar } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface PaymentProof {
  id: string
  status: string
  amount: number
  paymentMethod: string
  accountName: string
  transactionDate: string
  proofImageUrl: string
  createdAt: string
  notes: string | null
  rejectionReason: string | null
  adminNotes: string | null
  user: {
    id: string
    name: string
    email: string
    profile: {
      fullName: string
      phone: string
      institution: string | null
      faculty: string | null
      major: string | null
    } | null
  }
  subscription: {
    package: {
      code: string
      name: string
      price: number
      validityDays: number
    }
  }
}

export default function AdminPaymentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [payments, setPayments] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [verificationData, setVerificationData] = useState({
    action: 'VERIFY' as 'VERIFY' | 'REJECT',
    rejectionReason: '',
    adminNotes: '',
  })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchPayments()
    }
  }, [session, filter])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/admin/payments/pending?status=${filter}`)
      const data = await response.json()

      if (data.success) {
        setPayments(data.data.paymentProofs)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (payment: PaymentProof) => {
    setSelectedPayment(payment)
    setShowModal(true)
    setVerificationData({
      action: 'VERIFY',
      rejectionReason: '',
      adminNotes: '',
    })
  }

  const handleCloseDialog = (open: boolean) => {
    setShowModal(open)
    if (!open) {
      // Reset state when dialog closes
      setSelectedPayment(null)
      setVerificationData({
        action: 'VERIFY',
        rejectionReason: '',
        adminNotes: '',
      })
      setVerifying(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedPayment) {
      console.error('No payment selected')
      return
    }

    if (verificationData.action === 'REJECT' && !verificationData.rejectionReason.trim()) {
      toast({
        variant: 'warning',
        title: 'Peringatan',
        description: 'Alasan penolakan harus diisi',
      })
      return
    }

    console.log('Starting verification with data:', {
      paymentProofId: selectedPayment.id,
      action: verificationData.action,
      rejectionReason: verificationData.rejectionReason,
      adminNotes: verificationData.adminNotes,
    })

    setVerifying(true)

    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentProofId: selectedPayment.id,
          action: verificationData.action,
          rejectionReason: verificationData.rejectionReason || null,
          adminNotes: verificationData.adminNotes || null,
        }),
      })

      const data = await response.json()
      console.log('Verification response:', data)

      if (data.success) {
        toast({
          variant: 'success',
          title: 'Berhasil',
          description: data.message,
        })
        setShowModal(false)
        setSelectedPayment(null)
        fetchPayments()
      } else {
        console.error('Verification failed:', data)
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: data.error || 'Terjadi kesalahan yang tidak diketahui',
        })
      }
    } catch (error) {
      console.error('Error during verification:', error)
      toast({
        variant: 'destructive',
        title: 'Terjadi Kesalahan',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui',
      })
    } finally {
      setVerifying(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const verifiedCount = payments.filter(p => p.status === 'VERIFIED').length
  const rejectedCount = payments.filter(p => p.status === 'REJECTED').length

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified</p>
                  <p className="text-3xl font-bold text-gray-900">{verifiedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-gray-900">{rejectedCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex space-x-2 flex-wrap gap-2">
              <Button
                variant={filter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setFilter('PENDING')}
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending
              </Button>
              <Button
                variant={filter === 'VERIFIED' ? 'default' : 'outline'}
                onClick={() => setFilter('VERIFIED')}
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verified
              </Button>
              <Button
                variant={filter === 'REJECTED' ? 'default' : 'outline'}
                onClick={() => setFilter('REJECTED')}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejected
              </Button>
              <Button
                variant={filter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setFilter('ALL')}
                size="sm"
              >
                Semua
              </Button>
            </div>
          </div>
        </Card>

        {/* Payments List */}
        {payments.length === 0 ? (
          <Card className="p-12 text-center border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Tidak Ada Pembayaran</h3>
              <p className="text-sm text-gray-500">Tidak ada pembayaran dengan status {filter}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* User Info */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">User</p>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                          {payment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payment.user.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="truncate">{payment.user.email}</span>
                        </div>
                        {payment.user.profile && (
                          <>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span>{payment.user.profile.phone}</span>
                            </div>
                            {payment.user.profile.institution && (
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate">{payment.user.profile.institution}</span>
                              </div>
                            )}
                            {payment.user.profile.faculty && (
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate">{payment.user.profile.faculty}</span>
                              </div>
                            )}
                            {payment.user.profile.major && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate">{payment.user.profile.major}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Package & Payment Info */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Paket & Pembayaran</p>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-900">{payment.subscription.package.name}</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(payment.amount)}
                        </p>
                        <div className="pt-2 border-t border-gray-100 text-sm text-gray-600">
                          <p className="font-medium">{payment.paymentMethod}</p>
                          <p className="text-gray-500">{payment.accountName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tanggal</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Transfer</p>
                          <p className="text-gray-900 font-medium">{formatDate(payment.transactionDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Upload</p>
                          <p className="text-gray-900 font-medium">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex flex-col justify-between">
                      <div>
                        {payment.status === 'PENDING' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Pending
                          </span>
                        )}
                        {payment.status === 'VERIFIED' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Verified
                          </span>
                        )}
                        {payment.status === 'REJECTED' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            Rejected
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(payment)}
                        className="mt-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Detail Pembayaran
              </DialogTitle>
            </DialogHeader>

            {selectedPayment && (
              <div className="mt-4">

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Payment Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">User</p>
                      <p className="font-semibold">{selectedPayment.user.name}</p>
                      <p className="text-sm">{selectedPayment.user.email}</p>
                      {selectedPayment.user.profile && (
                        <>
                          <p className="text-sm">{selectedPayment.user.profile.fullName}</p>
                          <p className="text-sm">{selectedPayment.user.profile.phone}</p>
                          {selectedPayment.user.profile.institution && (
                            <p className="text-sm text-gray-600">{selectedPayment.user.profile.institution}</p>
                          )}
                          {selectedPayment.user.profile.faculty && (
                            <p className="text-sm text-gray-600">{selectedPayment.user.profile.faculty}</p>
                          )}
                          {selectedPayment.user.profile.major && (
                            <p className="text-sm text-gray-600">{selectedPayment.user.profile.major}</p>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Paket</p>
                      <p className="font-semibold">
                        {selectedPayment.subscription.package.name}
                      </p>
                      <p className="text-sm">
                        {formatPrice(selectedPayment.subscription.package.price)}
                        ({selectedPayment.subscription.package.validityDays} hari)
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Pembayaran</p>
                      <p className="font-semibold">{selectedPayment.paymentMethod}</p>
                      <p className="text-sm">a.n. {selectedPayment.accountName}</p>
                      <p className="text-sm">
                        Jumlah: {formatPrice(selectedPayment.amount)}
                      </p>
                    </div>

                    {selectedPayment.notes && (
                      <div>
                        <p className="text-sm text-gray-600">Catatan User</p>
                        <p className="text-sm">{selectedPayment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Proof Image */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Bukti Transfer</p>
                    <div className="relative h-96 border border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={selectedPayment.proofImageUrl}
                        alt="Bukti Transfer"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Form (only for PENDING) */}
                {selectedPayment.status === 'PENDING' && (
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Pilih Aksi</Label>
                      <div className="flex space-x-4 mt-2">
                        <Button
                          type="button"
                          onClick={() => setVerificationData({ ...verificationData, action: 'VERIFY' })}
                          className={`flex-1 h-12 font-semibold ${verificationData.action === 'VERIFY'
                            ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                            : 'bg-white hover:bg-green-50 text-green-600 border-2 border-green-600'
                            }`}
                        >
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Verifikasi
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setVerificationData({ ...verificationData, action: 'REJECT' })}
                          className={`flex-1 h-12 font-semibold ${verificationData.action === 'REJECT'
                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                            : 'bg-white hover:bg-red-50 text-red-600 border-2 border-red-600'
                            }`}
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Tolak
                        </Button>
                      </div>
                    </div>

                    {verificationData.action === 'REJECT' && (
                      <div>
                        <Label htmlFor="rejectionReason">
                          Alasan Penolakan <span className="text-red-500">*</span>
                        </Label>
                        <textarea
                          id="rejectionReason"
                          value={verificationData.rejectionReason}
                          onChange={(e) =>
                            setVerificationData({
                              ...verificationData,
                              rejectionReason: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Masukkan alasan penolakan..."
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="adminNotes">Catatan Admin (Opsional)</Label>
                      <textarea
                        id="adminNotes"
                        value={verificationData.adminNotes}
                        onChange={(e) =>
                          setVerificationData({
                            ...verificationData,
                            adminNotes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Catatan tambahan..."
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleCloseDialog(false)}
                    className="h-11"
                  >
                    Tutup
                  </Button>
                  {selectedPayment.status === 'PENDING' && (
                    <Button
                      onClick={handleVerify}
                      disabled={verifying}
                      className={`h-11 text-white font-semibold ${verificationData.action === 'VERIFY'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                      {verifying ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Memproses...
                        </div>
                      ) : verificationData.action === 'VERIFY' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verifikasi Pembayaran
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak Pembayaran
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
