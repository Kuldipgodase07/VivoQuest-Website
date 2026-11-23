const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

function parsePath(d) {
  // Replace command letters with space-letter-space
  const spaced = d.replace(/([a-df-z])/gi, ' $1 ').replace(/,/g, ' ');
  const tokens = spaced.trim().split(/\s+/);
  
  let curX = 0, curY = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let cmd = '';
  let i = 0;
  
  function update(x, y) {
    // In root coords: 1.25 * x, 1.25 * y
    const rx = x * 1.25;
    const ry = y * 1.25;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }
  
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[a-df-z]$/i.test(t)) {
      cmd = t;
      i++;
      continue;
    }
    
    if (cmd === 'm') {
      curX += parseFloat(tokens[i++]);
      curY += parseFloat(tokens[i++]);
      update(curX, curY);
      cmd = 'l';
    } else if (cmd === 'l') {
      curX += parseFloat(tokens[i++]);
      curY += parseFloat(tokens[i++]);
      update(curX, curY);
    } else if (cmd === 'c') {
      const x1 = curX + parseFloat(tokens[i++]);
      const y1 = curY + parseFloat(tokens[i++]);
      const x2 = curX + parseFloat(tokens[i++]);
      const y2 = curY + parseFloat(tokens[i++]);
      curX += parseFloat(tokens[i++]);
      curY += parseFloat(tokens[i++]);
      update(curX, curY);
    } else if (cmd === 'z' || cmd === 'Z') {
      i++;
    } else {
      i++;
    }
  }
  
  return { minX, maxX, minY, maxY };
}

const pathRegex = /<path\b[^>]*\bid="(path\d+)"[^>]*\bd="([^"]+)"/g;
let m;
let totalMinX = Infinity, totalMaxX = -Infinity, totalMinY = Infinity, totalMaxY = -Infinity;

while ((m = pathRegex.exec(svg)) !== null) {
  const id = m[1];
  const d = m[2];
  if (['path2997', 'path3001'].includes(id)) continue;
  const numId = parseInt(id.replace('path', ''));
  if (numId > 3300) continue; // Legend
  
  const b = parsePath(d);
  if (b.minX !== Infinity) {
    if (b.minX < totalMinX) totalMinX = b.minX;
    if (b.maxX > totalMaxX) totalMaxX = b.maxX;
    if (b.minY < totalMinY) totalMinY = b.minY;
    if (b.maxY > totalMaxY) totalMaxY = b.maxY;
  }
}

console.log('Precise Maharashtra landmass bounds:');
console.log(`totalMinX: ${Math.round(totalMinX)}`);
console.log(`totalMaxX: ${Math.round(totalMaxX)}`);
console.log(`totalMinY: ${Math.round(totalMinY)}`);
console.log(`totalMaxY: ${Math.round(totalMaxY)}`);
console.log(`Width: ${Math.round(totalMaxX - totalMinX)}`);
console.log(`Height: ${Math.round(totalMaxY - totalMinY)}`);
