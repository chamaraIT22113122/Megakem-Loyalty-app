const http = require('http');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const token = jwt.sign({ id: 'dummy', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const getOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/cash-rewards/ytd-analytics?year=2026',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
};
const req = http.request(getOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('YTD Analytics:', JSON.stringify(JSON.parse(data), null, 2)));
});
req.end();
