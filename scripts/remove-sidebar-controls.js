const fs = require('fs');
const path = require('path');

function cleanHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Remove sidebar controls div
  // <div class="vq-sidebar-controls" ... </div>
  content = content.replace(/<!-- VivoQuest Master Sidebar Controls -->[\s\S]*?<\/div>\s*/g, '');
  content = content.replace(/<div class="vq-sidebar-controls"[\s\S]*?<\/div>\s*/g, '');

  // 2. Remove header back button
  // <button class="vq-header-back-btn" ... </button>
  content = content.replace(/<button class="vq-header-back-btn"[\s\S]*?<\/button>\s*/g, '');

  // 3. Remove sidebar system CSS
  content = content.replace(/<!-- VivoQuest Enterprise Sidebar & Navigation System -->[\s\S]*?<\/style>\s*/g, '');
  content = content.replace(/<style id="vq-sidebar-system-css">[\s\S]*?<\/style>\s*/g, '');

  // 4. Remove sidebar system JS
  content = content.replace(/<!-- VivoQuest Enterprise Collapsible Sidebar Controller -->[\s\S]*?<\/script>\s*/g, '');
  content = content.replace(/<script id="vq-sidebar-system-js">[\s\S]*?<\/script>\s*/g, '');

  // 5. Remove any leftover collapsed class from aside
  content = content.replace(/(<aside[^>]*)\bcollapsed\b([^>]*>)/g, '$1$2');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[CLEANED] ${filePath}`);
    return true;
  } else {
    console.log(`[NO CHANGE] ${filePath}`);
    return false;
  }
}

// Target directories
const targetDirs = [
  path.join(__dirname, '../vivoquest-frontend/public/screens'),
  path.join(__dirname, '../frontend/public/screens')
];

let totalCleaned = 0;

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    files.forEach(f => {
      const p = path.join(dir, f);
      if (cleanHtmlFile(p)) totalCleaned++;
    });
  }
});

// Also clean VivoQuest Web App.html
const masterHtml = path.join(__dirname, '../VivoQuest Web App.html');
if (fs.existsSync(masterHtml)) {
  if (cleanHtmlFile(masterHtml)) totalCleaned++;
}

console.log(`\nFinished! Total files modified: ${totalCleaned}`);
