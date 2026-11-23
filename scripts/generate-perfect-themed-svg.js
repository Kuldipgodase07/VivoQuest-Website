const fs = require('fs');

let svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

// 1. Add viewBox attribute to root <svg>
if (!svg.includes('viewBox=')) {
  svg = svg.replace('<svg ', '<svg viewBox="0 0 3105.7817 2453.0112" ');
}

// 2. Division color mapping matching VivoQuest platform purple gradient:
// Pune Division (green #95c279) -> #4520B8 (97%)
// Konkan Division (grey #a69d98) -> #5B33D6 (96%)
// Nashik Division (yellow #e7de69) -> #7E62E4 (94%)
// Amravati Division (salmon #e9a0a0) -> #8E5CFF (92%)
// Nagpur Division (tan #e2b584) -> #A78BFA (91%)
// Aurangabad Division (blue #a2a5ee) -> #C4B5FD (89%)
// Ocean (#d9ebf9) -> soft surface #F7F5FF (matches card background)

svg = svg.replace(/fill:#95c279/gi, 'fill:#4520B8');
svg = svg.replace(/fill:#a69d98/gi, 'fill:#5B33D6');
svg = svg.replace(/fill:#e7de69/gi, 'fill:#7E62E4');
svg = svg.replace(/fill:#e9a0a0/gi, 'fill:#8E5CFF');
svg = svg.replace(/fill:#e2b584/gi, 'fill:#A78BFA');
svg = svg.replace(/fill:#a2a5ee/gi, 'fill:#C4B5FD');
svg = svg.replace(/fill:#d9ebf9/gi, 'fill:#F7F5FF');

// 3. Crisp white district boundary lines
svg = svg.replace(/stroke:#538ecb/gi, 'stroke:#FFFFFF');
svg = svg.replace(/stroke-width:0\.80000001/gi, 'stroke-width:2');

// 4. Hide non-English duplicate labels (ending in -bn or containing Indic characters)
svg = svg.replace(/id="text[0-9]+-bn"/g, 'id="$&" display="none"');
svg = svg.replace(/<text\b[^>]*>(?:(?!<\/text>)[\s\S])*?[\u0980-\u09FF][\s\S]*?<\/text>/g, '');

// 5. Enhance text labels with platform font and white halo for maximum legibility
// Replace text fill and add paint-order halo
svg = svg.replace(/font-family:[^;"]+/gi, "font-family:'Manrope', 'Poppins', sans-serif");
svg = svg.replace(/font-weight:[^;"]+/gi, "font-weight:800");

// In style strings, inject stroke halo and dark purple fill
svg = svg.replace(/(style="[^"]*fill:)(#[a-f0-9]{6}|none|#[a-f0-9]{3}|black|#000000)([^"]*")/gi, (m, p1, p2, p3) => {
  // If it's inside text, give it halo
  if (p3.includes('font-family') || p1.includes('font-family')) {
    return `style="font-family:'Manrope', 'Poppins', sans-serif;font-weight:800;fill:#17143A;paint-order:stroke fill;stroke:#FFFFFF;stroke-width:5px;stroke-linejoin:round;stroke-linecap:round;"`;
  }
  return m;
});

// Also replace tspan styles that override fill or font
svg = svg.replace(/<tspan([^>]*?)style="([^"]*)"/gi, (m, attrs, style) => {
  return `<tspan${attrs}style="font-family:'Manrope', 'Poppins', sans-serif;font-weight:800;fill:#17143A;font-size:52px;line-height:1.2;"`;
});

// Write to both frontend repositories
fs.writeFileSync('vivoquest-frontend/public/maharashtra-themed.svg', svg);
fs.writeFileSync('frontend/public/maharashtra-themed.svg', svg);
console.log('Successfully generated themed SVG with viewBox and text halos.');
