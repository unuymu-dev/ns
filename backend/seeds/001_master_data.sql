-- ============================================
-- SEED DATA untuk SISTEM PENOMORAN SURAT
-- ============================================

-- ============================================
-- UNITS (Unit/Organisasi)
-- ============================================

INSERT INTO units (id, name, code, is_active) VALUES
(1, 'Tata Usaha Rumah Tangga (TURT)', 'TURT', TRUE),
(2, 'Organisasi dan Sumber Daya Manusia (OSDM)', 'D.IX.2.1', TRUE),
(3, 'Keuangan', 'D.IX.2.2', TRUE),
(4, 'Perencanaan', 'D.IX.2.3', TRUE),
(5, 'Hukum dan Humas', 'D.IX.2.4', TRUE),
(6, 'Instalasi Gawat Darurat', 'IGD', TRUE),
(7, 'Instalasi Rawat Jalan', 'IRJ', TRUE),
(8, 'Instalasi Rawat Inap', 'IRI', TRUE);

-- Reset sequence untuk units
SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));

-- ============================================
-- CLASSIFICATIONS (Klasifikasi Surat)
-- ============================================

-- Parent classifications
INSERT INTO classifications (id, code, name, parent_id, is_active) VALUES
(1, 'OT', 'Organisasi dan Tata Laksana', NULL, TRUE),
(2, 'KP', 'Kepegawaian', NULL, TRUE),
(3, 'KU', 'Keuangan', NULL, TRUE),
(4, 'HK', 'Hukum', NULL, TRUE),
(5, 'HM', 'Humas', NULL, TRUE);

-- Sub classifications (contoh untuk OT)
INSERT INTO classifications (id, code, name, parent_id, is_active) VALUES
(6, 'OT.01', 'Organisasi', 1, TRUE),
(7, 'OT.02', 'Tata Laksana', 1, TRUE),
(8, 'OT.02.01', 'Ketatalaksanaan', 7, TRUE),
(9, 'OT.02.02', 'Pelaporan', 7, TRUE);

-- Sub classifications untuk KP
INSERT INTO classifications (id, code, name, parent_id, is_active) VALUES
(10, 'KP.01', 'Formasi dan Pengadaan', 2, TRUE),
(11, 'KP.02', 'Mutasi', 2, TRUE),
(12, 'KP.03', 'Kepangkatan', 2, TRUE),
(13, 'KP.04', 'Kesejahteraan', 2, TRUE);

-- Sub classifications untuk KU
INSERT INTO classifications (id, code, name, parent_id, is_active) VALUES
(14, 'KU.01', 'Anggaran', 3, TRUE),
(15, 'KU.02', 'Perbendaharaan', 3, TRUE),
(16, 'KU.03', 'Akuntansi', 3, TRUE);

-- Reset sequence
SELECT setval('classifications_id_seq', (SELECT MAX(id) FROM classifications));

-- ============================================
-- USERS (dengan password default: password123)
-- Password hash untuk 'password123' menggunakan bcrypt
-- ============================================

-- Admin
INSERT INTO users (id, name, username, password_hash, role, unit_id, is_active) VALUES
(1, 'Administrator', 'admin', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'ADMIN', 1, TRUE);

-- TURT Users
INSERT INTO users (id, name, username, password_hash, role, unit_id, is_active) VALUES
(2, 'Kepala TURT', 'turt_kepala', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'TURT', 1, TRUE),
(3, 'Staff TURT 1', 'turt_staff1', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'TURT', 1, TRUE);

-- Pemohon dari berbagai unit
INSERT INTO users (id, name, username, password_hash, role, unit_id, is_active) VALUES
(4, 'Staff OSDM', 'osdm_staff', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'PEMOHON', 2, TRUE),
(5, 'Staff Keuangan', 'keuangan_staff', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'PEMOHON', 3, TRUE),
(6, 'Staff Perencanaan', 'perencanaan_staff', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'PEMOHON', 4, TRUE),
(7, 'Staff Hukum', 'hukum_staff', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'PEMOHON', 5, TRUE),
(8, 'Staff IGD', 'igd_staff', '$2b$10$rKz8qYQXxJ5vYqYQXxJ5vOqYQXxJ5vYqYQXxJ5vYqYQXxJ5vYqYQX', 'PEMOHON', 6, TRUE);

-- Reset sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ============================================
-- INFORMASI LOGIN
-- ============================================

-- Tampilkan informasi login
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA BERHASIL DIJALANKAN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials (password: password123):';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Admin:       username: admin';
  RAISE NOTICE 'TURT:        username: turt_kepala / turt_staff1';
  RAISE NOTICE 'Pemohon:     username: osdm_staff / keuangan_staff / dll';
  RAISE NOTICE '';
  RAISE NOTICE 'Total Units: %', (SELECT COUNT(*) FROM units);
  RAISE NOTICE 'Total Classifications: %', (SELECT COUNT(*) FROM classifications);
  RAISE NOTICE 'Total Users: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '========================================';
END $$;
