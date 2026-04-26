const fs = require('fs');
const path = require('path');
try {
  const domPath = require.resolve('react-dom');
  console.log('react-dom resolved:', domPath);
  const content = fs.readFileSync(domPath, 'utf8');
  const regex = /310:\s*"([^\"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log('310 =>', match[1]);
  }
} catch (e) {
  console.error('ERROR:', e.message);
}
