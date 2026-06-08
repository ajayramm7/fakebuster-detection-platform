# Phase 1 Testing Guide - Data Persistence

## 🧪 Testing Scenarios

### Test 1: Without MongoDB (In-Memory Mode)
**Status:** ✅ Works now (fallback mode)
- Predictions stored in memory
- Limited to 50 most recent items
- Data lost on server restart

### Test 2: With MongoDB Connection
**Status:** Requires setup
- Persistent storage
- Full history retention
- Multi-session access

---

## 📝 Test Plan

### A. Authentication Endpoints

#### Test 1.1: Register New User
```bash
curl -X POST http://127.0.0.1:5051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'
```

**Expected Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "user",
    "preferences": {
      "theme": "auto",
      "emailNotifications": true,
      "defaultTask": "fake_news"
    },
    "stats": {
      "totalPredictions": 0,
      "totalBatchRows": 0,
      "averageAccuracy": 0
    },
    "createdAt": "2026-06-08T...",
    "updatedAt": "2026-06-08T..."
  }
}
```

#### Test 1.2: Login with Credentials
```bash
curl -X POST http://127.0.0.1:5051/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Test 1.3: Get Current User Profile
```bash
curl -X GET http://127.0.0.1:5051/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "user": {
    "_id": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    ...
  }
}
```

#### Test 1.4: Update User Preferences
```bash
curl -X PATCH http://127.0.0.1:5051/api/auth/preferences \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "dark",
      "defaultTask": "spam",
      "emailNotifications": false
    }
  }'
```

**Expected Response (200):**
```json
{
  "user": {
    "preferences": {
      "theme": "dark",
      "defaultTask": "spam",
      "emailNotifications": false
    }
    ...
  }
}
```

### B. Error Cases

#### Test 2.1: Invalid Credentials
```bash
curl -X POST http://127.0.0.1:5051/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

#### Test 2.2: Duplicate Email Registration
```bash
curl -X POST http://127.0.0.1:5051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "AnotherPassword123",
    "name": "Another User"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Email already registered"
}
```

#### Test 2.3: Missing Token
```bash
curl -X GET http://127.0.0.1:5051/api/auth/me
```

**Expected Response (401):**
```json
{
  "error": "No token provided"
}
```

#### Test 2.4: Invalid Token
```bash
curl -X GET http://127.0.0.1:5051/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "error": "Invalid or expired token"
}
```

---

## 🛠️ Testing Tools

### Option 1: Using cURL (Command Line)
See examples above.

### Option 2: Using Postman (GUI)
1. Download [Postman](https://www.postman.com/downloads/)
2. Import the requests below
3. Set `{{base_url}}` to `http://127.0.0.1:5051`
4. Set `{{token}}` to your JWT token from login

### Option 3: Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create requests from VS Code

---

## 📊 Postman Collection

```json
{
  "info": {
    "name": "FakeBuster Auth Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/register",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"test@example.com\", \"password\": \"TestPass123\", \"name\": \"Test\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"test@example.com\", \"password\": \"TestPass123\"}"
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/auth/me",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ]
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://127.0.0.1:5051"},
    {"key": "token", "value": ""}
  ]
}
```

---

## ✅ Quick Testing Checklist

### Without MongoDB (Current State)
- [ ] Server starts without MONGO_URI
- [ ] Predictions are stored in memory
- [ ] History shows max 50 items
- [ ] Data persists within session

### With MongoDB Setup
- [ ] Create `.env` with MONGO_URI
- [ ] Server connects to MongoDB
- [ ] Register endpoint creates user in DB
- [ ] Login endpoint retrieves user from DB
- [ ] Predictions are stored permanently
- [ ] User can retrieve their history

### Authentication Flow
- [ ] Register new user with valid credentials
- [ ] Login returns JWT token
- [ ] Token can be used to access protected routes
- [ ] Invalid token is rejected
- [ ] Expired token is rejected
- [ ] Password is hashed (not stored plain)

### User Preferences
- [ ] User preferences are saved
- [ ] Preferences persist across sessions
- [ ] Default values are correct

---

## 🚀 Running Tests

### Step 1: Start the Server
```bash
cd fakebuster-mern/server
npm run dev
```

### Step 2: Choose Testing Method

#### Method A: cURL Testing
```bash
# Copy and run the curl commands from "Test Plan" section above
```

#### Method B: Postman Testing
1. Open Postman
2. Create new collection
3. Add requests from "Postman Collection" section
4. Set variables (base_url, token)
5. Run requests

#### Method C: Thunder Client (VS Code)
1. Open VS Code
2. Open Thunder Client extension
3. Create new request
4. Input URL, headers, body
5. Send request

### Step 3: Verify Responses
- Check status codes (201, 200, 400, 401, etc.)
- Verify response JSON structure
- Confirm tokens are generated
- Test error messages

---

## 📈 Testing Results Format

After each test, document:
```
TEST: [Test Name]
ENDPOINT: [URL]
METHOD: [GET/POST/PATCH]
STATUS: [✅ PASS / ❌ FAIL]
NOTES: [Any observations]
```

---

## 🔍 Debugging Tips

### If auth endpoints are not working:
1. Check server is running: `http://127.0.0.1:5051/api/health`
2. Verify CORS is enabled
3. Check Authorization header format: `Bearer <token>`
4. Ensure JWT_SECRET is set in .env

### If MongoDB is not connecting:
1. Verify MONGO_URI in .env
2. Check MongoDB Atlas IP whitelist
3. Verify database name in URI
4. Check network connectivity

### If tokens are invalid:
1. Ensure token is copied completely
2. Check token hasn't expired (default 7 days)
3. Verify JWT_SECRET matches on server
4. Try logging in again for new token

