const https = require('https');

// Try Junebug API patterns
const endpoints = [
  'https://junebugweddings.com/api/hotlists/Andrea-Martinetti',
  'https://junebugweddings.com/api/vendors/Andrea-Martinetti',
  'https://junebugweddings.com/api/hotlist/Andrea-Martinetti/images',
  'https://junebugweddings.com/api/v1/vendors/Andrea-Martinetti',
  'https://junebugweddings.com/api/vendor-profile/Andrea-Martinetti',
];

let completed = 0;
endpoints.forEach(url => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      completed++;
      const status = res.statusCode;
      const preview = data.substring(0, 300);
      console.log(`[${status}] ${url}`);
      if (status === 200 && data.length > 10) {
        console.log(`  Response: ${preview}`);
      }
      if (completed === endpoints.length) process.exit(0);
    });
  }).on('error', e => {
    completed++;
    console.log(`[ERR] ${url}: ${e.message}`);
    if (completed === endpoints.length) process.exit(0);
  });
});
