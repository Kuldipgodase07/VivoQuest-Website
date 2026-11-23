const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function cleanLandingFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove any static header back button
  content = content.replace(/<button class="vq-header-back-btn"[\s\S]*?<\/button>\s*/g, '');
  // Remove sidebar system css
  content = content.replace(/<!-- VivoQuest [^>]*-->\s*<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');
  content = content.replace(/<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');
  // Remove sidebar system js
  content = content.replace(/<!-- VivoQuest [^>]*-->\s*<script id="vq-sidebar-system-js">[\s\S]*?<\/script>/g, '');
  content = content.replace(/<script id="vq-sidebar-system-js">[\s\S]*?<\/script>/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cleaned landing page at:', filePath);
}

// 1. Clean public landing files
cleanLandingFile('vivoquest-frontend/public/screens/landing.html');
cleanLandingFile('frontend/public/screens/landing.html');

// 2. Clean landing page inside VivoQuest Web App.html
const bundlePath = 'VivoQuest Web App.html';
if (fs.existsSync(bundlePath)) {
  let fileContent = fs.readFileSync(bundlePath, 'utf8');
  const manifestMatch = fileContent.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (manifestMatch) {
    const manifest = JSON.parse(manifestMatch[1]);
    let cleaned = 0;
    Object.keys(manifest).forEach(uuid => {
      const item = manifest[uuid];
      if (item.mime === 'text/html' && item.compressed && item.data) {
        try {
          const rawBuffer = Buffer.from(item.data, 'base64');
          let text = zlib.gunzipSync(rawBuffer).toString('utf8');
          // If this is the landing page
          if (text.includes('landing') || text.includes('Care, closer to home') || text.includes('exploreRoles') || text.includes('navRoles')) {
            text = text.replace(/<button class="vq-header-back-btn"[\s\S]*?<\/button>\s*/g, '');
            text = text.replace(/<!-- VivoQuest [^>]*-->\s*<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');
            text = text.replace(/<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');
            text = text.replace(/<!-- VivoQuest [^>]*-->\s*<script id="vq-sidebar-system-js">[\s\S]*?<\/script>/g, '');
            text = text.replace(/<script id="vq-sidebar-system-js">[\s\S]*?<\/script>/g, '');
            item.data = zlib.gzipSync(Buffer.from(text, 'utf8')).toString('base64');
            cleaned++;
          }
        } catch (err) {}
      }
    });

    const newManifestJson = JSON.stringify(manifest);
    fileContent = fileContent.replace(
      /<script type="__bundler\/manifest">[\s\S]*?<\/script>/,
      `<script type="__bundler/manifest">${newManifestJson}</script>`
    );
    fs.writeFileSync(bundlePath, fileContent, 'utf8');
    console.log(`Cleaned ${cleaned} landing page(s) in ${bundlePath}`);
  }
}
