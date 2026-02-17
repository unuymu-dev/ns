# Sistem Penomoran Surat RSCM - Backend API

Backend API untuk sistem penomoran surat dengan desentralisasi nomor internal dan sentralisasi nomor eksternal (TTE Direktur).

## 🚀 Features

- ✅ **Anti-Duplikasi**: Row locking dengan atomic transaction
- ✅ **RBAC**: Role-based access control (PEMOHON, TURT, ADMIN)
- ✅ **Real-time Notifications**: Socket.IO untuk notifikasi instant
- ✅ **Draft Mode**: Simpan draft sebelum submit
- ✅ **Batch Generation**: Terbitkan multiple nomor sekaligus
- ✅ **QR Verification**: Verifikasi keaslian nomor surat
- ✅ **Audit Trail**: Logging lengkap semua aktivitas
- ✅ **Excel Export**: Export laporan ke Excel

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 13.x (atau MySQL/MariaDB)
- npm atau yarn

## 🛠️ Installation

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/nomorsurat
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nomorsurat
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:3000

# TURT Unit ID (sesuaikan setelah setup database)
TURT_UNIT_ID=1
```

### 3. Setup Database

**Buat database PostgreSQL:**

```bash
createdb nomorsurat
```

**Atau via psql:**

```sql
CREATE DATABASE nomorsurat;
```

**Run migrations & seeds:**

```bash
node src/scripts/setup-db.js
```

Output:
```
✅ Database connection established
🔄 Running database migrations...
✅ Migrations completed successfully
🌱 Running database seeds...
✅ Seeds completed successfully

========================================
✅ Database setup completed!
========================================

Default credentials:
  Admin:    username: admin, password: password123
  TURT:     username: turt_kepala, password: password123
  Pemohon:  username: osdm_staff, password: password123
```

### 4. Start Server

**Development mode (dengan nodemon):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Administrator",
      "username": "admin",
      "role": "ADMIN",
      "unit": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Internal Letters (Self-Issued)

#### Issue Internal Number
```http
POST /api/internal/issue
Authorization: Bearer {token}
Content-Type: application/json

{
  "letter_date": "2026-02-16",
  "classification_id": 8,
  "recipient": "Kepala Instalasi Rawat Jalan",
  "subject": "Permohonan Data Pasien",
  "drafter": "John Doe",
  "signer": "Kepala OSDM",
  "qty": 1
}
```

#### Get My Internal Numbers
```http
GET /api/internal/my-numbers?page=1&limit=20
Authorization: Bearer {token}
```

### External Letters (TURT Workflow)

#### Create External Request
```http
POST /api/external/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "letter_date": "2026-02-16",
  "classification_id": 8,
  "recipient": "Kementerian Kesehatan RI",
  "subject": "Laporan Bulanan",
  "signer": "Direktur",
  "qty": 5,
  "is_draft": false
}
```

#### Get My Requests
```http
GET /api/external/my-requests?status=PENDING&page=1&limit=20
Authorization: Bearer {token}
```

### TURT Operations

#### Get Inbox
```http
GET /api/turt/inbox?status=PENDING&page=1&limit=20
Authorization: Bearer {token}
```

#### Approve Request
```http
POST /api/turt/approve/123
Authorization: Bearer {token}
```

#### Reject Request
```http
POST /api/turt/reject/123
Authorization: Bearer {token}
Content-Type: application/json

{
  "reject_reason": "Dokumen pendukung tidak lengkap"
}
```

### QR Verification (Public)

```http
GET /api/verify/{qr_token}
# No authentication required
```

### Notifications

```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer {token}

GET /api/notifications/unread-count
Authorization: Bearer {token}

PUT /api/notifications/123/read
Authorization: Bearer {token}

PUT /api/notifications/read-all
Authorization: Bearer {token}
```

### Reports & Export

```http
GET /api/reports/requests?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {token}

GET /api/reports/export/requests/excel?start_date=2026-01-01
Authorization: Bearer {token}
# Returns Excel file
```

## 🔌 Socket.IO Events

### Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
});

// Listen for new notifications
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
  // { id, type, title, message, link, created_at }
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## 🗄️ Database Schema

### Key Tables

- **units**: Master unit/organisasi
- **classifications**: Klasifikasi surat (hierarki)
- **users**: Users dengan RBAC
- **requests**: Permohonan nomor surat
- **sequences**: Counter dengan row locking (ANTI-DUPLIKASI)
- **issued_numbers**: Nomor surat yang sudah terbit
- **audit_logs**: Audit trail
- **notifications**: Notifikasi real-time

### Anti-Duplication Mechanism

```sql
-- Unique constraint di sequences
UNIQUE (classification_id, year, unit_id)

-- Row locking di SequenceService
SELECT ... FOR UPDATE
```

## 🧪 Testing

### Test Anti-Duplication

Simulasi concurrent approval:

```bash
# Terminal 1
curl -X POST http://localhost:5000/api/turt/approve/1 \
  -H "Authorization: Bearer {token1}"

# Terminal 2 (pada saat bersamaan)
curl -X POST http://localhost:5000/api/turt/approve/2 \
  -H "Authorization: Bearer {token2}"

# Verifikasi: nomor tidak boleh kembar
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize config
│   ├── models/
│   │   ├── Unit.js
│   │   ├── Classification.js
│   │   ├── User.js
│   │   ├── Request.js
│   │   ├── Sequence.js          # KUNCI anti-duplikasi
│   │   ├── IssuedNumber.js
│   │   ├── AuditLog.js
│   │   ├── Notification.js
│   │   └── index.js             # Associations
│   ├── services/
│   │   ├── SequenceService.js   # Row locking logic
│   │   ├── NotificationService.js
│   │   └── AuditService.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── InternalController.js
│   │   ├── ExternalController.js
│   │   ├── TurtController.js
│   │   ├── VerifyController.js
│   │   ├── NotificationController.js
│   │   └── ReportController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── internal.js
│   │   ├── external.js
│   │   ├── turt.js
│   │   ├── verify.js
│   │   ├── notifications.js
│   │   └── reports.js
│   ├── middleware/
│   │   ├── auth.js              # JWT & RBAC
│   │   └── validator.js         # Request validation
│   ├── socket/
│   │   └── index.js             # Socket.IO setup
│   ├── scripts/
│   │   └── setup-db.js          # Migration & seed
│   └── index.js                 # Main server
├── migrations/
│   └── 001_create_tables.sql
├── seeds/
│   └── 001_master_data.sql
├── package.json
├── .env.example
└── README.md
```

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing dengan bcrypt
- ✅ CORS protection
- ✅ SQL injection protection (Sequelize ORM)
- ✅ Input validation (express-validator)
- ✅ Rate limiting (recommended untuk production)

## 🚀 Production Deployment

### Recommended Setup

1. **Environment Variables**: Gunakan secret manager (AWS Secrets Manager, etc)
2. **Database**: PostgreSQL dengan connection pooling
3. **Process Manager**: PM2 untuk auto-restart
4. **Reverse Proxy**: Nginx untuk HTTPS
5. **Monitoring**: PM2 monitoring atau New Relic

### PM2 Example

```bash
npm install -g pm2

pm2 start src/index.js --name nomorsurat-api
pm2 startup
pm2 save
```

## 📝 License

MIT

## 👥 Support

Untuk pertanyaan atau issue, hubungi tim IT RSCM.
