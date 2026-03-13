const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;
console.log('URI length:', uri.length);
const buf = Buffer.from(uri);
console.log('URI hex (last 5):', buf.slice(-5).toString('hex'));
console.log('URI end chars:', JSON.stringify(uri.slice(-5)));

// Print the whole thing in hex to be sure
console.log('Full Hex:', buf.toString('hex'));
