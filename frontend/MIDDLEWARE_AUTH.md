# Authentication Middleware

## Overview
Middleware ini menangani redirect otomatis berdasarkan status autentikasi user untuk memberikan pengalaman yang lebih baik.

## Fitur

### 1. **Auto Redirect untuk User yang Sudah Login**
- ✅ Redirect dari landing page (`/`) ke dashboard
- ✅ Redirect dari login page (`/auth/login`) ke dashboard
- ✅ Redirect dari register page (`/auth/register`) ke dashboard

### 2. **Protected Routes**
- 🔒 User yang belum login tidak bisa akses `/dashboard/*`
- 🔒 Akan di-redirect ke `/auth/login` otomatis

### 3. **Public Routes**
- 🌐 API routes (`/api/*`) tetap accessible
- 🌐 Static files (images, fonts, dll) tetap accessible

## Cara Kerja

### Middleware (Server-Side)
File: `/frontend/middleware.ts`

```typescript
// Menggunakan next-auth JWT untuk check session
const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
})

// Logic redirect
if (token) {
  // User sudah login
  if (isLandingPage) -> redirect to /dashboard
  if (isAuthPage) -> redirect to /dashboard
}

if (!token && isDashboard) {
  // User belum login
  redirect to /auth/login
}
```

### Client-Side Protection
Setiap halaman juga menggunakan `useSession()` untuk double protection:

**Landing Page** (`/app/landing-client.tsx`):
```typescript
useEffect(() => {
  if (status === 'authenticated' && session) {
    router.push('/dashboard')
  }
}, [status, session, router])
```

**Login Page** (`/app/auth/login/page.tsx`):
```typescript
useEffect(() => {
  if (status === 'authenticated' && session) {
    router.push('/dashboard')
  }
}, [status, session, router])
```

**Register Page** (`/app/auth/register/page.tsx`):
```typescript
useEffect(() => {
  if (status === 'authenticated' && session) {
    router.push('/dashboard')
  }
}, [status, session, router])
```

## User Flow

### Scenario 1: User Sudah Login
```
User buka "/" 
  → Middleware detect session
  → Redirect ke "/dashboard"
  → User langsung masuk dashboard
```

### Scenario 2: User Belum Login
```
User buka "/"
  → Middleware: no session
  → Show landing page
  → User bisa pilih Login/Register
```

### Scenario 3: User Sudah Login Coba Akses Login
```
User buka "/auth/login"
  → Middleware detect session
  → Redirect ke "/dashboard"
  → Tidak perlu login lagi
```

### Scenario 4: User Belum Login Coba Akses Dashboard
```
User buka "/dashboard"
  → Middleware: no session
  → Redirect ke "/auth/login"
  → User harus login dulu
```

## Loading States

Semua halaman yang menggunakan `useSession()` menampilkan loading indicator saat memeriksa session:

```typescript
if (status === 'loading') {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        <p className="text-gray-700 font-medium mt-4">Memeriksa sesi...</p>
      </div>
    </div>
  )
}
```

## Routes Configuration

### Protected Routes
- `/dashboard/*` - Butuh authentication
- Semua sub-routes dashboard juga protected

### Auth Routes
- `/auth/login` - Redirect jika sudah login
- `/auth/register` - Redirect jika sudah login

### Public Routes
- `/` - Landing page (redirect jika sudah login)
- `/api/*` - API endpoints (always accessible)
- Static files (images, fonts, dll)

## Environment Variables

Pastikan `.env.local` memiliki:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Logging

Middleware akan log setiap redirect untuk debugging:
```
[Middleware] 🏠 User sudah login, redirect dari landing page ke dashboard
[Middleware] 🔐 User sudah login, redirect dari auth page ke dashboard
[Middleware] 🚫 User belum login, redirect ke login page
```

## Testing

### Test Case 1: Redirect dari Landing
1. Login terlebih dahulu
2. Buka `http://localhost:3000/`
3. Expected: Auto redirect ke `/dashboard`

### Test Case 2: Redirect dari Login
1. Login terlebih dahulu
2. Buka `http://localhost:3000/auth/login`
3. Expected: Auto redirect ke `/dashboard`

### Test Case 3: Protected Dashboard
1. Logout
2. Buka `http://localhost:3000/dashboard`
3. Expected: Redirect ke `/auth/login`

### Test Case 4: Normal Flow
1. Logout
2. Buka `http://localhost:3000/`
3. Expected: Show landing page (no redirect)

## Benefits

✅ **Better UX** - User tidak perlu manual navigate ke dashboard
✅ **Security** - Protected routes tidak bisa diakses tanpa login
✅ **Seamless** - Redirect otomatis tanpa user action
✅ **Fast** - Middleware runs di edge, sangat cepat
✅ **DX** - Easy to maintain dan extend

## Notes

- Middleware menggunakan JWT token dari next-auth
- Client-side juga ada protection untuk fallback
- Loading states membuat UX lebih smooth
- Logging membantu debugging
