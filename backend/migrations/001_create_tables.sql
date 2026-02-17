-- ============================================
-- SISTEM PENOMORAN SURAT RSCM
-- Database Schema - PostgreSQL
-- ============================================

-- Drop tables if exists (untuk development)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS issued_numbers CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS classifications CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- ============================================
-- MASTER DATA TABLES
-- ============================================

-- Tabel Units (Unit/Organisasi)
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Classifications (Klasifikasi Surat - Hierarki)
CREATE TABLE classifications (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  parent_id INT REFERENCES classifications(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Users (dengan RBAC)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('PEMOHON', 'TURT', 'ADMIN')),
  unit_id INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Tabel Requests (Permohonan Nomor Surat)
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  letter_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('INTERNAL', 'EXTERNAL')),
  classification_id INT NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
  applicant_unit_id INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  drafter VARCHAR(255),
  signer VARCHAR(255),
  qty INT DEFAULT 1 CHECK (qty > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')),
  reject_reason TEXT,
  processed_by INT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Tabel Sequences (Counter Nomor - KUNCI ANTI-DUPLIKASI)
CREATE TABLE sequences (
  id SERIAL PRIMARY KEY,
  classification_id INT NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
  year INT NOT NULL,
  unit_id INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  last_number INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- UNIQUE CONSTRAINT WAJIB untuk anti-duplikasi
  CONSTRAINT uq_sequence UNIQUE (classification_id, year, unit_id)
);

-- Tabel Issued Numbers (Nomor Surat yang Sudah Terbit)
-- Satu record = satu nomor surat
CREATE TABLE issued_numbers (
  id SERIAL PRIMARY KEY,
  request_id INT REFERENCES requests(id) ON DELETE SET NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(20) NOT NULL CHECK (type IN ('INTERNAL', 'EXTERNAL')),
  classification_id INT NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
  issuer_unit_id INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  applicant_unit_id INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  number_int INT NOT NULL,
  year INT NOT NULL,
  full_code VARCHAR(255) NOT NULL UNIQUE, -- ANTI-DUPLIKASI
  qr_token VARCHAR(255) NOT NULL UNIQUE, -- untuk verifikasi
  subject TEXT,
  recipient TEXT,
  signer VARCHAR(255),
  batch_id UUID, -- untuk grouping batch
  batch_index INT, -- urutan dalam batch (1..N)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT & NOTIFICATION TABLES
-- ============================================

-- Tabel Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  object_type VARCHAR(50),
  object_id INT,
  detail_json JSONB,
  ip VARCHAR(50)
);

-- Tabel Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP
);

-- ============================================
-- INDEXES untuk PERFORMA
-- ============================================

-- Requests indexes
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_applicant ON requests(applicant_unit_id);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_requests_created_by ON requests(created_by);
CREATE INDEX idx_requests_letter_date ON requests(letter_date);

-- Issued Numbers indexes
CREATE INDEX idx_issued_numbers_qr ON issued_numbers(qr_token);
CREATE INDEX idx_issued_numbers_type ON issued_numbers(type);
CREATE INDEX idx_issued_numbers_applicant ON issued_numbers(applicant_unit_id);
CREATE INDEX idx_issued_numbers_issuer ON issued_numbers(issuer_unit_id);
CREATE INDEX idx_issued_numbers_batch ON issued_numbers(batch_id);
CREATE INDEX idx_issued_numbers_issued_at ON issued_numbers(issued_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_object ON audit_logs(object_type, object_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Users indexes
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- COMMENTS untuk DOKUMENTASI
-- ============================================

COMMENT ON TABLE sequences IS 'Counter nomor surat dengan row locking untuk anti-duplikasi';
COMMENT ON COLUMN sequences.unit_id IS 'Unit penerbit: untuk INTERNAL = unit pemohon, untuk EXTERNAL = TURT';
COMMENT ON TABLE issued_numbers IS 'Nomor surat yang sudah terbit (satu record per nomor)';
COMMENT ON COLUMN issued_numbers.full_code IS 'Format: KODE_KLASIFIKASI/KODE_UNIT/NO_URUT/TAHUN';
COMMENT ON COLUMN issued_numbers.qr_token IS 'Token unik untuk verifikasi QR code';
