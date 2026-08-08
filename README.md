# Naukri Auto Resume Update

Cron-friendly Naukri resume updates using a saved Playwright login state. It uploads the current file on each run; it does not replay a saved upload body.

## Security

- Put the resume in `resumes/`, the browser login state in `state/`, and configuration in `.env`.
- All three are git-ignored. Never commit or share `state/naukri-storage-state.json`; it contains authenticated session material.
- The AWS server must have the session-state file and the same Naukri account login. Re-run `npm run login` when Naukri expires the session or asks for OTP/captcha.

## Setup

```bash
git init
npm install
cp .env.example .env
mkdir -p resumes state
# Place your PDF at resumes/resume.pdf, or change RESUME_PATH in .env.
```

Create the login state on a machine where you can complete Naukri login:

```bash
npm run login
```

Securely copy `state/naukri-storage-state.json` to the same path on AWS. Install Google Chrome and Xvfb on AWS, then test the server run:

```bash
sudo apt-get update && sudo apt-get install -y google-chrome-stable xvfb
npm run update:server
```

To make the saved browser state much smaller before moving it to AWS, create a cookie-only Naukri state file and test it locally first:

```bash
npm run minimize-state
NAUKRI_STATE_PATH=state/naukri-storage-state.min.json npm run update:server
```

If that test succeeds, move `state/naukri-storage-state.min.json` to AWS and set `NAUKRI_STATE_PATH=state/naukri-storage-state.min.json` in `.env`. The minimized file remains an authenticated secret and must never be committed.

Naukri currently blocks its profile page in headless Chromium, so `.env` intentionally uses regular Google Chrome in headed mode. `xvfb-run` provides the virtual display required by cron. Inspect the screenshot path printed by any failure.

## Cron

Use absolute paths and log output so failures are visible:

```cron
0 7 * * 1 cd /opt/naukri-auto-resume-update && /usr/bin/npm run update:server >> /var/log/naukri-resume-update.log 2>&1
```

The command exits non-zero when the resume is missing, the login state expired, the file input changed, or Naukri does not confirm the upload. Cron therefore does not report a false success.
