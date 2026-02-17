import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Request = sequelize.define('Request', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    letter_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('INTERNAL', 'EXTERNAL'),
        allowNull: false
    },
    classification_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'classifications',
            key: 'id'
        }
    },
    applicant_unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'units',
            key: 'id'
        }
    },
    recipient: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    subject: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    drafter: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    signer: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    qty: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'DRAFT'
    },
    reject_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    processed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'requests',
    timestamps: true,
    underscored: true
});

export default Request;
