const fs = require('node:fs');
const path = require('node:path');

// A release version stays fixed in the page; it is never generated on page load.
function stampVersion(date = new Date(), htmlPath = path.join(__dirname, '..', 'dist', 'index.html')) {
  if (!Number.isFinite(date.getTime())) throw new Error('A valid release timestamp is required.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(part => [part.type, part.value]));
  const version = 'v' + parts.year + parts.month + parts.day + '-' + parts.hour + parts.minute;
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('name="app-version"') || !html.includes('id="app-version"')) throw new Error('Version metadata and footer are required.');
  html = html.replace(/(<meta name="app-version" content=")[^"]+(">)/, '$1' + version + '$2');
  html = html.replace(/(<span id="app-version"[^>]*>)[^<]+(<\/span>)/, '$1' + version + '$2');
  html = html.replace(/((?:href|src)=")([^"?]+\.(?:css|js))(?:\?[^"\n]*)?(")/g, '$1$2?v=' + version + '$3');
  fs.writeFileSync(htmlPath, html);
  return version;
}
if (require.main === module) console.log(stampVersion(process.argv[2] ? new Date(process.argv[2]) : new Date()));
module.exports = { stampVersion };
