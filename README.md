# Image Buy App - Professional Event Photo Selling Platform

A custom-built website where users can view watermarked event photos, select desired ones, pay online using myPOS, and receive clean, high-resolution versions via email after payment.

## 🏗️ Project Structure

```
IMAGE BUY APP/
├── backend/                 # Backend server and database
│   ├── server.js           # Express server with myPOS integration
│   ├── database/           # SQLite database and manager
│   │   ├── setup.js        # Database setup script
│   │   ├── dbManager.js    # Database operations
│   │   └── photos.db       # SQLite database file
│   ├── package.json        # Backend dependencies
│   └── env-template.txt    # Environment variables template
├── client/                  # React frontend
│   ├── src/                # Source code
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
├── uploads/                 # Photo storage
│   ├── clean/              # Original clean photos
│   └── watermarked/        # Watermarked preview photos
└── package.json             # Root project configuration
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Database
```bash
npm run setup-db
```

### 3. Configure Environment
Copy `backend/env-template.txt` to `backend/.env` and fill in your credentials:
```bash
# Server Configuration
PORT=5000
BASE_URL=http://localhost:5000

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# myPOS Configuration
MYPOS_CLIENT_ID=your-mypos-client-id
MYPOS_CLIENT_SECRET=your-mypos-client-secret
MYPOS_SANDBOX=true
```

### 4. Start Development Servers
```bash
# Start both backend and frontend
npm start

# Or start separately:
npm run backend      # Backend on port 5000
npm run frontend     # Frontend on port 3000
```

## 🎯 Features

### **Photo Management**
- **Automatic Watermarking**: Photos are automatically watermarked on upload
- **Category Organization**: Organize photos by event type (wedding, corporate, birthday, etc.)
- **Flexible Pricing**: Set different prices per photo
- **Professional Naming**: Structured file naming system

### **Payment System**
- **myPOS Integration**: Secure external payment processing
- **Credit Card Support**: Professional payment gateway
- **Webhook Handling**: Secure payment confirmation
- **Order Tracking**: Complete order management

### **User Experience**
- **Watermarked Gallery**: Browse preview photos with clear indicators
- **Shopping Cart**: Select and manage photo purchases
- **Email Delivery**: Clean photos delivered automatically after payment
- **Responsive Design**: Works on all devices

## 🛠️ Technology Stack

### **Backend**
- **Node.js** with Express.js
- **SQLite** database with better-sqlite3
- **Sharp** for image processing and watermarking
- **Multer** for file uploads
- **Nodemailer** for email delivery
- **myPOS API** for payment processing

### **Frontend**
- **React 18** with Create React App
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API communication

## 📁 Database Schema

### **Photos Table**
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  watermark_path TEXT NOT NULL,
  clean_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  price REAL DEFAULT 5.99,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  category TEXT DEFAULT 'other'
);
```

## 🔧 Development

### **Backend Development**
```bash
cd backend
npm run dev          # Start with nodemon
npm run setup-db     # Recreate database
```

### **Frontend Development**
```bash
cd client
npm start            # Start React dev server
npm run build        # Build for production
```

### **Database Operations**
```bash
cd backend
npm run setup-db     # Initialize database
```

## 📸 Photo Upload Process

1. **Admin Upload**: Upload clean photos through admin panel
2. **Automatic Processing**: 
   - Photos are saved with structured naming
   - Watermarked versions are automatically created
   - Database records are created
3. **Gallery Display**: Watermarked photos shown to customers
4. **Purchase Flow**: Customers select and pay for photos
5. **Delivery**: Clean photos sent via email after payment

## 🔒 Security Features

- **Watermarked Previews**: Only preview versions visible to customers
- **Secure Payment**: External myPOS processing
- **Webhook Verification**: Payment confirmation security
- **File Access Control**: Clean photos only accessible after payment

## 🚀 Production Deployment

### **Environment Variables**
Ensure all required environment variables are set in production:
- myPOS credentials
- Email service credentials
- Base URL configuration

### **File Storage**
- Ensure `uploads/` directory is properly configured
- Set appropriate file permissions
- Consider cloud storage for production

## 📞 Support

For technical support or questions about the platform, please contact the development team.

---

**Built with ❤️ for professional photographers and event organizers**
