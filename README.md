# Event Photo Selling Website

A professional web application for selling event photos with watermark removal after payment. Built with React, Node.js, and Stripe integration.

## 🚀 Features

### For Customers
- **Browse Gallery**: View watermarked event photos in a beautiful grid layout
- **Photo Selection**: Add photos to cart with quantity controls
- **Secure Payment**: Credit card processing via Stripe
- **Instant Delivery**: Clean, high-resolution photos delivered via email after payment
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### For Administrators
- **Photo Management**: Upload watermarked and clean photo pairs
- **Gallery Control**: Manage photo prices, delete photos, view analytics
- **Order Tracking**: Monitor sales and customer orders
- **Bulk Upload**: Upload multiple photos simultaneously

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Lucide React Icons
- **Backend**: Node.js, Express.js
- **Payment**: Stripe API
- **Email**: Nodemailer
- **File Upload**: Multer
- **Styling**: Tailwind CSS with custom components

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Stripe account with API keys
- Email service credentials (Gmail, SendGrid, etc.)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd image-buy-app
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Viva Wallet Configuration
VIVA_WALLET_MERCHANT_ID=your_merchant_id_here
VIVA_WALLET_API_KEY=your_api_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Application Configuration
BASE_URL=http://localhost:5000
PORT=5000
```

### 4. Viva Wallet Setup
1. Create a Viva Wallet account at [vivawallet.com](https://vivawallet.com)
2. Get your Merchant ID and API Key from the Viva Wallet Dashboard
3. Update the `.env` file with your credentials
4. Configure webhook URL in Viva Wallet Dashboard to point to:
   ```
   https://yourdomain.com/api/viva-webhook
   ```
5. For testing, use Viva Wallet's test environment

### 5. Email Setup
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend development server
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Production Build
```bash
# Build the frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

## 📸 Usage Guide

### For Customers

1. **Browse Photos**: Visit the gallery to see watermarked event photos
2. **Select Photos**: Click on photos to view details or add to cart
3. **Manage Cart**: Review selected photos and adjust quantities
4. **Checkout**: Enter payment information and complete purchase
5. **Receive Photos**: Clean photos will be emailed automatically

### For Administrators

1. **Access Admin Panel**: Click the "Admin" button and enter the admin key
2. **Upload Photos**: Use the upload form to add watermarked and clean photo pairs
3. **Manage Gallery**: View, organize, and delete photos as needed
4. **Monitor Sales**: Track orders and revenue in the analytics section

**Default Admin Key**: `your-secret-admin-key` (change this in production!)

## 🔧 Configuration Options

### Photo Pricing
Edit the default price in `server.js`:
```javascript
price: 5.99, // Default price per photo
```

### Email Templates
Customize email content in the `sendCleanPhotosEmail` function in `server.js`.

### File Upload Limits
Adjust file size limits in `server.js`:
```javascript
limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
```

## 🚀 Deployment

### Heroku
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using the included `heroku-postbuild` script

### Vercel/Netlify
1. Build the frontend: `cd client && npm run build`
2. Deploy the `build` folder
3. Deploy the backend separately (Railway, Render, etc.)

### Environment Variables for Production
```env
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_email_password
BASE_URL=https://yourdomain.com
```

## 🔒 Security Features

- **Input Validation**: Server-side validation for all inputs
- **File Type Restrictions**: Only image files allowed
- **Secure File Names**: Unique, timestamped filenames
- **Payment Verification**: Stripe payment intent verification
- **Admin Authentication**: Simple admin key system (enhance for production)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🧪 Testing

### Test Credit Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## 🐛 Troubleshooting

### Common Issues

1. **Photos not loading**: Check file permissions in `uploads/` directory
2. **Payment errors**: Verify Stripe API keys and test mode
3. **Email not sending**: Check email credentials and app passwords
4. **Upload failures**: Ensure file sizes are within limits

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review Stripe and email service documentation
3. Open an issue on GitHub

## 🔮 Future Enhancements

- **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
- **User Accounts**: Customer registration and login system
- **Photo Categories**: Organize photos by event type
- **Bulk Discounts**: Volume pricing for multiple photos
- **Social Sharing**: Share purchased photos on social media
- **Advanced Analytics**: Detailed sales and customer insights
- **Multi-language Support**: Internationalization
- **Mobile App**: React Native companion app

---

**Built with ❤️ for professional photographers and event organizers**
