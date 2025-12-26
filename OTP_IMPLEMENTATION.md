# Email OTP Verification Implementation

## Overview
This application now uses Email OTP (One-Time Password) verification for user signup. Users must verify their email address before they can access the application.

## Architecture

### Stack
- **Database**: PostgreSQL (NeonDB)
- **Auth Logic**: Node.js/Express backend
- **OTP Delivery**: Resend (email service)
- **Tokens**: JWT (access tokens)

## Flow

### 1. User Signs Up
1. User enters email, password, and full name
2. Backend creates user account with `is_verified = FALSE`
3. Backend generates 6-digit OTP
4. OTP is hashed (bcrypt) and stored in `email_otps` table with 10-minute expiration
5. Email with OTP is sent via Resend
6. User is redirected to `/verify-otp` page

### 2. User Verifies OTP
1. User enters the 6-digit OTP from their email
2. Backend verifies OTP against hashed value
3. If valid and not expired:
   - User's `is_verified` is set to `TRUE`
   - OTP record is deleted
   - JWT token is generated and returned
   - User is logged in automatically

### 3. User Logs In (After Verification)
1. User enters email and password
2. Backend checks if `is_verified = TRUE`
3. If not verified, user is redirected to `/verify-otp`
4. If verified, JWT token is issued and user logs in

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,  -- NEW COLUMN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Email OTPs Table
```sql
CREATE TABLE email_otps (
  email TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at);
```

## API Endpoints

### POST /auth/signup
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Signup successful. Please verify your email with the OTP sent.",
  "email": "user@example.com",
  "requiresVerification": true
}
```

### POST /auth/verify-otp
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-12-26T..."
  }
}
```

### POST /auth/resend-otp
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "New OTP sent to your email."
}
```

### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (if not verified):**
```json
{
  "error": "Email not verified. Please check your email for the verification code.",
  "requiresVerification": true,
  "email": "user@example.com"
}
```

**Response (if verified):**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token_here"
}
```

## Environment Variables

### Backend (.env)
```env
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Database
DATABASE_URL=postgresql://...
```

## Email Configuration

### Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use `onboarding@resend.dev` for testing
3. Get your API key from the dashboard
4. Add to `.env` as `RESEND_API_KEY`

### Email Template
The OTP email includes:
- Professional HTML formatting
- 6-digit OTP code prominently displayed
- 10-minute expiration notice
- Branded with TerrAqua colors

## Frontend Pages

### /signup
- Collects user information
- On success, redirects to `/verify-otp` with email in state

### /verify-otp
- Displays OTP input field (6 digits)
- "Resend OTP" button
- Auto-login after successful verification

### /login
- Standard login form
- Redirects to `/verify-otp` if user is not verified

## Security Features

1. **OTP Hashing**: OTPs are hashed with bcrypt before storage
2. **Expiration**: OTPs expire after 10 minutes
3. **One-time Use**: OTP is deleted after successful verification
4. **Rate Limiting**: Consider adding rate limiting for OTP requests (future enhancement)

## Testing

### Local Testing
1. Use `onboarding@resend.dev` as the `from` address for testing
2. Resend will deliver emails to any address in development

### Production
1. Verify your domain in Resend
2. Update `from` address in `auth.js` to use your domain

## Troubleshooting

### OTP Not Received
- Check spam folder
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for delivery logs

### "Email not verified" on Login
- User needs to complete OTP verification
- Check `is_verified` column in database
- Resend OTP if needed

### Database Migration Failed
- Run `node database/setup-otp.js` to manually create tables
- Verify database connection

## Future Enhancements

1. **Rate Limiting**: Limit OTP requests per email/IP
2. **SMS OTP**: Add SMS as alternative verification method
3. **Email Templates**: Use Resend's React Email for better templates
4. **Admin Panel**: View/manage unverified users
5. **Cleanup Job**: Automatically delete expired OTPs
