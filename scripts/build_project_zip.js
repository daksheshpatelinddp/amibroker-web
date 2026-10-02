import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const zip = new JSZip();

// Ignore patterns
const ignoreList = ['node_modules', '.git', 'dist', 'dist-ssr', '.DS_Store', 'bun.lock'];

function addFilesRecursively(dir, relPath = '') {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (ignoreList.includes(item)) continue;
    if (relPath === '' && item === 'public') continue;

    const fullPath = path.join(dir, item);
    const itemRelPath = relPath ? `${relPath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      addFilesRecursively(fullPath, itemRelPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(itemRelPath, content);
      console.log(`Added: ${itemRelPath}`);
    }
  }
}

async function run() {
  console.log('Generating amibroker-web-project.zip in /public ...');
  addFilesRecursively(rootDir);

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const zipPath = path.join(publicDir, 'amibroker-web-project.zip');
  fs.writeFileSync(zipPath, zipBuffer);
  console.log(`Successfully created ZIP: ${zipPath} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
