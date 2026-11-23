const fs = require('fs');

let svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

// 1. Division color mapping matching VivoQuest platform purple gradient:
svg = svg.replace(/fill:#95c279/gi, 'fill:#4520B8'); // Pune Division (97%)
svg = svg.replace(/fill:#a69d98/gi, 'fill:#5B33D6'); // Konkan Division (96%)
svg = svg.replace(/fill:#e7de69/gi, 'fill:#7E62E4'); // Nashik Division (94%)
svg = svg.replace(/fill:#e9a0a0/gi, 'fill:#8E5CFF'); // Amravati Division (92%)
svg = svg.replace(/fill:#e2b584/gi, 'fill:#A78BFA'); // Nagpur Division (91%)
svg = svg.replace(/fill:#a2a5ee/gi, 'fill:#C4B5FD'); // Aurangabad Division (89%)

// 2. Remove ocean background completely (path2997)
svg = svg.replace(/<path[^>]+id="path2997"[^>]*\/>/gi, '');
svg = svg.replace(/<path[^>]+id="path2997"[^>]*>[\s\S]*?<\/path>/gi, '');
svg = svg.replace(/fill:#d9ebf9/gi, 'fill:none');

// 3. Remove the legend box from the SVG so Maharashtra can expand and not have redundant clutter
svg = svg.replace(/<text[^>]*>(?:(?!<\/text>)[\s\S])*?Division(?:(?!<\/text>)[\s\S])*?<\/text>/gi, '');
svg = svg.replace(/<path[^>]+id="path341[3-9]"[^>]*\/>/gi, '');
svg = svg.replace(/<path[^>]+id="path342[0-9]"[^>]*\/>/gi, '');

// 4. White district boundary lines
svg = svg.replace(/stroke:#538ecb/gi, 'stroke:#FFFFFF');
svg = svg.replace(/stroke-width:0\.80000001/gi, 'stroke-width:3');

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

// 7. Crop viewBox to Maharashtra: viewBox="10 80 3070 2180"
const croppedViewBox = 'viewBox="10 80 3070 2180"';
if (svg.includes('viewBox=')) {
  svg = svg.replace(/viewBox="[^"]+"/, croppedViewBox);
} else {
  svg = svg.replace('<svg ', `<svg ${croppedViewBox} `);
}

// Write to both frontend repositories
fs.writeFileSync('vivoquest-frontend/public/maharashtra-themed.svg', svg);
fs.writeFileSync('frontend/public/maharashtra-themed.svg', svg);
console.log('Successfully generated themed SVG with cropped viewBox="10 80 3070 2180".');
