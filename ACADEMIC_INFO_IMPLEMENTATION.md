# Academic Information Implementation

## Overview
Sistem informasi akademik telah ditambahkan ke profil user dengan fitur autocomplete yang cerdas dan cascading selection.

## Features

### 1. **Smart Autocomplete with Custom Input**
- User dapat memilih dari daftar master data
- Jika institusi tidak ada di daftar, user bisa input sendiri
- 5 universitas besar Indonesia sudah ter-preload dengan data lengkap:
  - **Universitas Indonesia (UI)** - 13 fakultas
  - **Institut Teknologi Bandung (ITB)** - 10 sekolah
  - **Universitas Gadjah Mada (UGM)** - 13 fakultas
  - **Universitas Airlangga (UNAIR)** - 11 fakultas
  - **Institut Teknologi Sepuluh Nopember (ITS)** - 6 fakultas

### 2. **Cascading Selection**
- **Pilih Universitas** → Filter fakultas berdasarkan universitas
- **Pilih Fakultas** → Filter program studi berdasarkan fakultas
- Jika universitas tidak di-pilih dari list, field fakultas dan prodi tetap bisa diisi manual

### 3. **Flexible Input**
- Semua field mendukung custom input
- User tidak terbatas pada pilihan yang ada
- Cocok untuk institusi kecil atau khusus yang tidak ada di master data

## Database Schema

### UserProfile Model
```prisma
model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  fullName    String
  phone       String?
  institution String?  // Nama Universitas
  faculty     String?  // Nama Fakultas (NEW)
  major       String?  // Program Studi
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migration Applied:**
- `20251103172923_add_faculty_to_profile`
- Added `faculty` field (String, nullable)

## File Structure

### 1. Master Data
**`/frontend/lib/academic-data.ts`**
- Contains master data untuk 5 universitas besar
- Helper functions:
  - `searchUniversities(query)` - Search universities by name
  - `getFaculties(universityId)` - Get faculties for a university
  - `getMajors(universityId, facultyId)` - Get majors for a faculty

### 2. Combobox Component
**`/frontend/components/ui/combobox.tsx`**
- Reusable autocomplete dropdown
- Features:
  - Search/filter options
  - Custom input support
  - Keyboard navigation
  - Button to use custom search term
- Props:
  ```typescript
  interface ComboboxProps {
    options: ComboboxOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    emptyText?: string
    searchPlaceholder?: string
    allowCustom?: boolean
    className?: string
    disabled?: boolean
  }
  ```

### 3. Profile Page
**`/frontend/app/dashboard/profile/page.tsx`**
- Updated with 3 academic fields:
  1. **Nama Universitas** - University/Institution name
  2. **Nama Fakultas** - Faculty name
  3. **Program Studi** - Major/Study program
- Cascading selection logic implemented
- State management:
  - `selectedUniversityId` - For tracking selected university
  - `selectedFacultyId` - For tracking selected faculty
  - `facultyOptions` - Filtered faculty list based on university
  - `majorOptions` - Filtered major list based on faculty

### 4. Profile API
**`/frontend/app/api/profile/update/route.ts`**
- **POST**: Update profile with new fields
- **GET**: Retrieve profile (automatically includes all fields)
- Fields handled: `fullName`, `phone`, `institution`, `faculty`, `major`

## User Flow

### Scenario 1: Memilih dari Master Data
1. User klik dropdown "Nama Universitas"
2. User search atau scroll untuk memilih "Universitas Indonesia"
3. Dropdown "Nama Fakultas" otomatis terisi dengan fakultas UI
4. User pilih "Fakultas Teknik"
5. Dropdown "Program Studi" otomatis terisi dengan prodi Teknik
6. User pilih "Teknik Informatika"
7. Klik "Simpan Perubahan"

### Scenario 2: Input Custom (Institusi Tidak di List)
1. User klik dropdown "Nama Universitas"
2. User ketik "Universitas XYZ" (tidak ada di list)
3. User klik tombol "Gunakan 'Universitas XYZ'"
4. Field fakultas dan prodi masih bisa diisi manual
5. User ketik "Fakultas ABC" di field fakultas
6. User ketik "Program Studi DEF" di field prodi
7. Klik "Simpan Perubahan"

### Scenario 3: Mixed (Universitas dari List, Fakultas Custom)
1. User pilih "ITB" dari dropdown
2. Fakultas ITB muncul di dropdown
3. Tapi user punya fakultas baru yang belum ada
4. User ketik sendiri nama fakultasnya
5. System terima input custom tersebut
6. Sama untuk program studi

## UI Components

### Dependencies Installed
```bash
npx shadcn@latest add command  # Command palette component
npx shadcn@latest add popover  # Popover positioning
```

### Visual Features
- Clean, modern interface using shadcn/ui
- Clear section separation dengan icon 🎓 (GraduationCap)
- Helper text di bawah setiap field
- Disabled state untuk cascading selection
- Loading states saat submit

## Testing

### To Test the Implementation:
1. Start the frontend dev server:
   ```bash
   cd /workspaces/vision-computer/frontend
   npm run dev
   ```

2. Login dan navigate ke `/dashboard/profile`

3. Test scenarios:
   - Pilih universitas dari dropdown → Check fakultas filtered
   - Pilih fakultas → Check prodi filtered
   - Input custom universitas → Check still can input fakultas/prodi
   - Save and reload page → Check data persisted

### Expected Behavior:
- ✅ University selection filters faculty dropdown
- ✅ Faculty selection filters major dropdown
- ✅ Custom input accepted for all fields
- ✅ Data persists after save and reload
- ✅ Empty fields allowed (all nullable)

## API Endpoints

### GET `/api/profile/update`
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "userId": "user-id",
    "fullName": "John Doe",
    "phone": "08123456789",
    "institution": "Universitas Indonesia",
    "faculty": "Fakultas Teknik",
    "major": "Teknik Informatika",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/profile/update`
**Request:**
```json
{
  "fullName": "John Doe",
  "phone": "08123456789",
  "institution": "Universitas Indonesia",
  "faculty": "Fakultas Teknik",
  "major": "Teknik Informatika"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "userId": "user-id",
    "fullName": "John Doe",
    "phone": "08123456789",
    "institution": "Universitas Indonesia",
    "faculty": "Fakultas Teknik",
    "major": "Teknik Informatika"
  },
  "message": "Profil berhasil diperbarui"
}
```

## Master Data Coverage

### Universities Included:
1. **UI (Universitas Indonesia)** - 13 Faculties
2. **ITB (Institut Teknologi Bandung)** - 10 Schools
3. **UGM (Universitas Gadjah Mada)** - 13 Faculties
4. **UNAIR (Universitas Airlangga)** - 11 Faculties
5. **ITS (Institut Teknologi Sepuluh Nopember)** - 6 Faculties

### Total Data Points:
- 5 Universities
- 53 Faculties/Schools
- 200+ Study Programs

### Extensibility:
Untuk menambah universitas baru, edit file:
**`/frontend/lib/academic-data.ts`**

```typescript
export const UNIVERSITIES: University[] = [
  // ... existing universities
  {
    id: 'univ-baru',
    name: 'Universitas Baru',
    faculties: [
      {
        id: 'fakultas-1',
        name: 'Fakultas ABC',
        majors: ['Program Studi 1', 'Program Studi 2']
      }
    ]
  }
]
```

## Benefits

1. **User Experience**
   - Cepat memilih untuk universitas besar
   - Fleksibel untuk institusi kecil
   - No forced selection

2. **Data Quality**
   - Standardized data untuk universitas besar
   - Autocomplete reduces typos
   - Still flexible for edge cases

3. **Analytics Ready**
   - Can group users by institution
   - Can analyze faculty distribution
   - Can track major popularity

4. **Scalability**
   - Easy to add more universities
   - Master data in one file
   - Component reusable

## Next Steps (Optional Enhancements)

1. **API Integration**: Fetch university data from external API
2. **Admin Panel**: Allow admin to manage master data via UI
3. **Bulk Import**: Import university data from CSV
4. **Search Optimization**: Add fuzzy search for better UX
5. **Validation**: Add regex validation for custom inputs
6. **Analytics Dashboard**: Show distribution of users by institution

## Notes

- Session management tetap hidden dari users (silent monitoring active)
- Auto-approval system tetap berjalan untuk admin
- Duplicate detection system tetap aktif
- Academic info **tidak wajib** diisi (all nullable fields)
- Profile completion tidak mempengaruhi document processing
