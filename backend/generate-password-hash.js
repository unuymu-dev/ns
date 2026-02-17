// backend/generate-password-hash.js
import bcrypt from 'bcrypt';

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password hash untuk "password123":');
    console.log(hash);
}

generateHash();