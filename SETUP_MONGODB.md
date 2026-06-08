# Phase 1: Data Persistence with MongoDB - Setup Guide

## ✅ What We've Implemented

1. **User Model** - User authentication with bcrypt password hashing
2. **Auth Routes** - Register, Login, Profile management
3. **JWT Authentication** - Secure token-based authentication
4. **Prediction & Feedback Models** - Already in place (MongoDB ready)
5. **Updated Dependencies** - Added bcryptjs and jsonwebtoken

## 📋 Setup Steps

### Step 1: Install Dependencies
```bash
cd fakebuster-mern/server
npm install
```

### Step 2: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Get your connection string

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Add your MongoDB connection string to `MONGO_URI`
3. Generate a random JWT_SECRET (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

Example `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fakebuster?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_here
JWT_EXPIRE=7d
PORT=5051
CLIENT_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
```

### Step 4: Start the Server
```bash
npm run dev
```

## 🔐 API Endpoints

### Authentication

**Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Get Current User** (requires token)
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Update Preferences** (requires token)
```bash
PATCH /api/auth/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": {
    "theme": "dark",
    "defaultTask": "spam",
    "emailNotifications": false
  }
}
```

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "user" | "admin",
  preferences: {
    theme: "light" | "dark" | "auto",
    emailNotifications: Boolean,
    defaultTask: "fake_news" | "spam"
  },
  stats: {
    totalPredictions: Number,
    totalBatchRows: Number,
    averageAccuracy: Number
  },
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Predictions Collection
```javascript
{
  _id: ObjectId,
  task: "fake_news" | "spam",
  source: "single" | "batch",
  inputText: String,
  label: String,
  riskScore: Number,
  riskLevel: "low" | "medium" | "high",
  explanation: String,
  signals: [String],
  safetyTip: String,
  feedback: {
    rating: "correct" | "wrong" | "unsure",
    actualLabel: String,
    note: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Next Steps

1. **Frontend Auth Integration** - Add login/register UI to React app
2. **Protected Routes** - Require auth for predictions
3. **User History** - Show only user's own predictions
4. **Rate Limiting** - Prevent API abuse
5. **Email Verification** - Confirm email addresses

## ⚠️ Important Notes

- Keep `JWT_SECRET` and `MONGO_URI` secure (never commit to git)
- Use environment variables for all sensitive data
- Passwords are automatically hashed before storage
- Tokens expire after the set time (default: 7 days)
- Users can only access their own prediction history

## 🔧 Troubleshooting

### MongoDB Connection Failed
- Check your MONGO_URI is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify database name matches in connection string

### JWT Errors
- Ensure JWT_SECRET is set in .env
- Check token is being sent in Authorization header
- Verify token hasn't expired

