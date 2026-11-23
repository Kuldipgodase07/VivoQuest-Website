const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Find all district paths and their exact bounding box
// In Inkscape SVG, layer1 has translate(1177.7235, 694.14004)
// Let's inspect all <path> elements that are districts (not the ocean path path2997)
const pathRegex = /<path\b([^>]*)\bd="([^"]+)"/g;
let m;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

while ((m = pathRegex.exec(svg)) !== null) {
  const attrs = m[1];
  const d = m[2];
  if (attrs.includes('id="path2997"')) continue; // Skip ocean path
  if (attrs.includes('stroke-dasharray')) continue; // Skip non-district paths if any
  
  // parse coordinates
  // Note: path commands like m, l, c, z
  // Let's get all numbers
  const nums = d.match(/-?[\d.]+/g);
  if (!nums) continue;
  
  // Let's check transform of parent or path
  // Most paths in layer1 are in local coords.
  // Let's check how coordinates in paths behave:
  // Is 'm' relative or absolute?
  // Let's check first few numbers of district paths
}

console.log('Done preliminary check');
