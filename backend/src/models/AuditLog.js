import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    object_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    object_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    detail_json: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false
});

export default AuditLog;
