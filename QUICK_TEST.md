# Phase 1 Quick Reference - Testing Commands

## 🚀 Quick Start

```bash
# Terminal 1: Start API Server
cd fakebuster-mern/server
npm run dev

# Terminal 2: Start Client
cd fakebuster-mern/client
npm run dev

# Terminal 3: Start ML Service
cd fakebuster-mern
.\venv\Scripts\python ml-service\app.py
```

---

## 📋 Quick Test Commands

### 1. Register User
```bash
curl -X POST http://127.0.0.1:5051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!","name":"John"}'
```

**Expected:** Returns token and user object (201)

---

### 2. Login User
```bash
curl -X POST http://127.0.0.1:5051/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!"}'
```

**Expected:** Returns token and user object (200)

---

### 3. Get Profile (with token)
```bash
curl -X GET http://127.0.0.1:5051/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Returns user profile (200)

---

### 4. Make Prediction
```bash
curl -X POST http://127.0.0.1:5051/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "task":"fake_news",
    "text":"Breaking news: secret discovered!",
    "threshold":null
  }'
```

**Expected:** Returns prediction result (200)

---

### 5. Get History
```bash
curl -X GET "http://127.0.0.1:5051/api/predictions?limit=10"
```

**Expected:** Returns array of recent predictions (200)

---

## ✅ Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 201 | Created | User registered |
| 200 | Success | Login successful |
| 400 | Bad Request | Missing fields |
| 401 | Unauthorized | Invalid token |
| 404 | Not Found | User not found |
| 500 | Server Error | Database error |

---

## 🔑 Key Information

**API Server:** http://127.0.0.1:5051
**Client:** http://127.0.0.1:5173
**ML Service:** http://127.0.0.1:5055

**Current Mode:** In-Memory (no MongoDB required)
**Data Persistence:** Session only (lost on restart)

---

## 📊 Test Matrix

```
FEATURE                STATUS    WORKS WITHOUT DB
User Registration      ✅        Yes (in-memory)
User Login             ✅        Yes (in-memory)
Predictions            ✅        Yes (in-memory)
Batch Processing       ✅        Yes (in-memory)
User Profile           ⏳        Needs full auth flow
Preferences Update     ⏳        Needs full auth flow
```

---

## 🛠️ Using Postman

1. **Create Request**
   - Method: POST
   - URL: http://127.0.0.1:5051/api/auth/register
   - Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "TestPass123",
     "name": "Test User"
   }
   ```

2. **Save Token**
   - Copy `token` from response
   - Set in Postman variable `{{token}}`

3. **Use Token**
   - Add header: `Authorization: Bearer {{token}}`
   - Test protected endpoints

---

## 🐛 Common Issues

### "MongoDB not configured" 
**Solution:** This is normal! In-memory mode is active.
To enable MongoDB:
1. Create `.env` with MONGO_URI
2. Restart server

### "Invalid credentials"
**Solution:** Check email and password match registration

### "No token provided"
**Solution:** Add Authorization header with Bearer token

### CORS Error
**Solution:** Ensure client is on 127.0.0.1:5173 (not localhost)

---

## 📈 What's Next?

✅ Phase 1 Complete (Data Persistence)
  - User authentication
  - In-memory storage
  - JWT tokens
  - Ready for MongoDB

⏳ Phase 2: Code Quality & Testing
  - Unit tests with Jest
  - Integration tests
  - ESLint configuration

⏳ Phase 3: API Enhancements
  - Swagger documentation
  - Pagination & filtering
  - Rate limiting

---

## 📚 Documentation

- **SETUP_MONGODB.md** - MongoDB setup instructions
- **TESTING_PHASE1.md** - Detailed test cases
- **PHASE1_TEST_REPORT.md** - Full test results
- **This file** - Quick reference

---

**Phase 1: ACTIVE ✅**
Ready for testing!

