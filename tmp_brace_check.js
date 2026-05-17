const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/app/pages/admin/SectionManagement.tsx');
const text = fs.readFileSync(p, 'utf8');
const lines = text.split(/\r?\n/);
let c = 0;
for (let i = 0; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') c++;
    else if (ch === '}') c--;
  }
  if (i % 100 === 0 || c === 0 || c === 1 || c === 2 || c === -1) {
    console.log('line', i + 1, 'count', c, JSON.stringify(lines[i]));
  }
}
console.log('final', c);
