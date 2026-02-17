import jwt from 'jsonwebtoken';
import { User, Unit } from '../models/index.js';
import AuditService from '../services/AuditService.js';

class AuthController {
    /**
     * Login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({
                where: { username },
                include: [
                    {
                        association: 'unit',
                        attributes: ['id', 'name', 'code']
                    }
                ]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Username atau password salah'
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Akun Anda tidak aktif'
                });
            }

            // Verify password
            const isPasswordValid = await user.verifyPassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Username atau password salah'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            // Log login
            await AuditService.logLogin(user.id, req.ip);

            // Return user data (exclude password)
            const userData = {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                unit: user.unit
            };

            res.json({
                success: true,
                message: 'Login berhasil',
                data: {
                    user: userData,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat login',
                error: error.message
            });
        }
    }

    /**
     * Get current user info
     */
    async me(req, res) {
        try {
            const userData = {
                id: req.user.id,
                name: req.user.name,
                username: req.user.username,
                role: req.user.role,
                unit: req.user.unit
            };

            res.json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    }

    /**
     * Logout (client-side token removal)
     */
    async logout(req, res) {
        try {
            // Dalam implementasi JWT stateless, logout dilakukan di client
            // Tapi kita tetap log untuk audit
            await AuditService.log({
                userId: req.userId,
                action: 'USER_LOGOUT',
                objectType: 'User',
                objectId: req.userId,
                ip: req.ip
            });

            res.json({
                success: true,
                message: 'Logout berhasil'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat logout',
                error: error.message
            });
        }
    }
}

export default new AuthController();
