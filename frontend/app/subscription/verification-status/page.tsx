'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, XCircle, AlertCircle, LogOut, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'

interface PaymentStatus {
  accountStatus: string
  isActive: boolean
  hasProfile: boolean
  latestPaymentProof: {
    id: string
    status: string
    amount: number
    paymentMethod: string
    transactionDate: string
    proofImageUrl: string
    verifiedAt: string | null
    rejectionReason: string | null
    adminNotes: string | null
    package: {
      code: string
      name: string
      price: number
      validityDays: number
    }
  } | null
  activeSubscription: {
    id: string
    status: string
    startDate: string | null
    endDate: string | null
    documentsUsed: number
    package: {
      code: string
      name: string
      maxDocuments: number
    }
  } | null
}

export default function VerificationStatusPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      }

      const response = await fetch('/api/payment/status')
      const data = await response.json()

      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
      if (showRefreshing) {
        setRefreshing(false)
      }
    }
  }

  const handleRefresh = () => {
    fetchStatus(true)
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
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const payment = status?.latestPaymentProof
  const subscription = status?.activeSubscription

  // Check if user can access dashboard (verified payment or active subscription)
  const canAccessDashboard =
    payment?.status === 'VERIFIED' ||
    subscription?.status === 'ACTIVE'

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button - Only show if can access dashboard */}
          {canAccessDashboard && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="h-10"
              >
                ← Kembali ke Dashboard
              </Button>
            </div>
          )}

          {/* Logout Button - Show if cannot access dashboard */}
          {!canAccessDashboard && (
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Silakan tunggu verifikasi pembayaran untuk mengakses dashboard
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="h-10 text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}

          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">🏠</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Rumah Plagiasi
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Status Verifikasi
            </h1>
            <p className="text-gray-600">
              Lihat status pembayaran dan langganan Anda
            </p>
          </div>
        </div>

        {/* Payment Status Card */}
        {payment && (
          <Card className="p-6 mb-6 shadow-xl border-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Bukti Pembayaran
                </h2>
                <p className="text-sm text-gray-600">
                  {payment.package.name}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {payment.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Menunggu Verifikasi</span>
                  </div>
                )}
                {payment.status === 'VERIFIED' && (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Terverifikasi</span>
                  </div>
                )}
                {payment.status === 'REJECTED' && (
                  <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">Ditolak</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Metode Pembayaran</p>
                  <p className="font-semibold">{payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jumlah Transfer</p>
                  <p className="font-semibold">{formatPrice(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Transfer</p>
                  <p className="font-semibold">{formatDate(payment.transactionDate)}</p>
                </div>
                {payment.verifiedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Verifikasi</p>
                    <p className="font-semibold">{formatDate(payment.verifiedAt)}</p>
                  </div>
                )}
              </div>

              {/* Payment Proof Image */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Bukti Transfer</p>
                <div className="relative h-48 border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={payment.proofImageUrl}
                    alt="Bukti Transfer"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {payment.status === 'PENDING' && (
              <div className="mt-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Sedang Diproses</p>
                      <p>
                        Pembayaran Anda sedang dalam proses verifikasi oleh admin.
                        Mohon tunggu maksimal 1x24 jam. Kami akan mengaktifkan akun Anda
                        setelah pembayaran diverifikasi.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center space-x-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Memperbarui...' : 'Refresh Status'}
                  </Button>
                </div>
              </div>
            )}

            {payment.status === 'VERIFIED' && (
              <div className="mt-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Pembayaran Terverifikasi</p>
                      <p>
                        Selamat! Pembayaran Anda telah diverifikasi. Akun Anda sekarang aktif
                        dan Anda dapat menggunakan semua fitur sesuai paket yang dipilih.
                      </p>
                      {payment.adminNotes && (
                        <p className="mt-2">
                          <span className="font-semibold">Catatan Admin:</span> {payment.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="h-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Lanjut ke Dashboard
                  </Button>
                </div>
              </div>
            )}

            {payment.status === 'REJECTED' && (
              <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Pembayaran Ditolak</p>
                    {payment.rejectionReason && (
                      <p className="mb-2">
                        <span className="font-semibold">Alasan:</span> {payment.rejectionReason}
                      </p>
                    )}
                    {payment.adminNotes && (
                      <p className="mb-2">
                        <span className="font-semibold">Catatan:</span> {payment.adminNotes}
                      </p>
                    )}
                    <p>
                      Silakan upload ulang bukti pembayaran yang valid atau hubungi
                      customer service untuk bantuan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Active Subscription Card */}
        {subscription && subscription.status === 'ACTIVE' && (
          <Card className="p-6 mb-6 shadow-xl border-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Langganan Aktif
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 mb-1 font-semibold">Paket</p>
                <p className="text-lg font-semibold text-blue-900">
                  {subscription.package.name}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 mb-1 font-semibold">Masa Aktif</p>
                <p className="text-sm font-semibold text-green-900">
                  {subscription.startDate && formatDate(subscription.startDate)}
                  {' - '}
                  {subscription.endDate && formatDate(subscription.endDate)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 mb-1 font-semibold">Dokumen Digunakan</p>
                <p className="text-lg font-semibold text-purple-900">
                  {subscription.documentsUsed}
                  {subscription.package.maxDocuments > 0
                    ? ` / ${subscription.package.maxDocuments}`
                    : ' / Unlimited'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Mulai Gunakan Layanan
              </Button>
            </div>
          </Card>
        )}

        {/* No Payment Yet */}
        {!payment && (
          <Card className="p-8 text-center shadow-xl border-2">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Pembayaran
            </h3>
            <p className="text-gray-600 mb-6">
              Anda belum melakukan upload bukti pembayaran. Silakan pilih paket dan
              upload bukti pembayaran untuk mengaktifkan akun.
            </p>
            <Button
              onClick={() => router.push('/subscription/select-package')}
              className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Pilih Paket
            </Button>
          </Card>
        )}

        {/* Rejected - Reupload Button */}
        {payment?.status === 'REJECTED' && (
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/subscription/select-package')}
              className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Upload Ulang Bukti Pembayaran
            </Button>
          </div>
        )}

        {/* Footer Info */}
        {!canAccessDashboard && (
          <Card className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <p className="text-center text-sm text-gray-700">
              💡 Tetap di halaman ini untuk melihat progress verifikasi. Anda akan dapat mengakses dashboard setelah pembayaran diverifikasi.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
