const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;
console.log('URI length:', uri.length);
console.log('URI hex:', Buffer.from(uri).toString('hex'));

const hasHidden = /[\u0000-\u001F\u007F-\u009F]/.test(uri);
console.log('Has hidden control characters:', hasHidden);
