'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, CreditCard, Calendar, User, FileImage } from 'lucide-react'
import Image from 'next/image'

interface Package {
  id: string
  code: string
  name: string
  description: string
  price: number
  currency: string
  validityDays: number
}

function PaymentForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('packageId')

  const [pkg, setPackage] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    paymentMethod: '',
    accountName: '',
    accountNumber: '',
    amount: '',
    transactionDate: '',
    notes: '',
    file: null as File | null,
  })

  useEffect(() => {
    if (!packageId) {
      router.push('/subscription/select-package')
      return
    }

    fetchPackage()
  }, [packageId])

  const fetchPackage = async () => {
    try {
      const response = await fetch('/api/packages')
      const data = await response.json()

      if (data.success) {
        const selectedPkg = data.data.find((p: Package) => p.id === packageId)
        if (selectedPkg) {
          setPackage(selectedPkg)
          setFormData((prev) => ({
            ...prev,
            amount: selectedPkg.price.toString(),
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching package:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar (JPEG, PNG, WebP)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }

      setFormData({ ...formData, file })
      setError('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    if (!formData.file) {
      setError('Silakan upload bukti pembayaran')
      setUploading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', formData.file)
      formDataToSend.append('packageId', packageId!)
      formDataToSend.append('paymentMethod', formData.paymentMethod)
      formDataToSend.append('accountName', formData.accountName)
      formDataToSend.append('accountNumber', formData.accountNumber || '')
      formDataToSend.append('amount', formData.amount)
      formDataToSend.append('transactionDate', formData.transactionDate)
      formDataToSend.append('notes', formData.notes || '')

      const response = await fetch('/api/payment/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to verification status page
        router.push('/subscription/verification-status')
      } else {
        setError(data.error || 'Gagal upload bukti pembayaran')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
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

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <Card className="p-8 text-center shadow-xl border-2">
          <p className="text-gray-600 mb-4">Paket tidak ditemukan</p>
          <Button onClick={() => router.push('/subscription/select-package')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Kembali
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <CreditCard className="text-white h-7 w-7" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Rumah Plagiasi
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Pembayaran Paket
          </h1>
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg border border-gray-200">
            <span className="text-gray-600 font-medium">{pkg.name}</span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(pkg.price)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Payment Instructions - Left Side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Bank Accounts Card */}
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600">
              <div className="p-6 text-white">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">
                    Informasi Rekening
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* BCA Account */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xs">BCA</span>
                          </div>
                          <p className="font-bold text-lg">Bank BCA</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-mono text-base font-semibold">1234567890</p>
                          <p className="text-white/80">a.n. <span className="font-semibold">Rumah Plagiasi</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mandiri Account */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-xs">MDR</span>
                          </div>
                          <p className="font-bold text-lg">Bank Mandiri</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-mono text-base font-semibold">0987654321</p>
                          <p className="text-white/80">a.n. <span className="font-semibold">Rumah Plagiasi</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Total Payment Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Total Pembayaran</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  {formatPrice(pkg.price)}
                </p>
                <p className="text-xs text-gray-500">
                  Berlaku {pkg.validityDays} hari setelah aktivasi
                </p>
              </div>
            </Card>

            {/* Instructions Card */}
            <Card className="border-0 shadow-xl bg-white">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-blue-600 text-sm">ℹ️</span>
                  </div>
                  Cara Pembayaran
                </h3>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                    <span>Transfer sesuai nominal ke salah satu rekening di atas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                    <span>Simpan bukti transfer Anda</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                    <span>Upload bukti transfer melalui form</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                    <span>Tunggu verifikasi admin (maksimal 1×24 jam)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">✓</span>
                    <span className="font-medium text-green-600">Akun Anda akan aktif setelah diverifikasi</span>
                  </li>
                </ol>
              </div>
            </Card>
          </div>

          {/* Upload Form - Right Side */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-2xl bg-white sticky top-6">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upload Bukti Transfer
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                        Metode Pembayaran <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        placeholder="Transfer Bank BCA"
                        required
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountName" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Nama Pengirim <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="accountName"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleChange}
                        placeholder="Nama sesuai rekening"
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 mb-2">
                        Nomor Rekening (Opsional)
                      </Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="1234567890"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="transactionDate" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        Tanggal Transfer <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="transactionDate"
                        name="transactionDate"
                        type="date"
                        value={formData.transactionDate}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2">
                      Jumlah Transfer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                      <Input
                        id="amount"
                        name="amount"
                        type="text"
                        value={formatPrice(pkg.price)}
                        readOnly
                        disabled
                        className="h-11 pl-10 bg-gray-100 cursor-not-allowed text-gray-700 font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah sesuai harga paket yang dipilih
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2">
                      Catatan (Opsional)
                    </Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={3}
                      placeholder="Tambahkan catatan jika diperlukan..."
                    />
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <Label htmlFor="file" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileImage className="h-4 w-4 mr-2 text-gray-500" />
                      Bukti Transfer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="mt-2">
                      <label
                        htmlFor="file"
                        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${previewUrl
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                      >
                        {previewUrl ? (
                          <div className="relative w-full h-full p-4">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              fill
                              className="object-contain rounded-lg"
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                              <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-base font-semibold text-gray-700 mb-2">
                              Klik untuk upload gambar
                            </p>
                            <p className="text-sm text-gray-500 mb-1">
                              atau drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              JPEG, PNG, WebP (Maksimal 5MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="file"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                      {previewUrl && (
                        <p className="mt-2 text-sm text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Gambar berhasil dipilih
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/subscription/select-package')}
                      className="flex-1 h-12 border-2 hover:bg-gray-50 font-medium"
                    >
                      Kembali
                    </Button>
                    <Button
                      type="submit"
                      disabled={uploading || !formData.file}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                          Upload Bukti Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentForm />
    </Suspense>
  )
}
