const fs = require('fs');
const path = require('path');
const { statePath } = require('./config');

const outputPath = path.join(path.dirname(statePath), 'naukri-storage-state.min.json');

function main() {
  if (!fs.existsSync(statePath)) {
    throw new Error(`Saved login state does not exist: ${statePath}`);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const cookies = (state.cookies || []).filter(cookie => /(^|\.)naukri\.com$/i.test(cookie.domain));
  if (!cookies.length) {
    throw new Error('No Naukri cookies were found in the saved login state.');
  }

  fs.writeFileSync(outputPath, JSON.stringify({ cookies, origins: [] }), { mode: 0o600 });
  fs.chmodSync(outputPath, 0o600);
  console.log(`Created minimal state file with ${cookies.length} Naukri cookies: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`State minimization failed: ${error.message}`);
  process.exitCode = 1;
}
