import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Classification = sequelize.define('Classification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'classifications',
            key: 'id'
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'classifications',
    timestamps: true,
    underscored: true
});

// Self-referencing association untuk hierarki
Classification.hasMany(Classification, {
    as: 'children',
    foreignKey: 'parent_id'
});

Classification.belongsTo(Classification, {
    as: 'parent',
    foreignKey: 'parent_id'
});

export default Classification;
