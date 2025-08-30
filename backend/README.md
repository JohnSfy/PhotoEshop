# Image Buy App Backend

A clean, focused backend API for an image buying application.

## Features

- Photo upload with automatic watermarking
- Photo management (CRUD operations)
- Order management with email support
- Category-based photo organization
- SQLite database storage
- RESTful API design

## Database Schema

### Photos Table
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  filename TEXT,
  path_to_watermark TEXT,
  path_to_clean TEXT,
  updated TEXT,
  price REAL,
  category TEXT
)
```

### Orders Table
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  photo_ids TEXT,
  total_amount REAL,
  status TEXT DEFAULT 'pending',
  mypos_order_id TEXT,
  email TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npm run setup-db
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Photo Management

#### GET /api/photos
Get all watermarked photos for display.

**Response:**
```json
[
  {
    "id": "uuid",
    "path_to_watermark": "watermarked/filename.jpg",
    "filename": "original-name.jpg",
    "price": 9.99,
    "updated": "2024-01-01T00:00:00.000Z",
    "category": "nature"
  }
]
```

#### GET /api/photos/:id
Get a specific photo by ID.

#### GET /api/photos/category/:category
Get photos by category.

#### POST /api/photos/upload
Upload a new photo with automatic watermarking.

**Request:** FormData with `photo` file and optional `price` and `category` fields.

**Response:**
```json
{
  "message": "Photo uploaded successfully",
  "photo": {
    "id": "uuid",
    "filename": "original-name.jpg",
    "path_to_watermark": "watermarked/filename.jpg",
    "price": 9.99,
    "category": "nature"
  }
}
```

#### PUT /api/photos/:id
Update photo details (price, category).

**Request Body:**
```json
{
  "price": 12.99,
  "category": "portrait"
}
```

#### DELETE /api/photos/:id
Delete a photo and its files.

### Order Management

#### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "photo_ids": ["uuid1", "uuid2"],
  "total_amount": 19.98,
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order-uuid",
    "photo_ids": "uuid1,uuid2",
    "total_amount": 19.98,
    "email": "customer@example.com",
    "status": "pending"
  }
}
```

#### GET /api/orders
Get all orders.

#### GET /api/orders/:id
Get a specific order by ID.

#### PUT /api/orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "completed",
  "mypos_order_id": "payment-123"
}
```

#### DELETE /api/orders/:id
Delete an order.

### Utility Endpoints

#### GET /api/health
Health check endpoint.

#### GET /api/categories
Get all available categories.

#### GET /api/stats
Get basic statistics about photos and orders.

## File Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── database/
│   ├── dbManager.js      # Database operations
│   ├── setup.js          # Database setup
│   └── photos.db         # SQLite database
├── uploads/
│   ├── clean/            # Original photos
│   └── watermarked/      # Watermarked previews
├── categories.json        # Available categories
└── test-apis.js          # API testing script
```

## Testing

Run the test script to verify all API endpoints:

```bash
npm test
```

This will test all the main API endpoints and show you the results.

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
```

## Notes

- Photos are automatically watermarked when uploaded
- Clean versions are stored separately for purchase
- Orders include email addresses for customer contact
- All file operations are handled automatically
- Database is automatically initialized on startup
