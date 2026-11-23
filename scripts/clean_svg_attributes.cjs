const fs = require('fs');
const path = require('path');

function cleanSvgInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Fix fl helper to include default sub: ''
  html = html.replace("const fl=(o)=>({...o,['f_'+o.t]:true});", "const fl=(o)=>({sub:'',...o,['f_'+o.t]:true});");

  // Fix SVG attributes with template interpolations {{ ... }}
  // We use regex to replace attribute="{{ ... }}" on SVG tags with sc-camel-attribute="{{ ... }}"
  const svgAttrs = ['d', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'rx', 'ry'];
  
  for (const attr of svgAttrs) {
    // Match attr="{{ ... }}" inside tags
    const re = new RegExp(`\\b${attr}="(\\{\\{[^}]+\\}\\})"`, 'g');
    html = html.replace(re, `sc-camel-${attr}="$1"`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Cleaned file:', filePath);
}

const targetFiles = [
  'frontend/public/screens/admin.html',
  'vivoquest-frontend/public/screens/admin.html',
  'frontend/public/screens/AdministratorConsole.dc.html',
  'vivoquest-frontend/public/screens/AdministratorConsole.dc.html',
  'frontend/public/AdministratorConsole.dc.html',
  'vivoquest-frontend/public/AdministratorConsole.dc.html'
];

targetFiles.forEach(cleanSvgInFile);
