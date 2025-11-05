'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate username
    if (username.length < 3) {
      setError('Username minimal 3 karakter')
      return
    }

    // Validate whatsapp
    if (whatsapp.length < 10) {
      setError('Nomor WhatsApp minimal 10 digit')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          email,
          whatsapp,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registrasi gagal')
        return
      }

      // Redirect to login page with username/email pre-filled
      const encodedIdentifier = encodeURIComponent(username || email)
      router.push(`/auth/login?registered=true&identifier=${encodedIdentifier}`)
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-brand-secondary/40">
      <div className="flex w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex lg:w-[30%] bg-gradient-to-br from-brand-primary to-brand-sage relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center w-full px-8 text-white">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 shadow-2xl mx-auto">
                <span className="text-4xl">🏠</span>
              </div>
              <h1 className="text-2xl font-bold mb-3 text-center text-white">Mulai Sekarang</h1>
              <p className="text-white/90 text-sm text-center">
                Bergabunglah dengan ratusan mahasiswa yang telah mempercayai platform kami untuk kesuksesan akademik mereka.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2 mt-8 w-full">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div className="font-semibold text-sm text-white">Proses Cepat & Mudah</div>
                </div>
                <div className="text-white/80 text-xs pl-6">Dokumen diproses dalam hitungan menit</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div className="font-semibold text-sm text-white">100% Aman & Privat</div>
                </div>
                <div className="text-white/80 text-xs pl-6">Data Anda terlindungi dengan enkripsi</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div className="font-semibold text-sm text-white">Support 24/7</div>
                </div>
                <div className="text-white/80 text-xs pl-6">Tim kami siap membantu kapan saja</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[70%] flex items-center justify-center p-8 bg-white overflow-y-auto">
          <div className="w-full max-w-2xl">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-4">
              <div className="inline-flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">🏠</span>
                </div>
                <span className="text-xl font-bold text-brand-navy-dark">Rumah Plagiasi</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-brand-navy-dark mb-1">Buat Akun Baru</h2>
              <p className="text-sm text-brand-navy">Daftar untuk mulai menggunakan layanan kami</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Row 1: Nama & Username */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm font-medium text-brand-navy-dark">Nama Lengkap</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="username" className="text-sm font-medium text-brand-navy-dark">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username login"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Row 2: Email & WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-brand-navy-dark">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="whatsapp" className="text-sm font-medium text-brand-navy-dark">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="08123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-brand-navy-dark">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-10 text-sm pr-10 border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-navy hover:text-brand-primary focus:outline-none z-10 cursor-pointer"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-brand-navy-dark">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-10 text-sm pr-10 border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-navy hover:text-brand-primary focus:outline-none z-10 cursor-pointer"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-brand-primary hover:bg-brand-sage text-white font-semibold text-sm mt-4 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Membuat akun...
                  </div>
                ) : (
                  'Daftar Sekarang'
                )}
              </Button>

              <div className="text-center space-y-2 pt-2">
                <p className="text-sm text-brand-navy">
                  Sudah punya akun?{' '}
                  <Link href="/auth/login" className="text-brand-primary hover:text-brand-sage font-semibold hover:underline">
                    Masuk
                  </Link>
                </p>
                <Link href="/" className="text-xs text-brand-navy hover:text-brand-primary transition block">
                  ← Kembali ke Beranda
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
