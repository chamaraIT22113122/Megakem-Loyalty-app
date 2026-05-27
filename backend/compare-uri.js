const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;

if (uri.endsWith(' ')) {
    console.log('Detected trailing space!');
} else if (uri.endsWith('\r')) {
    console.log('Detected trailing return!');
} else if (uri.endsWith('\n')) {
    console.log('Detected trailing newline!');
} else {
    console.log('No obvious trailing whitespace detected by endsWith.');
    console.log('Last char code:', uri.charCodeAt(uri.length - 1));
}

// Re-calculate visible length
const visible = "mongodb+srv://bitumixlive_db_user:Megakem%40123@megakem.w6gayib.mongodb.net/megakem-loyalty?retryWrites=true&w=majority&appName=Megakem";
console.log('Visible length:', visible.length);
console.log('Actual length:', uri.length);

if (uri !== visible) {
    console.log('URI is NOT equal to visible string!');
    for (let i = 0; i < Math.max(uri.length, visible.length); i++) {
        if (uri[i] !== visible[i]) {
            console.log(`Difference at index ${i}: uri[${uri.charCodeAt(i)}] vs visible[${visible.charCodeAt(i)}]`);
            break;
        }
    }
}
