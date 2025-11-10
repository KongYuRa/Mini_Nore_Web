# Mini Nore - Music Composer Game

A web-based music composition game where you can drag and drop sound sources to create your own spatial audio experience.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Create a new project folder and copy all files**
   ```bash
   mkdir mini-nore
   cd mini-nore
   ```

2. **Create package.json**
   ```bash
   npm init -y
   ```

3. **Install dependencies**
   ```bash
   npm install react react-dom
   npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
   npm install motion lucide-react
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Visit `http://localhost:5173`

## 📁 Project Structure

```
mini-nore/
├── index.html          # Entry HTML file
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── tsconfig.json       # TypeScript configuration
├── App.tsx             # Main app component
├── components/         # React components
│   ├── PackSelector.tsx
│   ├── SourcePanel.tsx
│   ├── SourceItem.tsx
│   ├── ComposerCanvas.tsx
│   └── PlacedSource.tsx
├── data/
│   └── sources.ts      # Source data (music & ambience)
└── styles/
    └── globals.css     # Global styles

```

## 🛠️ How to Modify

### Change Pack Data
Edit `/data/sources.ts` to add/remove/modify music and ambience sources.

### Change Colors
Edit Tailwind classes in components or modify `/styles/globals.css`.

### Add New Features
- Components are in `/components` folder
- Main logic is in `/App.tsx`
- Add new TypeScript files as needed

## 🌐 Deploy to Web

### Option 1: Vercel (Recommended)

1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Login and deploy
   ```bash
   vercel login
   vercel
   ```

3. Follow prompts - it will automatically detect Vite and configure everything!

### Option 2: Netlify

1. Build your project
   ```bash
   npm run build
   ```

2. Install Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

3. Deploy
   ```bash
   netlify deploy --prod
   ```

4. Select the `dist` folder when prompted

### Option 3: GitHub Pages

1. Install gh-pages
   ```bash
   npm install -D gh-pages
   ```

2. Add to package.json scripts:
   ```json
   "scripts": {
     "deploy": "vite build && gh-pages -d dist"
   }
   ```

3. Deploy
   ```bash
   npm run deploy
   ```

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder that you can upload to any web server.

## 🎨 Features

- ✨ 3 themed packs (Adventure, Combat, Shelter)
- 🎵 16 music sources + 16 ambience sources per pack
- 🖱️ Drag & drop interface
- 🎭 Spatial audio positioning
- 📱 Responsive design
- 🎬 Animated icons when playing

## 🔧 Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Motion** (Framer Motion) - Animations
- **Lucide React** - Icons

## 📝 License

Free to use and modify for personal and commercial projects.

## 🎯 Next Steps

To add real audio functionality:
1. Add audio files to `/public/audio` folder
2. Use Web Audio API for playback
3. Implement panning based on position
4. Add volume controls

Enjoy creating music! 🎵✨
