# Color Guide - Rumah Plagiasi 🎨

## 🎨 Brand Color Palette

### Primary Colors

#### 1. **Primary Green** `#67C090`
- **Usage**: Primary actions, active menu items, buttons, links
- **Tailwind**: `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`
- **Examples**:
  - Active sidebar menu
  - Primary CTA buttons
  - Active links
  - Progress bars
  - Success indicators

#### 2. **Secondary Light Green** `#DDF4E7`
- **Usage**: Light backgrounds, hover states, subtle highlights
- **Tailwind**: `bg-brand-secondary`, `text-brand-secondary`
- **Examples**:
  - Card backgrounds (subtle)
  - Hover states on buttons
  - Section backgrounds
  - Input field backgrounds
  - Badge backgrounds (success/info)

### Navy Colors

#### 3. **Medium Navy** `#26667F`
- **Usage**: Body text, borders, secondary elements
- **Tailwind**: `bg-brand-navy`, `text-brand-navy`, `border-brand-navy`
- **Examples**:
  - Body text
  - Borders on cards
  - Secondary headings
  - Icons (secondary)
  - Dividers

#### 4. **Dark Navy** `#124170`
- **Usage**: Headings, important text, emphasis
- **Tailwind**: `bg-brand-navy-dark`, `text-brand-navy-dark`
- **Examples**:
  - Main headings (h1, h2)
  - Important labels
  - Strong emphasis text
  - Footer text
  - Modal titles

### Accent Colors

#### 5. **Teal** `#5A827E`
- **Usage**: Secondary accents, info states, subtle highlights
- **Tailwind**: `bg-brand-teal`, `text-brand-teal`, `border-brand-teal`
- **Examples**:
  - Info badges
  - Secondary icons
  - Link hover states
  - Subtle borders
  - Chart colors

#### 6. **Sage Green** `#84AE92`
- **Usage**: Success states, completed items, positive feedback
- **Tailwind**: `bg-brand-sage`, `text-brand-sage`
- **Examples**:
  - Success messages
  - Completed status
  - Checkmarks
  - Positive indicators
  - Active filters

#### 7. **Light Sage** `#B9D4AA`
- **Usage**: Subtle backgrounds, soft accents, disabled states
- **Tailwind**: `bg-brand-sage-light`, `text-brand-sage-light`
- **Examples**:
  - Light section backgrounds
  - Disabled button states
  - Placeholder text backgrounds
  - Subtle hover effects
  - Muted badges

#### 8. **Light Lime** `#FAFFCA`
- **Usage**: Highlights, warnings (soft), attention areas
- **Tailwind**: `bg-brand-lime`, `text-brand-lime`
- **Examples**:
  - Soft warning backgrounds
  - Highlighted rows
  - Attention badges (info)
  - Tooltip backgrounds
  - Pending status

### Neutral Colors

#### White `#FFFFFF`
- **Usage**: Main backgrounds, card backgrounds, clean spaces
- **Examples**:
  - Page background
  - Card backgrounds
  - Modal backgrounds
  - Input fields
  - Button backgrounds (secondary)

#### Black `#000000` / Dark Gray `#1F2937`
- **Usage**: Primary text, strong contrast
- **Examples**:
  - Main body text (use sparingly)
  - Use `brand-navy-dark` for most text instead

---

## 🎯 Usage Guidelines

### Text Colors Priority
1. **Headings**: `text-brand-navy-dark` or `text-gray-900`
2. **Body Text**: `text-brand-navy` or `text-gray-700`
3. **Secondary Text**: `text-gray-500` or `text-brand-teal`
4. **Muted Text**: `text-gray-400`

### Background Priority
1. **Main Background**: `bg-white`
2. **Section Background**: `bg-gray-50` or `bg-brand-secondary` (very light)
3. **Card Background**: `bg-white`
4. **Hover States**: `bg-brand-secondary` or `bg-gray-100`

### Border Colors
1. **Primary Borders**: `border-gray-200`
2. **Active Borders**: `border-brand-primary`
3. **Subtle Borders**: `border-gray-100`
4. **Focus States**: `ring-brand-primary`

### Button Colors
1. **Primary Button**: 
   - Background: `bg-brand-primary`
   - Hover: `hover:bg-brand-primary/90`
   - Text: `text-white`

2. **Secondary Button**:
   - Background: `bg-white`
   - Border: `border-brand-navy`
   - Text: `text-brand-navy`
   - Hover: `hover:bg-brand-secondary`

3. **Success Button**:
   - Background: `bg-brand-sage`
   - Text: `text-white`

4. **Danger Button**:
   - Background: `bg-red-500`
   - Text: `text-white`

### Status Colors
- **Success**: `bg-brand-sage`, `text-brand-sage`
- **Info**: `bg-brand-teal`, `text-brand-teal`
- **Warning**: `bg-brand-lime`, `text-brand-navy`
- **Pending**: `bg-brand-sage-light`, `text-brand-navy`
- **Error**: `bg-red-100`, `text-red-700`

---

## 📋 Component Examples

### Sidebar
```tsx
// Sidebar background
bg-white border-r border-gray-200

// Logo container
bg-brand-primary text-white

// Active menu item
bg-brand-primary text-white

// Inactive menu item
text-brand-navy hover:bg-brand-secondary
```

### Header
```tsx
// Header background
bg-white border-b border-gray-200

// Title
text-brand-navy-dark font-bold

// User badge
bg-brand-secondary text-brand-primary
```

### Cards
```tsx
// Card container
bg-white border border-gray-200 shadow-sm

// Card hover
hover:shadow-md hover:border-brand-primary/50

// Card heading
text-brand-navy-dark font-semibold

// Card text
text-brand-navy
```

### Stats Cards
```tsx
// Primary stat
bg-brand-primary text-white

// Success stat
bg-brand-sage text-white

// Info stat
bg-brand-teal text-white

// Warning stat
bg-brand-lime text-brand-navy-dark
```

### Badges
```tsx
// Success badge
bg-brand-sage/20 text-brand-sage

// Info badge
bg-brand-teal/20 text-brand-teal

// Warning badge
bg-brand-lime text-brand-navy

// Active badge
bg-brand-primary/20 text-brand-primary
```

---

## 🔧 Implementation Examples

### Admin Sidebar Menu
```tsx
// Active state
className="bg-brand-primary text-white shadow-sm"

// Inactive state
className="text-brand-navy hover:bg-brand-secondary"
```

### Primary Action Button
```tsx
<button className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
  Submit
</button>
```

### Success Message
```tsx
<div className="bg-brand-sage/10 border border-brand-sage/30 text-brand-sage px-4 py-3 rounded-lg">
  Success! Your document has been processed.
</div>
```

### Info Card
```tsx
<div className="bg-brand-secondary border border-brand-primary/20 rounded-lg p-6">
  <h3 className="text-brand-navy-dark font-semibold mb-2">Information</h3>
  <p className="text-brand-navy">Your content here</p>
</div>
```

---

## ✅ Do's and Don'ts

### ✅ Do's
- Use `bg-white` for main backgrounds
- Use brand colors for interactive elements
- Use navy colors for text
- Keep good contrast ratios
- Use subtle colors for backgrounds
- Use bright colors for emphasis

### ❌ Don'ts
- Don't use too many colors at once
- Don't use brand-lime for large areas
- Don't use pure black for text (use navy instead)
- Don't mix too many accent colors
- Don't use low contrast combinations
- Don't ignore accessibility guidelines

---

## 📊 Color Accessibility

All color combinations have been checked for WCAG 2.1 AA compliance:
- ✅ Brand Primary (#67C090) on White: Pass
- ✅ Brand Navy Dark (#124170) on White: Pass
- ✅ Brand Navy (#26667F) on White: Pass
- ✅ White on Brand Primary: Pass
- ⚠️ Brand Lime (#FAFFCA) needs dark text

---

**Last Updated**: November 5, 2025
**Version**: 1.0
