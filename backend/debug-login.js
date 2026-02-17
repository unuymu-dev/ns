// backend/debug-login.js
import dotenv from 'dotenv';
import sequelize from './src/config/database.js';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function debugLogin() {
    try {
        console.log('🔍 DEBUG LOGIN SCRIPT');
        console.log('========================================\n');

        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // 2. Fetch admin user
        console.log('2️⃣ Fetching admin user...');
        const user = await User.findOne({
            where: { username: 'admin' }
        });

        if (!user) {
            console.log('❌ User "admin" not found in database');
            console.log('\nAvailable users:');
            const allUsers = await User.findAll({ attributes: ['id', 'username', 'role'] });
            console.table(allUsers.map(u => ({ id: u.id, username: u.username, role: u.role })));
            process.exit(0);
        }

        console.log('✅ User found:', { id: user.id, username: user.username, name: user.name, role: user.role });
        console.log('   Password hash in DB:', user.password_hash);
        console.log('   Is active:', user.is_active, '\n');

        // 3. Test password verification
        console.log('3️⃣ Testing password verification...');
        const testPassword = 'password123';
        
        console.log(`   Testing password: "${testPassword}"`);
        console.log(`   Hash in DB: ${user.password_hash}`);
        
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log(`   bcrypt.compare result: ${isValid}\n`);

        if (isValid) {
            console.log('✅ PASSWORD VERIFICATION SUCCESS!');
        } else {
            console.log('❌ PASSWORD VERIFICATION FAILED');
            console.log('   Password or hash mismatch\n');

            // 4. Try to verify using User model method
            console.log('4️⃣ Testing with User.verifyPassword method...');
            const isValidMethod = await user.verifyPassword(testPassword);
            console.log(`   Result: ${isValidMethod}\n`);
        }

        // 5. Show all users and their hash status
        console.log('5️⃣ All users in database:');
        const allUsers = await User.findAll({
            attributes: ['id', 'name', 'username', 'password_hash', 'role', 'is_active']
        });
        
        console.table(allUsers.map(u => ({
            ID: u.id,
            Username: u.username,
            Role: u.role,
            Active: u.is_active ? '✅' : '❌',
            HashPrefix: u.password_hash.substring(0, 15) + '...'
        })));

        console.log('\n========================================');
        console.log('✅ Debug complete\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

debugLogin();