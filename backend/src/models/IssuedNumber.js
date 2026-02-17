import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const IssuedNumber = sequelize.define('IssuedNumber', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    request_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'requests',
            key: 'id'
        }
    },
    issued_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
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
    issuer_unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'units',
            key: 'id'
        },
        comment: 'Unit penerbit'
    },
    applicant_unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'units',
            key: 'id'
        },
        comment: 'Unit pemohon'
    },
    number_int: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    full_code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Format: KODE_KLASIFIKASI/KODE_UNIT/NO_URUT/TAHUN'
    },
    qr_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Token untuk verifikasi QR'
    },
    subject: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recipient: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    signer: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    batch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'UUID untuk grouping batch'
    },
    batch_index: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Urutan dalam batch (1..N)'
    }
}, {
    tableName: 'issued_numbers',
    timestamps: true,
    underscored: true
});

export default IssuedNumber;
