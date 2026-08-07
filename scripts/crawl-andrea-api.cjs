const https = require('https');

const url = 'https://junebugweddings.com/vendors/wedding-photographers/france/south-of-france/Andrea-Martinetti';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for script tags with data
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    let scriptCount = 0;
    while ((match = scriptRegex.exec(data)) !== null) {
      const content = match[1];
      // Look for image URLs or data objects in scripts
      if (content.includes('junebugweddings.com') || content.includes('images') || content.includes('hotlist') || content.includes('vendor')) {
        if (content.includes('09/9f') || content.includes('40/36') || content.includes('52/e8') || content.includes('acct6932')) {
          scriptCount++;
          console.log(`=== Script #${scriptCount} (contains image refs) ===`);
          // Extract relevant portions
          const lines = content.split('\n').filter(l => l.includes('images.') || l.includes('static.') || l.includes('hotlist') || l.includes('vendor_images') || l.includes('acct'));
          lines.forEach(l => console.log(l.trim().substring(0, 300)));
          console.log('---');
        }
      }
      // Check for API endpoints
      if (content.includes('/api/') || content.includes('fetch(') || content.includes('axios') || content.includes('hotlistId') || content.includes('accountId')) {
        const apiLines = content.split('\n').filter(l => l.includes('/api/') || l.includes('hotlistId') || l.includes('accountId') || l.includes('vendorId'));
        if (apiLines.length > 0) {
          console.log(`\n=== Script with API calls ===`);
          apiLines.slice(0, 10).forEach(l => console.log(l.trim().substring(0, 300)));
        }
      }
    }
    
    // Also look for data attributes
    const dataAttrRegex = /data-[^=]+="[^"]*junebug[^"]*"/g;
    const dataAttrs = data.match(dataAttrRegex);
    if (dataAttrs) {
      console.log('\n=== Data attributes ===');
      dataAttrs.forEach(a => console.log(a));
    }
    
    // Look for account/hotlist IDs
    const idPatterns = data.match(/(accountId|hotlistId|vendorId|vendor_id|account_id)['":\s]+['"]?(\d+)/g);
    if (idPatterns) {
      console.log('\n=== IDs found ===');
      idPatterns.forEach(p => console.log(p));
    }
  });
}).on('error', e => console.error(e));
