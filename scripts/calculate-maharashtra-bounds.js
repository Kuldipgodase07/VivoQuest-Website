const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Simple SVG path command parser to trace (x, y) coordinates
function getPathBounds(d, scaleX = 1.25, scaleY = 1.25, tx = 0, ty = 0) {
  // Regex to extract commands and coordinate tokens
  const commands = d.match(/([a-df-z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi);
  if (!commands) return null;
  
  let curX = 0, curY = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let cmd = '';
  let i = 0;
  
  function updateBounds(x, y) {
    const rx = x * scaleX + tx;
    const ry = y * scaleY + ty;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }
  
  while (i < commands.length) {
    const token = commands[i];
    if (/^[a-df-z]$/i.test(token)) {
      cmd = token;
      i++;
    }
    
    if (cmd === 'M') {
      curX = parseFloat(commands[i++]);
      curY = parseFloat(commands[i++]);
      updateBounds(curX, curY);
      cmd = 'L'; // subsequent coordinates are L
    } else if (cmd === 'm') {
      curX += parseFloat(commands[i++]);
      curY += parseFloat(commands[i++]);
      updateBounds(curX, curY);
      cmd = 'l';
    } else if (cmd === 'L') {
      curX = parseFloat(commands[i++]);
      curY = parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'l') {
      curX += parseFloat(commands[i++]);
      curY += parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'H') {
      curX = parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'h') {
      curX += parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'V') {
      curY = parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'v') {
      curY += parseFloat(commands[i++]);
      updateBounds(curX, curY);
    } else if (cmd === 'C') {
      const x1 = parseFloat(commands[i++]);
      const y1 = parseFloat(commands[i++]);
      const x2 = parseFloat(commands[i++]);
      const y2 = parseFloat(commands[i++]);
      curX = parseFloat(commands[i++]);
      curY = parseFloat(commands[i++]);
      updateBounds(x1, y1);
      updateBounds(x2, y2);
      updateBounds(curX, curY);
    } else if (cmd === 'c') {
      const x1 = curX + parseFloat(commands[i++]);
      const y1 = curY + parseFloat(commands[i++]);
      const x2 = curX + parseFloat(commands[i++]);
      const y2 = curY + parseFloat(commands[i++]);
      curX += parseFloat(commands[i++]);
      curY += parseFloat(commands[i++]);
      updateBounds(x1, y1);
      updateBounds(x2, y2);
      updateBounds(curX, curY);
    } else if (cmd === 'S' || cmd === 's') {
      i += 4;
    } else if (cmd === 'Q' || cmd === 'q') {
      i += 4;
    } else if (cmd === 'T' || cmd === 't') {
      i += 2;
    } else if (cmd === 'A' || cmd === 'a') {
      i += 7;
    } else if (cmd === 'Z' || cmd === 'z') {
      // close
    } else {
      i++;
    }
  }
  
  return { minX, maxX, minY, maxY };
}

// Find all 36 district paths
const pathMatches = svg.match(/<path\b[^>]*\bid="path\d+"[^>]*\bd="([^"]+)"/g) || [];
console.log('Found paths:', pathMatches.length);

let totalMinX = Infinity, totalMaxX = -Infinity, totalMinY = Infinity, totalMaxY = -Infinity;

pathMatches.forEach((p, idx) => {
  const id = p.match(/id="([^"]+)"/)?.[1];
  const d = p.match(/d="([^"]+)"/)?.[1];
  
  // Skip ocean and legend paths
  if (['path2997', 'path3001'].includes(id)) return;
  const numId = parseInt(id.replace('path', ''));
  if (numId > 3300) return; // Legend paths
  
  const b = getPathBounds(d);
  if (b) {
    if (b.minX < totalMinX) totalMinX = b.minX;
    if (b.maxX > totalMaxX) totalMaxX = b.maxX;
    if (b.minY < totalMinY) totalMinY = b.minY;
    if (b.maxY > totalMaxY) totalMaxY = b.maxY;
  }
});

console.log('Maharashtra landmass bounds:');
console.log(`minX: ${totalMinX}, maxX: ${totalMaxX}, width: ${totalMaxX - totalMinX}`);
console.log(`minY: ${totalMinY}, maxY: ${totalMaxY}, height: ${totalMaxY - totalMinY}`);
