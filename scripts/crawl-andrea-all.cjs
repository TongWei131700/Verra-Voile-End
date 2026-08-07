const https = require('https');
const querystring = require('querystring');

function fetchPortfolio(offset) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({ accountid: '6932', slug: 'Andrea-Martinetti', offset });
    const req = https.request({
      hostname: 'junebugweddings.com', path: '/ajax/vendor/portfolio', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postData.length, 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    });
    req.on('error', () => resolve({}));
    req.write(postData);
    req.end();
  });
}

(async () => {
  const allImages = [];
  for (let offset = 0; offset < 100; offset += 9) {
    const json = await fetchPortfolio(offset);
    if (!json.images || json.images.length === 0) break;
    json.images.forEach(img => { if (img.uri) allImages.push(img.uri); });
    console.log(`Offset ${offset}: ${json.images.length} images`);
    if (json.images.length < 9) break;
  }
  console.log(`\n=== Total: ${allImages.length} portfolio images from Junebug API ===`);
  allImages.forEach((img, i) => console.log(`${i+1}. ${img}`));
})();
