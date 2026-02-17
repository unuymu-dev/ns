import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';
import { Sequence, IssuedNumber, Classification, Unit } from '../models/index.js';

/**
 * SequenceService - KUNCI ANTI-DUPLIKASI
 * 
 * Service ini menangani penerbitan nomor surat dengan mekanisme:
 * 1. Row locking (SELECT ... FOR UPDATE)
 * 2. Atomic transaction
 * 3. Unique constraint di database
 */

class SequenceService {
    /**
     * Generate nomor surat (1 atau batch)
     * 
     * @param {Object} params
     * @param {string} params.type - 'INTERNAL' atau 'EXTERNAL'
     * @param {number} params.classificationId
     * @param {number} params.applicantUnitId
     * @param {number} params.qty - jumlah nomor yang diminta
     * @param {number} params.requestId - ID permohonan (optional)
     * @param {Object} params.metadata - {subject, recipient, signer}
     * @param {Transaction} transaction - Sequelize transaction (WAJIB)
     * @returns {Promise<Array>} Array of issued numbers
     */
    async generateNumbers({ type, classificationId, applicantUnitId, qty = 1, requestId = null, metadata = {} }, transaction) {
        if (!transaction) {
            throw new Error('Transaction is required for generateNumbers');
        }

        // Tentukan unit penerbit berdasarkan tipe
        const issuerUnitId = type === 'EXTERNAL'
            ? parseInt(process.env.TURT_UNIT_ID)
            : applicantUnitId;

        const year = new Date().getFullYear();

        // STEP 1: Ambil atau buat sequence dengan ROW LOCKING
        // Ini adalah KUNCI anti-duplikasi
        const [sequence, created] = await Sequence.findOrCreate({
            where: {
                classification_id: classificationId,
                year: year,
                unit_id: issuerUnitId
            },
            defaults: {
                last_number: 0
            },
            lock: transaction.LOCK.UPDATE, // SELECT ... FOR UPDATE
            transaction
        });

        // STEP 2: Hitung range nomor
        const startNumber = sequence.last_number + 1;
        const endNumber = sequence.last_number + qty;

        // STEP 3: Update counter
        await sequence.update(
            { last_number: endNumber },
            { transaction }
        );

        // STEP 4: Ambil data untuk build full code
        const classification = await Classification.findByPk(classificationId, { transaction });
        const applicantUnit = await Unit.findByPk(applicantUnitId, { transaction });

        if (!classification || !applicantUnit) {
            throw new Error('Classification or Unit not found');
        }

        // STEP 5: Generate batch ID jika qty > 1
        const batchId = qty > 1 ? uuidv4() : null;

        // STEP 6: Buat array nomor surat
        const issuedNumbers = [];
        for (let i = startNumber; i <= endNumber; i++) {
            const fullCode = this.buildFullCode(
                classification.code,
                applicantUnit.code,
                i,
                year
            );

            const qrToken = uuidv4();

            issuedNumbers.push({
                request_id: requestId,
                type,
                classification_id: classificationId,
                issuer_unit_id: issuerUnitId,
                applicant_unit_id: applicantUnitId,
                number_int: i,
                year,
                full_code: fullCode,
                qr_token: qrToken,
                subject: metadata.subject || null,
                recipient: metadata.recipient || null,
                signer: metadata.signer || null,
                batch_id: batchId,
                batch_index: qty > 1 ? (i - startNumber + 1) : null
            });
        }

        // STEP 7: Bulk insert ke database
        const createdNumbers = await IssuedNumber.bulkCreate(issuedNumbers, { transaction });

        return createdNumbers;
    }

    /**
     * Build full code nomor surat
     * Format: KODE_KLASIFIKASI/KODE_UNIT/NO_URUT/TAHUN
     * Contoh: OT.02.01/D.IX.2.1/659/2026
     */
    buildFullCode(classificationCode, unitCode, numberInt, year) {
        return `${classificationCode}/${unitCode}/${numberInt}/${year}`;
    }

    /**
     * Get next number (preview tanpa commit)
     * Berguna untuk preview nomor yang akan terbit
     */
    async getNextNumber(type, classificationId, applicantUnitId) {
        const issuerUnitId = type === 'EXTERNAL'
            ? parseInt(process.env.TURT_UNIT_ID)
            : applicantUnitId;

        const year = new Date().getFullYear();

        const sequence = await Sequence.findOne({
            where: {
                classification_id: classificationId,
                year: year,
                unit_id: issuerUnitId
            }
        });

        const nextNumber = sequence ? sequence.last_number + 1 : 1;

        // Build preview
        const classification = await Classification.findByPk(classificationId);
        const applicantUnit = await Unit.findByPk(applicantUnitId);

        if (!classification || !applicantUnit) {
            return null;
        }

        return {
            next_number: nextNumber,
            preview_code: this.buildFullCode(
                classification.code,
                applicantUnit.code,
                nextNumber,
                year
            )
        };
    }

    /**
     * Reset sequences untuk tahun baru (cron job)
     * Tidak perlu hapus data, cukup buat entry baru untuk tahun baru
     */
    async resetYearlySequences() {
        // Sequences akan otomatis reset karena unique constraint (classification, year, unit)
        // Tidak perlu action khusus
        console.log('Yearly sequences will auto-reset on first request of new year');
    }
}

export default new SequenceService();
