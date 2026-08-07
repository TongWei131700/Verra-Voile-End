const https = require('https');
const querystring = require('querystring');

const postData = querystring.stringify({
  accountid: '6932',
  slug: 'Andrea-Martinetti',
  offset: 0
});

const options = {
  hostname: 'junebugweddings.com',
  path: '/ajax/vendor/portfolio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://junebugweddings.com/vendors/wedding-photographers/france/south-of-france/Andrea-Martinetti'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      // Extract image URIs
      const images = [];
      if (json.images) {
        json.images.forEach(img => {
          if (img.uri) images.push(img.uri);
          else if (img.src) images.push(img.src);
          else if (typeof img === 'string') images.push(img);
        });
      }
      if (images.length > 0) {
        console.log(`\n=== ${images.length} portfolio images ===`);
        images.forEach((img, i) => console.log(`${i+1}. ${img}`));
      } else {
        console.log('\nRaw response (first 3000 chars):');
        console.log(JSON.stringify(json, null, 2).substring(0, 3000));
      }
    } catch(e) {
      console.log('Not JSON, raw response:');
      console.log(data.substring(0, 3000));
    }
  });
});
req.on('error', e => console.error(e));
req.write(postData);
req.end();
