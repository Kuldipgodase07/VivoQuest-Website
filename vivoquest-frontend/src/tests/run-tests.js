import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Running VivoQuest Parity & Reports Tests ===');

const featuresDir = path.resolve(__dirname, '../features');
const roles = [
  'patient', 'caregiver', 'nurse', 'clinician', 'remote-desk',
  'discharge-planner', 'health-plan', 'vaccination', 'marketplace', 'admin'
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS:', message);
    passed++;
  } else {
    console.error('  FAIL:', message);
    failed++;
  }
}

console.log('\n[Suite 1: Feature Workspaces & Routes]');
for (const role of roles) {
  const exists = fs.existsSync(path.join(featuresDir, role));
  assert(exists, `Role workspace exists: ${role}`);
}

console.log('\n[Suite 2: Styles & Design Tokens]');
const stylesDir = path.resolve(__dirname, '../styles');
const requiredCss = ['tokens.css', 'base.css', 'landing.css', 'shell.css', 'components.css'];
for (const css of requiredCss) {
  assert(fs.existsSync(path.join(stylesDir, css)), `Style exists: ${css}`);
}
for (const role of roles) {
  assert(fs.existsSync(path.join(stylesDir, 'roles', `${role}.css`)), `Role style exists: roles/${role}.css`);
}

console.log('\n[Suite 3: Report Engine & Services]');
const reportsDir = path.resolve(__dirname, '../reports');
assert(fs.existsSync(path.join(reportsDir, 'engine', 'vq-engine.ts')), 'Report engine exists: vq-engine.ts');
assert(fs.existsSync(path.join(reportsDir, 'download.ts')), 'Download utility exists: download.ts');
assert(fs.existsSync(path.join(reportsDir, 'templates', 'registry.ts')), 'Registry exists: registry.ts');

const servicesDir = path.resolve(__dirname, '../services');
assert(fs.existsSync(path.join(servicesDir, 'http.ts')), 'Service exists: http.ts');
assert(fs.existsSync(path.join(servicesDir, 'mock', 'reportsMock.ts')), 'Mock reports exist: reportsMock.ts');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
