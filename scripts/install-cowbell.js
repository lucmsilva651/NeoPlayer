import https from 'https';
import fs from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const VERSION = process.env.COWBELL_VERSION || pkg.cowbellVersion;
const VENDOR_DIR = new URL('../src/lib/cowbell', import.meta.url).pathname;
const TMP_ZIP = new URL('../src/lib/cowbell.zip', import.meta.url).pathname;
const VENDOR_BASE = new URL('../src/lib/', import.meta.url).pathname;

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
  });
}

download(ZIP_URL, TMP_ZIP, () => {
  execSync(`unzip -q ${TMP_ZIP} -d ${VENDOR_BASE}/tmp`);
  fs.renameSync(`${VENDOR_BASE}/tmp/cowbell`, VENDOR_DIR);
  fs.rmSync(`${VENDOR_BASE}/tmp`, { recursive: true });
  fs.unlinkSync(TMP_ZIP);
  console.log(`cowbell v${VERSION} installed in src/lib/cowbell`);
});