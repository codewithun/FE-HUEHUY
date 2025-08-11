# Environment Configuration

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# API Configuration (Development)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
# atau sesuai dengan backend API Anda

# Base URL for QR codes (Development)  
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# WhatsApp Bot Configuration (Backend)
WHATSAPP_BOT_TOKEN=your_whatsapp_bot_token
WHATSAPP_BOT_URL=https://api.whatsapp.com/v1/
WHATSAPP_BOT_NUMBER=+6281234567890

# Encryption Key (Backend)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# JWT Configuration (Backend)  
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=365d

# OTP Configuration (Backend)
OTP_EXPIRE_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=3
```

## Frontend Configuration

No additional frontend configuration needed. The system uses:
- Next.js built-in features
- Client-side cookie management
- Environment variables via `process.env.NEXT_PUBLIC_*`

## Backend API Endpoints

Make sure these endpoints are implemented:

### 1. Promo Registration  
```
POST /api/auth/promo-register
Content-Type: multipart/form-data

Parameters:
- name (string, required)
- phone (string, required, format: 08xxxxxxxxx)  
- promo_id (string, optional) // Updated dari promo_code

Response Success (200):
{
  "message": "Registration successful",
  "temp_token": "encrypted_temporary_token",
  "user_id": "123",
  "otp_sent": true
}

Response Error (400):
{
  "message": "Phone number already registered",
  "errors": {...}
}
```

### 2. OTP Verification
```
POST /api/auth/verify-otp
Content-Type: multipart/form-data

Parameters:
- otp_code (string, required, 6 digits)
- temp_token (string, required)
- promo_code (string, optional)
```

### 3. Resend OTP
```
POST /api/auth/resend-otp
Content-Type: multipart/form-data

Parameters:
- temp_token (string, required)
- promo_code (string, optional)
```

## WhatsApp Message Template

Example OTP message format:
```
🎉 HUEHUY Promo Code

Kode OTP Anda: *123456*

Gunakan kode ini untuk mengakses promo eksklusif.
Kode berlaku 5 menit.

Jangan bagikan kode ini kepada siapapun!

---
HUEHUY App
```

## Database Schema

Suggested tables for backend:

### users_temp
```sql
CREATE TABLE users_temp (
    id INT PRIMARY KEY AUTO_INCREMENT,
    temp_token VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    phone VARCHAR(20),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    otp_attempts INT DEFAULT 0,
    promo_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### users  
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### promo_codes
```sql
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE,
    title VARCHAR(100),
    description TEXT,
    discount_amount DECIMAL(10,2),
    discount_type ENUM('fixed', 'percentage'),
    max_uses INT,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for OTP requests (max 3 per phone per hour)
2. **Token Security**: Use secure, random tokens with proper expiration
3. **Input Validation**: Validate all inputs on backend
4. **HTTPS Only**: Use HTTPS in production
5. **CORS**: Configure CORS properly for your domain

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API endpoints implemented and tested
- [ ] WhatsApp bot configured and tested
- [ ] Database tables created
- [ ] HTTPS certificate installed
- [ ] CORS configured for frontend domain
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] Backup strategy in place
