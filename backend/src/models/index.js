import Unit from './Unit.js';
import Classification from './Classification.js';
import User from './User.js';
import Request from './Request.js';
import Sequence from './Sequence.js';
import IssuedNumber from './IssuedNumber.js';
import AuditLog from './AuditLog.js';
import Notification from './Notification.js';

// ============================================
// ASSOCIATIONS / RELATIONSHIPS
// ============================================

// User belongs to Unit
User.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Unit.hasMany(User, { foreignKey: 'unit_id', as: 'users' });

// Request associations
Request.belongsTo(Classification, { foreignKey: 'classification_id', as: 'classification' });
Request.belongsTo(Unit, { foreignKey: 'applicant_unit_id', as: 'applicant_unit' });
Request.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Request.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

// IssuedNumber associations
IssuedNumber.belongsTo(Request, { foreignKey: 'request_id', as: 'request' });
IssuedNumber.belongsTo(Classification, { foreignKey: 'classification_id', as: 'classification' });
IssuedNumber.belongsTo(Unit, { foreignKey: 'issuer_unit_id', as: 'issuer_unit' });
IssuedNumber.belongsTo(Unit, { foreignKey: 'applicant_unit_id', as: 'applicant_unit' });

Request.hasMany(IssuedNumber, { foreignKey: 'request_id', as: 'issued_numbers' });

// Sequence associations
Sequence.belongsTo(Classification, { foreignKey: 'classification_id', as: 'classification' });
Sequence.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// Export all models
export {
    Unit,
    Classification,
    User,
    Request,
    Sequence,
    IssuedNumber,
    AuditLog,
    Notification
};
