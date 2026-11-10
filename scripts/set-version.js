const fs = require('node:fs');
const packageJson = require('../package.json');
const indexPath = 'views/index.html';
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const versionElement = /(<div class="version">)v[^<]*(<\/div>)/;

if (!versionElement.test(indexHtml)) {
  throw new Error(`Could not find version element in ${indexPath}`);
}

fs.writeFileSync(
  indexPath,
  indexHtml.replace(versionElement, `$1v${packageJson.version}$2`)
);
