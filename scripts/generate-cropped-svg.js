const fs = require('fs');

let svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

// 1. Division color mapping matching VivoQuest platform purple gradient:
// Pune Division (green #95c279) -> #4520B8 (97%)
// Konkan Division (grey #a69d98) -> #5B33D6 (96%)
// Nashik Division (yellow #e7de69) -> #7E62E4 (94%)
// Amravati Division (salmon #e9a0a0) -> #8E5CFF (92%)
// Nagpur Division (tan #e2b584) -> #A78BFA (91%)
// Aurangabad Division (blue #a2a5ee) -> #C4B5FD (89%)

svg = svg.replace(/fill:#95c279/gi, 'fill:#4520B8');
svg = svg.replace(/fill:#a69d98/gi, 'fill:#5B33D6');
svg = svg.replace(/fill:#e7de69/gi, 'fill:#7E62E4');
svg = svg.replace(/fill:#e9a0a0/gi, 'fill:#8E5CFF');
svg = svg.replace(/fill:#e2b584/gi, 'fill:#A78BFA');
svg = svg.replace(/fill:#a2a5ee/gi, 'fill:#C4B5FD');

// 2. Remove ocean background completely (path2997)
svg = svg.replace(/<path[^>]+id="path2997"[^>]*\/>/gi, '');
svg = svg.replace(/<path[^>]+id="path2997"[^>]*>[\s\S]*?<\/path>/gi, '');

// Also remove any remaining ocean fill
svg = svg.replace(/fill:#d9ebf9/gi, 'fill:none');

// 3. Remove the legend box from the SVG so Maharashtra can expand and not have redundant clutter
// The legend text items:
svg = svg.replace(/<text[^>]*>(?:(?!<\/text>)[\s\S])*?Division(?:(?!<\/text>)[\s\S])*?<\/text>/gi, '');
// The legend swatch rectangles/paths:
svg = svg.replace(/<path[^>]+id="path341[3-9]"[^>]*\/>/gi, '');
svg = svg.replace(/<path[^>]+id="path342[0-9]"[^>]*\/>/gi, '');

// 4. White district boundary lines
svg = svg.replace(/stroke:#538ecb/gi, 'stroke:#FFFFFF');
svg = svg.replace(/stroke-width:0\.80000001/gi, 'stroke-width:3.5');

// 5. Hide localized non-English duplicate labels (-bn) and non-English unicode text
svg = svg.replace(/id="text[0-9]+-bn"/g, 'id="$&" display="none"');
svg = svg.replace(/<text\b[^>]*>(?:(?!<\/text>)[\s\S])*?[\u0980-\u09FF][\s\S]*?<\/text>/g, '');

// 6. Style English district labels with crisp white halo and dark purple font
svg = svg.replace(/font-family:[^;"]+/gi, "font-family:'Manrope', 'Poppins', sans-serif");
svg = svg.replace(/font-weight:[^;"]+/gi, "font-weight:800");

// Give text clean stroke halo so it is 100% legible
svg = svg.replace(/(style="[^"]*fill:)(#[a-f0-9]{6}|none|#[a-f0-9]{3}|black|#000000)([^"]*")/gi, (m, p1, p2, p3) => {
  if (p3.includes('font-family') || p1.includes('font-family')) {
    return `style="font-family:'Manrope', 'Poppins', sans-serif;font-weight:800;fill:#17143A;paint-order:stroke fill;stroke:#FFFFFF;stroke-width:6px;stroke-linejoin:round;stroke-linecap:round;"`;
  }
  return m;
});

svg = svg.replace(/<tspan([^>]*?)style="([^"]*)"/gi, (m, attrs, style) => {
  return `<tspan${attrs}style="font-family:'Manrope', 'Poppins', sans-serif;font-weight:800;fill:#17143A;font-size:52px;line-height:1.2;"`;
});

// 7. Crop viewBox tightly to Maharashtra landmass
// Bounds: minX=200, minY=120, width=2850, height=2160
// Set viewBox on root <svg>
const croppedViewBox = 'viewBox="200 120 2850 2160"';
if (svg.includes('viewBox=')) {
  svg = svg.replace(/viewBox="[^"]+"/, croppedViewBox);
} else {
  svg = svg.replace('<svg ', `<svg ${croppedViewBox} `);
}

// Write to both frontend repositories
fs.writeFileSync('vivoquest-frontend/public/maharashtra-themed.svg', svg);
fs.writeFileSync('frontend/public/maharashtra-themed.svg', svg);
console.log('Successfully generated cropped, transparent-background themed SVG without internal legend.');
