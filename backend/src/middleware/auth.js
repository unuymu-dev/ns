import jwt from 'jsonwebtoken';
import { User, Unit } from '../models/index.js';

/**
 * Middleware untuk verifikasi JWT token
 */
export const authenticate = async (req, res, next) => {
    try {
        // Ambil token dari header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ambil user dari database
        const user = await User.findByPk(decoded.userId, {
            include: [
                {
                    association: 'unit',
                    attributes: ['id', 'name', 'code']
                }
            ],
            attributes: { exclude: ['password_hash'] }
        });

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan atau tidak aktif'
            });
        }

        // Attach user ke request
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;
        req.unitId = user.unit_id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token sudah kadaluarsa'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error verifikasi token',
            error: error.message
        });
    }
};

/**
 * Middleware untuk cek role
 * Usage: requireRole('ADMIN', 'TURT')
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Role tidak sesuai.'
            });
        }

        next();
    };
};

/**
 * Middleware untuk cek unit ownership
 * Memastikan user hanya bisa akses data unit-nya sendiri
 */
export const requireOwnUnit = (req, res, next) => {
    // Admin dan TURT bisa akses semua unit
    if (req.userRole === 'ADMIN' || req.userRole === 'TURT') {
        return next();
    }

    // Untuk PEMOHON, cek apakah data milik unit-nya
    const targetUnitId = req.params.unitId || req.body.applicant_unit_id || req.query.unit_id;

    if (targetUnitId && parseInt(targetUnitId) !== req.unitId) {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Anda hanya bisa mengakses data unit Anda.'
        });
    }

    next();
};

/**
 * Optional authentication - tidak error jika tidak ada token
 * Berguna untuk endpoint yang bisa diakses publik atau authenticated
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Lanjut tanpa user
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.userId, {
            include: [{ association: 'unit' }],
            attributes: { exclude: ['password_hash'] }
        });

        if (user && user.is_active) {
            req.user = user;
            req.userId = user.id;
            req.userRole = user.role;
            req.unitId = user.unit_id;
        }

        next();
    } catch (error) {
        // Ignore errors, just continue without user
        next();
    }
};
