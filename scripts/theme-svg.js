const fs = require('fs');

let svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

// Theme colors mapping matching the VivoQuest platform theme:
// Pune Division (green #95c279) -> #4520B8 (97%)
// Konkan Division (grey #a69d98) -> #5B33D6 (96%)
// Nashik Division (yellow #e7de69) -> #7E62E4 (94%)
// Amravati Division (salmon #e9a0a0) -> #8E5CFF (92%)
// Nagpur Division (tan #e2b584) -> #A78BFA (91%)
// Aurangabad Division (blue #a2a5ee) -> #C4B5FD (89%)
// Ocean (#d9ebf9) -> soft surface #F4F1FD

svg = svg.replace(/fill:#95c279/gi, 'fill:#4520B8');
svg = svg.replace(/fill:#a69d98/gi, 'fill:#5B33D6');
svg = svg.replace(/fill:#e7de69/gi, 'fill:#7E62E4');
svg = svg.replace(/fill:#e9a0a0/gi, 'fill:#8E5CFF');
svg = svg.replace(/fill:#e2b584/gi, 'fill:#A78BFA');
svg = svg.replace(/fill:#a2a5ee/gi, 'fill:#C4B5FD');
svg = svg.replace(/fill:#d9ebf9/gi, 'fill:#F4F1FD');

// Enhance strokes between districts to crisp white with rounded joints
svg = svg.replace(/stroke:#538ecb/gi, 'stroke:#FFFFFF');
svg = svg.replace(/stroke-width:0\.80000001/gi, 'stroke-width:2');

// Only hide elements whose ID ends in -bn (Bengali/localized duplicates in original Wikimedia map)
svg = svg.replace(/id="text[0-9]+-bn"/g, 'id="$&" display="none"');

// Filter out standalone non-English text nodes individually without matching across text boundaries
svg = svg.replace(/<text\b[^>]*>(?:(?!<\/text>)[\s\S])*?[\u0980-\u09FF][\s\S]*?<\/text>/g, '');

// Style English labels
svg = svg.replace(/font-family:[^;"]+/gi, "font-family:'Manrope', 'Poppins', sans-serif");
svg = svg.replace(/font-weight:[^;"]+/gi, "font-weight:800");

// Legend box colors:
svg = svg.replace(/fill:#e9a0a0/gi, 'fill:#8E5CFF');
svg = svg.replace(/fill:#a2a5ee/gi, 'fill:#C4B5FD');
svg = svg.replace(/fill:#a69d98/gi, 'fill:#5B33D6');
svg = svg.replace(/fill:#e2b584/gi, 'fill:#A78BFA');
svg = svg.replace(/fill:#e7de69/gi, 'fill:#7E62E4');
svg = svg.replace(/fill:#95c279/gi, 'fill:#4520B8');

fs.writeFileSync('vivoquest-frontend/public/maharashtra-themed.svg', svg);
fs.writeFileSync('frontend/public/maharashtra-themed.svg', svg);
console.log('Regenerated themed SVG successfully.');
