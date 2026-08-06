const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.js', 'utf8');

// The replacement logic
content = content.replace(/http:\/\/localhost:5000\//g, "http://localhost:5000"); // normalize if any trailing slash
content = content.replace(/`http:\/\/localhost:5000\$\{/g, "`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${");
content = content.replace(/'http:\/\/localhost:5000'/g, "(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')");

fs.writeFileSync('frontend/src/App.js', content);
console.log('Done!');
