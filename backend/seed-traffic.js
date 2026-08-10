const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const PageView = require('./models/PageView');
const connectDB = require('./config/database');

const run = async () => {
  await connectDB();
  console.log('Seeding fake website traffic data...');
  
  const pages = [
    '/catalog', '/catalog', '/catalog', '/catalog',
    '/products/123', '/products/456',
    '/dashboard', '/dashboard',
    '/profile',
    '/login',
    '/about'
  ];
  
  const devices = [
    { os: 'Windows', browser: 'Chrome', isMobile: false },
    { os: 'Windows', browser: 'Chrome', isMobile: false },
    { os: 'Windows', browser: 'Edge', isMobile: false },
    { os: 'Android', browser: 'Chrome', isMobile: true },
    { os: 'Android', browser: 'Chrome', isMobile: true },
    { os: 'iOS', browser: 'Safari', isMobile: true },
    { os: 'macOS', browser: 'Safari', isMobile: false }
  ];
  
  const newViews = [];
  const now = new Date();
  
  // Create 500 random page views over the last 30 days
  for (let i = 0; i < 500; i++) {
    const page = pages[Math.floor(Math.random() * pages.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    
    // Random date in last 30 days
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const randomTime = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    // Randomize hour slightly
    randomTime.setHours(Math.floor(Math.random() * 24));
    
    // Create random visitor ID
    const visitorId = 'visitor_' + Math.floor(Math.random() * 50); // 50 unique visitors
    
    newViews.push({
      path: page,
      url: `https://megakem.lk${page}`,
      visitorId,
      device: device.os,
      browser: device.browser,
      isMobile: device.isMobile,
      timestamp: randomTime
    });
  }
  
  await PageView.insertMany(newViews);
  console.log(`Successfully seeded ${newViews.length} page views!`);
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
