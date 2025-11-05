'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2,
  Shield,
  Zap,
  FileText,
  Clock,
  Users,
  ArrowRight,
  Star,
  Sparkles,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react'
import { PackageData } from '@/lib/fallback-packages'

interface LandingClientProps {
  packages: PackageData[]
}

export default function LandingClient({ packages }: LandingClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/auth/register')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-light/40 via-white to-brand-lavender-light/30 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-brand-blue-light to-brand-aqua-light rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-brand-lavender-light to-brand-blue-light rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-brand-primary/20 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">🏠</span>
              </div>
              <span className="text-xl font-bold text-brand-navy-dark">
                Rumah Plagiasi
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-brand-navy hover:text-brand-primary transition-colors font-medium text-sm">
                Fitur
              </a>
              <a href="#pricing" className="text-brand-navy hover:text-brand-primary transition-colors font-medium text-sm">
                Harga
              </a>
              <a href="#testimonials" className="text-brand-navy hover:text-brand-primary transition-colors font-medium text-sm">
                Testimoni
              </a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {session ? (
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-brand-navy-dark hover:bg-brand-navy text-white"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="text-brand-navy hover:text-brand-primary">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-md">
                      Daftar Gratis
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition font-medium">
                  Fitur
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition font-medium">
                  Harga
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition font-medium">
                  Testimoni
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  {session ? (
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="bg-brand-navy-dark hover:bg-brand-navy"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button variant="ghost" className="w-full text-brand-navy">
                          Masuk
                        </Button>
                      </Link>
                      <Link href="/auth/register">
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary/90">
                          Daftar Gratis
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-brand-blue-light border border-brand-blue/30 text-brand-blue-dark px-4 py-2 rounded-full mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-brand-blue" />
              <span className="text-sm font-medium">Solusi Terpercaya untuk Dokumen Anda</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-brand-navy-dark mb-6 leading-tight">
              Bypass Plagiarism Detection
              <br />
              <span className="bg-gradient-to-r from-brand-blue via-brand-aqua to-brand-primary bg-clip-text text-transparent">
                Dengan Mudah & Aman
              </span>
            </h1>

            <p className="text-xl text-brand-navy mb-10 max-w-3xl mx-auto leading-relaxed">
              Platform terpercaya untuk membantu Anda melewati sistem deteksi plagiarism
              dengan teknologi AI terkini. Cepat, aman, dan terjamin hasilnya.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-brand-blue-dark hover:bg-brand-blue text-white text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 border-2 border-brand-aqua text-brand-aqua hover:bg-brand-aqua-light"
              >
                Lihat Harga
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-navy-dark mb-2">1000+</div>
                <div className="text-brand-navy font-medium">Dokumen Diproses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-navy-dark mb-2">98%</div>
                <div className="text-brand-navy font-medium">Tingkat Sukses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-navy-dark mb-2">500+</div>
                <div className="text-brand-navy font-medium">Pengguna Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-navy-dark mb-2">24/7</div>
                <div className="text-brand-navy font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy-dark mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-xl text-brand-navy max-w-2xl mx-auto">
              Kami menyediakan solusi terbaik dengan fitur-fitur unggulan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-blue/20 hover:border-brand-blue/50 bg-gradient-to-br from-white to-brand-blue-light/30">
              <div className="w-12 h-12 bg-brand-blue-light rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Zap className="h-6 w-6 text-brand-blue-dark" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                Proses Super Cepat
              </h3>
              <p className="text-brand-navy leading-relaxed">
                Dokumen Anda diproses dalam hitungan menit. Tidak perlu menunggu lama untuk mendapatkan hasil terbaik.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-aqua/20 hover:border-brand-aqua/50 bg-gradient-to-br from-white to-brand-aqua-light/30">
              <div className="w-12 h-12 bg-brand-aqua-light rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Shield className="h-6 w-6 text-brand-aqua" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                100% Aman & Privat
              </h3>
              <p className="text-brand-navy leading-relaxed">
                Data Anda dijamin aman. Kami tidak menyimpan atau membagikan dokumen Anda kepada pihak manapun.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-purple/20 hover:border-brand-purple/50 bg-gradient-to-br from-white to-brand-purple-light/40">
              <div className="w-12 h-12 bg-brand-purple-light rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <FileText className="h-6 w-6 text-brand-purple" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                Multi Format
              </h3>
              <p className="text-brand-navy leading-relaxed">
                Mendukung berbagai format dokumen: DOCX, PDF, ODT, dan masih banyak lagi.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-lavender/30 hover:border-brand-lavender/60 bg-gradient-to-br from-white to-brand-lavender-light/40">
              <div className="w-12 h-12 bg-brand-lavender-light rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <TrendingUp className="h-6 w-6 text-brand-lavender" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                Tingkat Sukses Tinggi
              </h3>
              <p className="text-brand-navy leading-relaxed">
                98% tingkat keberhasilan dalam melewati sistem deteksi plagiarism terkenal.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-primary/20 hover:border-brand-primary/50 bg-gradient-to-br from-white to-brand-secondary/50">
              <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Users className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                Support 24/7
              </h3>
              <p className="text-brand-navy leading-relaxed">
                Tim kami siap membantu Anda kapan saja. Chat, email, atau telepon - kami ada untuk Anda.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-peach/30 hover:border-brand-peach/60 bg-gradient-to-br from-white to-brand-peach-light/40">
              <div className="w-12 h-12 bg-brand-peach-light rounded-lg flex items-center justify-center mb-6 shadow-sm">
                <Award className="h-6 w-6 text-brand-peach" />
              </div>
              <h3 className="text-xl font-semibold text-brand-navy-dark mb-3">
                Garansi Kepuasan
              </h3>
              <p className="text-brand-navy leading-relaxed">
                Tidak puas? Kami berikan revisi gratis atau uang kembali 100%. Kepuasan Anda prioritas kami.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-brand-sky via-brand-mist to-brand-lavender-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy-dark mb-4">
              Pilih Paket yang Sesuai
            </h2>
            <p className="text-xl text-brand-navy max-w-2xl mx-auto">
              Harga terjangkau dengan hasil maksimal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => {
              const colors = [
                { border: 'border-brand-blue/30', bg: 'bg-gradient-to-br from-white to-brand-blue-light/40', ring: 'ring-brand-blue/20', badge: 'bg-brand-blue-dark', button: 'bg-brand-blue-dark hover:bg-brand-blue', check: 'text-brand-blue' },
                { border: 'border-brand-purple/30', bg: 'bg-gradient-to-br from-white to-brand-purple-light/50', ring: 'ring-brand-purple/20', badge: 'bg-brand-purple', button: 'bg-brand-purple hover:bg-brand-purple/90', check: 'text-brand-purple' },
                { border: 'border-brand-aqua/30', bg: 'bg-gradient-to-br from-white to-brand-aqua-light/40', ring: 'ring-brand-aqua/20', badge: 'bg-brand-aqua', button: 'bg-brand-aqua hover:bg-brand-aqua/90', check: 'text-brand-aqua' }
              ]
              const colorScheme = colors[index % 3]

              return (
                <Card
                  key={pkg.id}
                  className={`relative p-8 ${colorScheme.bg} ${pkg.popular
                    ? `border-2 ${colorScheme.border.replace('/30', '')} shadow-xl ring-2 ${colorScheme.ring}`
                    : `border ${colorScheme.border}`
                    } transition-all duration-300 hover:shadow-xl hover:scale-105`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className={`${colorScheme.badge} text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md`}>
                        Terpopuler
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8 mt-2">
                    <h3 className="text-2xl font-bold text-brand-navy-dark mb-2">
                      {pkg.name}
                    </h3>
                    <p className="text-brand-navy mb-6 min-h-[3rem]">
                      {pkg.description}
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-brand-navy-dark">
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                    <p className={`mt-2 font-medium ${colorScheme.check}`}>
                      {pkg.validityDays} hari
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <CheckCircle2 className={`h-5 w-5 ${colorScheme.check} mr-3 flex-shrink-0 mt-0.5`} />
                        <span className="text-brand-navy">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={session ? '/subscription/select-package' : '/auth/register'}>
                    <Button
                      className={`w-full ${colorScheme.button} text-white shadow-md`}
                      size="lg"
                    >
                      Pilih Paket
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-brand-peach-light/30 via-white to-brand-cream/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy-dark mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-xl text-brand-navy max-w-2xl mx-auto">
              Testimoni dari pengguna yang puas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-blue/20 hover:scale-105 bg-gradient-to-br from-white to-brand-blue-light/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-brand-peach fill-brand-peach" />
                ))}
              </div>
              <p className="text-brand-navy mb-6 leading-relaxed">
                "Sangat membantu untuk skripsi saya! Prosesnya cepat dan hasilnya memuaskan. Highly recommended!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-aqua rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                  AS
                </div>
                <div>
                  <div className="font-semibold text-brand-navy-dark">Andi Saputra</div>
                  <div className="text-sm text-brand-blue">Mahasiswa UI</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-purple/20 hover:scale-105 bg-gradient-to-br from-white to-brand-lavender-light/30">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-brand-peach fill-brand-peach" />
                ))}
              </div>
              <p className="text-brand-navy mb-6 leading-relaxed">
                "Pelayanan terbaik! Admin responsif dan membantu. Dokumen saya lolos dengan mudah."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-brand-lavender rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                  SP
                </div>
                <div>
                  <div className="font-semibold text-brand-navy-dark">Siti Permata</div>
                  <div className="text-sm text-brand-purple">Mahasiswa UGM</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border border-brand-primary/20 hover:scale-105 bg-gradient-to-br from-white to-brand-secondary/40">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-brand-peach fill-brand-peach" />
                ))}
              </div>
              <p className="text-brand-navy mb-6 leading-relaxed">
                "Harga terjangkau untuk mahasiswa. Kualitas premium dengan harga yang masuk akal!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-sage rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                  BP
                </div>
                <div>
                  <div className="font-semibold text-brand-navy-dark">Budi Pratama</div>
                  <div className="text-sm text-brand-primary">Mahasiswa ITB</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-blue-dark via-brand-purple to-brand-aqua relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Siap Untuk Memulai?
          </h2>
          <p className="text-xl text-brand-blue-light mb-8">
            Bergabunglah dengan ratusan mahasiswa yang telah mempercayai kami
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-brand-blue-dark hover:bg-brand-blue-light hover:text-brand-navy-dark text-lg px-12 py-6 shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
          >
            Daftar Sekarang - GRATIS
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-xl font-bold">🏠</span>
                </div>
                <span className="text-2xl font-bold">Rumah Plagiasi</span>
              </div>
              <p className="text-brand-secondary mb-4">
                Solusi terpercaya untuk membantu Anda melewati sistem deteksi plagiarism dengan aman dan mudah.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-brand-sage-light">Menu</h4>
              <ul className="space-y-2 text-brand-secondary">
                <li><a href="#features" className="hover:text-white transition">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Harga</a></li>
                <li><a href="#testimonials" className="hover:text-white transition">Testimoni</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-brand-sage-light">Bantuan</h4>
              <ul className="space-y-2 text-brand-secondary">
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Kontak</a></li>
                <li><a href="#" className="hover:text-white transition">Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-navy pt-8 text-center text-brand-secondary">
            <p>&copy; 2025 Rumah Plagiasi. Dibuat dengan ❤️ oleh devnolife</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
