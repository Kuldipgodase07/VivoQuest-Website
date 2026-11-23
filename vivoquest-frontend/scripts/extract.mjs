import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML_DIR = path.join(PROJECT_ROOT, 'source-html');
const EXTRACTED_DIR = path.join(SOURCE_HTML_DIR, 'extracted');

let inputHtmlPath = path.join(PROJECT_ROOT, 'source-html', 'VivoQuest_Web_App.html');
if (!fs.existsSync(inputHtmlPath)) {
  const rootInput = path.resolve(PROJECT_ROOT, '..', 'VivoQuest Web App.html');
  if (fs.existsSync(rootInput)) inputHtmlPath = rootInput;
}

console.log('== VivoQuest Bundle Extractor ==');
console.log('Source:', inputHtmlPath);

const rawHtml = fs.readFileSync(inputHtmlPath, 'utf8');
const rootManifest = JSON.parse(rawHtml.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
console.log('Unpacked manifest entries:', Object.keys(rootManifest).length);
console.log('Extraction complete!');
