import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const VERSION = process.env.COWBELL_VERSION || pkg.cowbellVersion;
const VENDOR_DIR = fileURLToPath(new URL('../src/lib/cowbell', import.meta.url));
const TMP_ZIP    = fileURLToPath(new URL('../src/lib/cowbell.zip', import.meta.url));
const VENDOR_BASE = fileURLToPath(new URL('../src/lib/', import.meta.url));

if (fs.existsSync(VENDOR_DIR)) {
  console.log(`cowbell v${VERSION} already installed.`);
  process.exit(0);
}

const ZIP_URL = `https://github.com/demozoo/cowbell/releases/download/v${VERSION}/cowbell-${VERSION}.zip`;
console.log(`downloading cowbell v${VERSION}...`);
fs.mkdirSync(VENDOR_BASE, { recursive: true });

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      file.close();
      download(res.headers.location, dest, cb);
      return;
    }
    res.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Download failed:', err.message);
    process.exit(1);
  });
}

function extractZip(zipPath, destDir) {
  const isWindows = process.platform === 'win32';
  const zipNorm = path.resolve(zipPath);
  const destNorm = path.resolve(destDir);
  if (isWindows) {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipNorm}' -DestinationPath '${destNorm}' -Force"`,
    );
  } else {
    execSync(`unzip -q "${zipNorm}" -d "${destNorm}"`);
  }
}

download(ZIP_URL, TMP_ZIP, () => {
  const tmpDir = path.join(VENDOR_BASE, 'tmp');
  extractZip(TMP_ZIP, tmpDir);
  fs.renameSync(path.join(tmpDir, 'cowbell'), VENDOR_DIR);
  fs.rmSync(tmpDir, { recursive: true });
  fs.unlinkSync(TMP_ZIP);
  console.log(`cowbell v${VERSION} installed in src/lib/cowbell`);
});
