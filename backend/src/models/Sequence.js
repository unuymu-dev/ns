import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sequence = sequelize.define('Sequence', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    classification_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'classifications',
            key: 'id'
        }
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'units',
            key: 'id'
        },
        comment: 'Unit penerbit: INTERNAL=unit pemohon, EXTERNAL=TURT'
    },
    last_number: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'sequences',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['classification_id', 'year', 'unit_id'],
            name: 'uq_sequence'
        }
    ]
});

export default Sequence;
