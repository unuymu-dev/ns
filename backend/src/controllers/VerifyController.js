import { IssuedNumber, Classification, Unit } from '../models/index.js';

class VerifyController {
    /**
     * Verify QR code (PUBLIC endpoint - no auth required)
     */
    async verifyQR(req, res) {
        try {
            const { token } = req.params;

            const number = await IssuedNumber.findOne({
                where: { qr_token: token },
                include: [
                    {
                        association: 'classification',
                        attributes: ['code', 'name']
                    },
                    {
                        association: 'issuer_unit',
                        attributes: ['name', 'code']
                    },
                    {
                        association: 'applicant_unit',
                        attributes: ['name', 'code']
                    }
                ]
            });

            if (!number) {
                return res.status(404).json({
                    success: false,
                    message: 'Nomor surat tidak ditemukan atau tidak valid',
                    valid: false
                });
            }

            // Return verification data
            res.json({
                success: true,
                valid: true,
                data: {
                    full_code: number.full_code,
                    number_int: number.number_int,
                    year: number.year,
                    type: number.type,
                    issued_at: number.issued_at,
                    classification: number.classification,
                    issuer_unit: number.issuer_unit,
                    applicant_unit: number.applicant_unit,
                    subject: number.subject,
                    recipient: number.recipient,
                    signer: number.signer
                }
            });
        } catch (error) {
            console.error('Verify QR error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat verifikasi',
                error: error.message
            });
        }
    }
}

export default new VerifyController();
