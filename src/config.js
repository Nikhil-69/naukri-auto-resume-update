require('dotenv').config();

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const statePath = path.resolve(
  rootDir,
  process.env.NAUKRI_STATE_PATH || 'state/naukri-storage-state.json',
);
const resumePath = path.resolve(rootDir, process.env.RESUME_PATH || 'resumes/resume.pdf');
const headless = process.env.HEADLESS !== 'false';
const browserChannel = process.env.BROWSER_CHANNEL || 'chrome';

function requireResume() {
  if (!fs.existsSync(resumePath)) {
    throw new Error(`Resume file does not exist: ${resumePath}`);
  }
}

function requireState() {
  if (!fs.existsSync(statePath)) {
    throw new Error(`Saved login state does not exist: ${statePath}. Run npm run login on a machine with a browser first.`);
  }
}

module.exports = { rootDir, statePath, resumePath, headless, browserChannel, requireResume, requireState };
