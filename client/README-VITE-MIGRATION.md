# Migration from Create React App to Vite

This project has been transformed from Create React App to use Vite as the build tool.

## What Changed

1. **Package.json**: Updated dependencies and scripts
2. **Build Tool**: Replaced `react-scripts` with `vite` and `@vitejs/plugin-react`
3. **Entry Point**: Changed from `src/index.js` to `src/main.jsx`
4. **HTML**: Moved `public/index.html` to root and updated for Vite
5. **Configuration**: Added `vite.config.js` with React plugin and proxy settings

## Migration Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Migration Script
```bash
node update-imports.js
```

This script will:
- Rename all `.js` files to `.jsx`
- Update import statements to use `.jsx` extensions
- Handle the file renaming automatically

### 3. Environment Variables
Create a `.env` file in the client root with:
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
```

Note: Vite uses `VITE_` prefix instead of `REACT_APP_`

### 4. Start Development Server
```bash
npm run dev
```

## New Scripts

- `npm run dev` - Start development server (replaces `npm start`)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Key Differences

1. **Environment Variables**: Use `import.meta.env.VITE_*` instead of `process.env.REACT_APP_*`
2. **File Extensions**: All React components should use `.jsx` extension
3. **Import Statements**: Must include `.jsx` extensions for local files
4. **Development Server**: Vite is significantly faster than CRA

## Troubleshooting

If you encounter import errors:
1. Make sure all component files have `.jsx` extensions
2. Check that import statements include `.jsx` extensions
3. Verify that the migration script ran successfully

## Benefits of Vite

- **Faster Development**: Hot Module Replacement (HMR) is much faster
- **Faster Builds**: Production builds are significantly faster
- **Modern Tooling**: Uses ES modules and modern bundling
- **Better Performance**: Optimized for modern browsers
