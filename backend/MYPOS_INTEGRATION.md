# myPOS Payment Integration

This server now includes myPOS payment functionality for processing photo purchases.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
ALLOWED_ORIGIN=http://localhost:3000

# myPOS Payment Integration
# Get these from your myPOS merchant account
MYPOS_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# Optional: myPOS public certificate for verifying notify signatures
# MYPOS_PUBLIC_CERT_PEM="-----BEGIN CERTIFICATE-----\nMIIF...\n-----END CERTIFICATE-----"
```

## New Endpoints

### 1. Payment Signature (`POST /mypos/sign`)
- **Purpose**: Generates RSA signature for myPOS embedded checkout
- **Request Body**: myPOS parameters (without signature)
- **Response**: `{ signature: "base64_signature" }`

### 2. Payment Notification (`POST /mypos/notify`)
- **Purpose**: Receives payment status updates from myPOS
- **Note**: This endpoint must be publicly accessible (HTTPS required in production)
- **Response**: Always returns "OK" (myPOS requirement)

### 3. Create Order (`POST /api/orders`)
- **Purpose**: Creates a new order before payment
- **Request Body**: 
  ```json
  {
    "photoIds": ["photo1", "photo2"],
    "totalAmount": 11.98
  }
  ```
- **Response**: Order details with unique orderId

### 4. Get Order Status (`GET /api/orders/:orderId`)
- **Purpose**: Retrieves order information and status
- **Response**: Complete order details

### 5. Health Check (`GET /health`)
- **Purpose**: Simple health check endpoint
- **Response**: `{ ok: true }`

## Database Changes

A new `orders` table has been added to track payments:

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  photo_ids TEXT,           -- JSON array of photo IDs
  total_amount REAL,        -- Total order amount
  status TEXT DEFAULT 'pending', -- Order status
  mypos_order_id TEXT,      -- myPOS order reference
  created_at TEXT,          -- Order creation timestamp
  updated_at TEXT           -- Last update timestamp
);
```

## Frontend Integration

1. **Create Order**: Call `/api/orders` with selected photos
2. **Get Signature**: Call `/mypos/sign` with myPOS parameters
3. **Process Payment**: Use myPOS SDK with the signature
4. **Check Status**: Poll `/api/orders/:orderId` for updates

## Security Notes

- The private key is used only for signing requests
- Notify endpoint verifies signatures if public certificate is provided
- All payment endpoints are protected by CORS origin restrictions
- Orders are tracked in the database for audit purposes

## Testing

1. Set up your `.env` file with test credentials
2. Test the `/health` endpoint: `GET http://localhost:5000/health`
3. Test order creation: `POST http://localhost:5000/api/orders`
4. Test signature generation: `POST http://localhost:5000/mypos/sign`

## Production Deployment

- Ensure HTTPS is enabled
- Set up proper CORS origins for your domain
- Configure myPOS notify URL to point to your production server
- Monitor the `/mypos/notify` endpoint for payment updates
