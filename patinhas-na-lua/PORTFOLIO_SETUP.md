# Portfolio Gallery - Setup Instructions

## ✅ What's Been Created:

1. **Admin Page**: `/admin/portfolio` - Upload and manage images
2. **Gallery Component**: Displays on landing page with lightbox
3. **Database**: PortfolioImage model added to Prisma schema
4. **Storage**: FREE Cloudinary integration (25GB storage)

---

## 🚀 Setup Steps (DO THIS ONCE):

### Step 1: Create Cloudinary Upload Preset

1. Go to: https://cloudinary.com/console
2. Click **Settings** (gear icon) → **Upload**
3. Scroll to **Upload presets**
4. Click **Add upload preset**
5. Name it: `portfolio_preset`
6. Set **Signing Mode** to: **Unsigned**
7. Set **Folder** to: `patinhas-portfolio` (optional, for organization)
8. Click **Save**

### Step 2: Verify Environment Variables

Make sure these are in your `.env.local`:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

---

## 📸 How to Use:

### For the Groomer (Admin):

1. Go to `/admin/portfolio`
2. Click **"+ Adicionar Nova Imagem"**
3. Choose a photo from the computer
4. Add a title and description (optional)
5. Click **"Guardar"**
6. Images appear in the gallery automatically!

**Features:**
- ✅ Drag & drop upload
- ✅ Hide/show images (eye icon)
- ✅ Reorder images (↑ ↓ arrows)
- ✅ Delete images

### For Visitors:

- Go to landing page (/)
- Scroll to portfolio section  
- Click any image to open lightbox
- Use **<** and **>** to navigate
- Click outside or **×** to close

---

## 🎨 Add Gallery to Landing Page:

Open `app/page.tsx` and add this section AFTER the reviews section (around line 165):

```tsx
{/* PORTFOLIO GALLERY */}
<section className="py-24 bg-white">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
        Os Nossos Trabalhos
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Veja alguns dos nossos melhores resultados. Cada pet é único e merece um tratamento especial!
      </p>
    </div>

    <PortfolioGallery images={portfolioImages} />
  </div>
</section>
```

Then at the top of the file, add:

```tsx
import PortfolioGallery from "@/app/components/portfolio-gallery";

// And fetch the images:
const portfolioImages = await db.portfolioImage.findMany({
  where: { isPublic: true },
  orderBy: { order: 'asc' },
});
```

---

## 💰 Pricing (100% Free):

- **Cloudinary Free Tier**: 25GB storage + 25GB bandwidth/month
- **Database**: Your existing Neon PostgreSQL (free tier: 512MB)
- **Total Cost**: €0.00 forever! 🎉

---

## 🔧 Troubleshooting:

**"Upload failed"**:
- Check if upload preset `portfolio_preset` exists in Cloudinary
- Verify it's set to **Unsigned** mode
- Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is correct

**"Images not showing"**:
- Make sure images are marked as **Visible** (green eye icon)
- Check if gallery is added to landing page
- Hard refresh browser (Ctrl+Shift+R)

---

## 🎉 You're Done!

The groomer can now:
1. Upload photos from her phone/computer
2. Organize them with drag & drop
3. Show them beautifully on the landing page

No technical knowledge needed! ✨
