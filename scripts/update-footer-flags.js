const fs = require('fs');
const path = require('path');

const targetReplacement = `<div style="font-size:15px;line-height:1.6;color:#667085;font-weight:500">{{ t.tagline }}.</div>
          <div class="foot-presence" style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#12B76A;box-shadow:0 0 0 3px rgba(18,183,106,.15)"></span>
              <span style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#4520B8;text-transform:uppercase">{{ t.availIn || 'Available in 2 Countries' }}</span>
            </div>
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
              <!-- India Badge -->
              <div style="display:inline-flex;align-items:center;gap:8px;background:#F9F8FD;border:1px solid #E4DCFA;padding:6px 12px;border-radius:999px;box-shadow:0 1px 3px rgba(69,32,184,.04)">
                <svg width="22" height="15" viewBox="0 0 24 16" fill="none" style="border-radius:2.5px;box-shadow:0 0 0 1px rgba(0,0,0,.08);flex-shrink:0" aria-label="Flag of India">
                  <rect width="24" height="5.33" fill="#FF9933"/>
                  <rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/>
                  <rect y="10.66" width="24" height="5.33" fill="#138808"/>
                  <circle cx="12" cy="8" r="2.2" stroke="#000080" stroke-width="0.5" fill="none"/>
                  <circle cx="12" cy="8" r="0.45" fill="#000080"/>
                  <g stroke="#000080" stroke-width="0.32">
                    <line x1="12" y1="5.8" x2="12" y2="10.2"/>
                    <line x1="9.8" y1="8" x2="14.2" y2="8"/>
                    <line x1="10.45" y1="6.45" x2="13.55" y2="9.55"/>
                    <line x1="10.45" y1="9.55" x2="13.55" y2="6.45"/>
                    <line x1="11.16" y1="5.95" x2="12.84" y2="10.05"/>
                    <line x1="11.16" y1="10.05" x2="12.84" y2="5.95"/>
                    <line x1="9.95" y1="7.16" x2="14.05" y2="8.84"/>
                    <line x1="9.95" y1="8.84" x2="14.05" y2="7.16"/>
                  </g>
                </svg>
                <span style="font-size:12.5px;font-weight:700;color:#2D264D">{{ t.countryIndia || 'India' }}</span>
              </div>
              <!-- United States Badge -->
              <div style="display:inline-flex;align-items:center;gap:8px;background:#F9F8FD;border:1px solid #E4DCFA;padding:6px 12px;border-radius:999px;box-shadow:0 1px 3px rgba(69,32,184,.04)">
                <svg width="22" height="15" viewBox="0 0 24 16" fill="none" style="border-radius:2.5px;box-shadow:0 0 0 1px rgba(0,0,0,.08);flex-shrink:0" aria-label="Flag of United States">
                  <rect width="24" height="16" fill="#B22234"/>
                  <rect y="1.23" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect y="3.69" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect y="6.15" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect y="8.61" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect y="11.07" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect y="13.53" width="24" height="1.23" fill="#FFFFFF"/>
                  <rect width="9.6" height="8.61" fill="#3C3B6E"/>
                  <g fill="#FFFFFF">
                    <circle cx="1.6" cy="1.5" r="0.45"/>
                    <circle cx="3.6" cy="1.5" r="0.45"/>
                    <circle cx="5.6" cy="1.5" r="0.45"/>
                    <circle cx="7.6" cy="1.5" r="0.45"/>
                    <circle cx="2.6" cy="2.9" r="0.45"/>
                    <circle cx="4.6" cy="2.9" r="0.45"/>
                    <circle cx="6.6" cy="2.9" r="0.45"/>
                    <circle cx="1.6" cy="4.3" r="0.45"/>
                    <circle cx="3.6" cy="4.3" r="0.45"/>
                    <circle cx="5.6" cy="4.3" r="0.45"/>
                    <circle cx="7.6" cy="4.3" r="0.45"/>
                    <circle cx="2.6" cy="5.7" r="0.45"/>
                    <circle cx="4.6" cy="5.7" r="0.45"/>
                    <circle cx="6.6" cy="5.7" r="0.45"/>
                    <circle cx="1.6" cy="7.1" r="0.45"/>
                    <circle cx="3.6" cy="7.1" r="0.45"/>
                    <circle cx="5.6" cy="7.1" r="0.45"/>
                    <circle cx="7.6" cy="7.1" r="0.45"/>
                  </g>
                </svg>
                <span style="font-size:12.5px;font-weight:700;color:#2D264D">{{ t.countryUS || 'United States' }}</span>
              </div>
            </div>
          </div>`;

const files = [
  path.join(__dirname, '../vivoquest-frontend/public/screens/landing.html'),
  path.join(__dirname, '../frontend/public/screens/landing.html'),
  path.join(__dirname, '../vivoquest-frontend/source-html/extracted/screens/landing-auth/screen-raw.html'),
  path.join(__dirname, '../frontend/source-html/extracted/screens/landing-auth/screen-raw.html'),
  path.join(__dirname, '../vivoquest-frontend/source-html/extracted/unpacked-pages/landing-auth/template.html')
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');

    // Replace the footer tagline + eyebrow with tagline + flags
    content = content.replace(
      '<div style="font-size:15px;line-height:1.6;color:#667085;font-weight:500">{{ t.tagline }}. {{ t.eyebrow }}.</div>',
      targetReplacement
    );

    // Add translation keys if present
    if (content.includes("footLang:'Language'}")) {
      content = content.replace(
        "footLang:'Language'}",
        "footLang:'Language',availIn:'Available in 2 Countries',countryIndia:'India',countryUS:'United States'}"
      );
    }
    if (content.includes("footLang:'भाषा'}")) {
      content = content.replace(
        "footLang:'भाषा'}",
        "footLang:'भाषा',availIn:'२ देशांमध्ये उपलब्ध',countryIndia:'भारत (India)',countryUS:'अमेरिका (USA)'}"
      );
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});

console.log('All files updated successfully!');
