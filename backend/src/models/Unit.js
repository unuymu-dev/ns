import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Unit = sequelize.define('Unit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'units',
    timestamps: true,
    underscored: true
});

export default Unit;
