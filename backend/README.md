# Image Buy App - Backend API

This is the backend API for the Image Buy App, designed to be deployed independently on Render.com.

## Features

- **Photo Management**: Upload, watermark, and organize photos by categories
- **Payment Integration**: myPOS payment gateway integration
- **Database**: SQLite database for storing photo metadata and orders
- **File Storage**: Local file storage for watermarked and clean photos
- **RESTful API**: Complete REST API for all operations

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/:name` - Delete category

### Photos
- `GET /api/photos` - Get all photos
- `GET /api/photos/watermarked` - Get watermarked photos for gallery
- `GET /api/photos/clean` - Get clean photos by IDs
- `POST /api/photos/upload` - Upload and watermark photos
- `DELETE /api/photos/delete` - Delete photos
- `GET /api/photos/scan-existing` - Scan existing photos
- `POST /api/photos/re-watermark` - Re-watermark existing photos

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order status

### Payment (myPOS)
- `POST /mypos/sign` - Sign payment parameters
- `POST /mypos/notify` - Payment notification webhook

### Static Files
- `GET /uploads/*` - Serve photo files

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (production/development)
- `MYPOS_PRIVATE_KEY_PEM` - myPOS private key for payment signing
- `MYPOS_PUBLIC_CERT_PEM` - myPOS public certificate for verification

## Database

The app uses SQLite with the following tables:
- `photos` - Photo metadata and file paths
- `orders` - Order tracking and payment status

## File Structure

```
uploads/
├── clean/          # Original clean photos
└── watermarked/    # Watermarked preview photos
```

## Deployment

This backend is configured for deployment on Render.com as a web service.

### Build Command
```bash
cd backend && npm install
```

### Start Command
```bash
cd backend && npm start
```

## API Documentation

Visit `/api/helper` endpoint for complete API documentation and examples.

## Notes

- This is a backend-only deployment
- Frontend should be deployed separately or accessed from a different domain
- CORS is configured to allow all origins for API access
- File uploads are limited to 50MB per file
- Supports JPG, JPEG, PNG, GIF, and WebP image formats
