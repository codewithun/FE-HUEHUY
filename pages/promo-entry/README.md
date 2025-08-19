# Promo Entry System

Sistem entry point untuk akses promo melalui QR code dengan registrasi minimal dan routing yang sudah disesuaikan.

## Alur Pengguna Terbaru

1. **QR Code Scan**: User memindai QR code menggunakan kamera HP yang mengarah ke `http://localhost:3000/promo-entry?promoId=123`
2. **Entry Point**: URL mengarahkan ke `/promo-entry?promoId=123`
3. **Auto Redirect**: Sistem menyimpan `promoId` ke sessionStorage, lalu redirect ke `/promo-entry/register?promoId=123`
4. **Registrasi**: User mengisi nama dan nomor WhatsApp, sistem kirim OTP via WhatsApp bot
5. **Verifikasi OTP**: Redirect ke `/promo-entry/verify-otp?promoId=123`, user input OTP
6. **Success**: Setelah OTP valid, redirect ke `/app/komunitas/promo/detail_promo?promoId=123&communityId=promo-entry`

## Struktur File

```
pages/promo-entry/
├── index.jsx          # Entry point utama - handle ?promoId, simpan ke sessionStorage
├── [promoId].jsx      # Dynamic route untuk direct access ke promo specific
├── register.jsx       # Form registrasi (nama + WA) dengan promoId tracking
├── verify-otp.jsx     # Verifikasi OTP dengan promoId tracking
├── quick.jsx          # Single page entry (optional, belum dipakai)
└── README.md          # Dokumentasi ini
```

## URL Routes & Flow

### 1. QR Scan Flow
```
QR Code → http://localhost:3000/promo-entry?promoId=123
       ↓
/promo-entry?promoId=123 (simpan ke sessionStorage)
       ↓
Check Login:
├─ Sudah Login → /app/komunitas/promo/detail_promo?promoId=123&communityId=promo-entry
└─ Belum Login → /promo-entry/register?promoId=123
                        ↓
                 /promo-entry/verify-otp?promoId=123
                        ↓
                 /app/komunitas/promo/detail_promo?promoId=123&communityId=promo-entry
```

### 2. Direct Access
```
/promo-entry/[promoId] → langsung redirect ke detail promo dengan promoId yang sesuai
```

## Data Management

### sessionStorage Keys
- `huehuy_promo_id`: Menyimpan promoId untuk konsistensi routing
- `last_otp_sent`: Timestamp terakhir OTP dikirim (prevent spam)
- `otp_sent_time`: Waktu pengiriman OTP untuk countdown

### Cookies
- `temp_user_token`: Token sementara untuk verifikasi OTP
- `huehuy_user_token`: Token user setelah login berhasil

## Helper Functions

File: `helpers/promo-entry.helpers.ts`

- `savePromoId(promoId)`: Simpan promoId ke sessionStorage
- `getPromoId()`: Ambil promoId dari sessionStorage  
- `clearPromoId()`: Hapus promoId dari sessionStorage
- `isOtpRecentlySent()`: Cek apakah OTP baru saja dikirim (prevent spam)
- `markOtpSent()`: Tandai OTP sudah dikirim
- `clearOtpMarker()`: Hapus marker OTP
- `isValidPromoId(promoId)`: Validasi format promoId

## API Endpoints

### 1. POST `/auth/promo-register`
Registrasi untuk promo entry
```json
{
  "name": "string",
  "phone": "string", 
  "promo_id": "string"
}
```

Response:
```json
{
  "success": true,
  "temp_token": "encrypted_token",
  "message": "OTP sent to WhatsApp"
}
```

### 2. POST `/auth/verify-otp`
Verifikasi kode OTP
```json
{
  "otp_code": "string",
  "temp_token": "string",
  "promo_code": "string" // optional
}
```

Response:
```json
{
  "success": true,
  "user_token": "encrypted_token",
  "user": {
    "id": "number",
    "name": "string",
    "phone": "string"
  }
}
```

### 3. POST `/auth/resend-otp`
Kirim ulang OTP
```json
{
  "temp_token": "string",
  "promo_code": "string" // optional
}
```

Response:
```json
{
  "success": true,
  "message": "New OTP sent"
}
```

## Fitur Utama

### 1. Registrasi Minimal
- Hanya butuh nama lengkap dan nomor WhatsApp
- Validasi nomor WA format Indonesia (08xxx)
- Auto-generate password sementara

### 2. WhatsApp OTP Integration
- Auto-send OTP via WhatsApp bot
- 6 digit random code
- Countdown timer 60 detik untuk resend
- Auto-expire OTP setelah 5 menit

### 3. Promo Code Handling
- Support dynamic promo code dari QR
- Persistent promo code di setiap step
- Auto-redirect ke halaman promo setelah login

### 4. Security Features
- Temporary token untuk session OTP
- Encrypted cookie storage
- Auto-cleanup expired sessions

## QR Code Format

QR code harus menghasilkan URL:
```
https://yourdomain.com/promo-entry/PROMOCODE123
```

## Testing

### Manual Testing URLs:
- `http://localhost:3000/promo-entry/TEST2024`
- `http://localhost:3000/promo-entry/register?code=TEST2024`
- `http://localhost:3000/promo-entry/verify-otp?code=TEST2024`

### Mock Data untuk Development:
```javascript
// Mock promo codes
const mockPromoCodes = [
  'PROMO2024',
  'DISCOUNT50',
  'SPECIAL2024',
  'TEST2024'
];
```

## Integration Notes

1. **Backend Integration**: Pastikan endpoint API sudah ready
2. **WhatsApp Bot**: Setup bot untuk send OTP
3. **Promo System**: Pastikan halaman `/promo/[code]` sudah ada
4. **Error Handling**: Handle network errors, expired tokens, invalid codes

## Mobile Optimization

- Responsive design untuk mobile first
- Camera access untuk QR scanning
- Touch-friendly button sizes
- Loading states untuk network requests

## Security Considerations

- Rate limiting untuk resend OTP
- Phone number validation
- Secure token storage
- Session timeout handling
- XSS protection untuk user inputs
