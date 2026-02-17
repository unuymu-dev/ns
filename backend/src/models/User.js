import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('PEMOHON', 'TURT', 'ADMIN'),
        allowNull: false
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'units',
            key: 'id'
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true
});

// Instance method untuk verify password
User.prototype.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Static method untuk hash password
User.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

export default User;
