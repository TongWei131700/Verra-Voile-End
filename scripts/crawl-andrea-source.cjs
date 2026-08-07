const https = require('https');

const url = 'https://junebugweddings.com/vendors/wedding-photographers/france/south-of-france/Andrea-Martinetti';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for __NEXT_DATA__ or similar
    const nextData = data.match(/__NEXT_DATA__[^{]*(\{[\s\S]*?\})\s*<\/script>/);
    if (nextData) {
      console.log('Found __NEXT_DATA__');
      try {
        const parsed = JSON.parse(nextData[1]);
        console.log(JSON.stringify(parsed, null, 2).substring(0, 2000));
      } catch(e) {
        console.log(nextData[1].substring(0, 2000));
      }
      return;
    }
    
    // Check for any JSON script blocks
    const jsonScripts = data.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
    if (jsonScripts) {
      console.log(`Found ${jsonScripts.length} JSON script blocks`);
      jsonScripts.forEach((s, i) => {
        console.log(`\n=== Block ${i+1} ===`);
        console.log(s.substring(0, 500));
      });
    }
    
    // Look for image loading patterns in all scripts
    const allScripts = data.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    for (const script of allScripts) {
      if (script.includes('images') && (script.includes('load') || script.includes('fetch') || script.includes('get'))) {
        // Extract just the relevant parts
        const lines = script.split('\n');
        for (const line of lines) {
          if (line.includes('image') || line.includes('photo') || line.includes('portfolio') || line.includes('gallery')) {
            if (line.includes('load') || line.includes('fetch') || line.includes('get') || line.includes('url') || line.includes('src')) {
              console.log(line.trim().substring(0, 200));
            }
          }
        }
      }
    }
    
    // Check for the hotlist ID in the page
    const hotlistMatch = data.match(/hotlist[-_]?id['":\s=]+['"]?(\d+)/gi);
    if (hotlistMatch) {
      console.log('\n=== Hotlist IDs ===');
      hotlistMatch.forEach(m => console.log(m));
    }
    
    // Search for any URL patterns that could be API
    const apiUrls = data.match(/https?:\/\/[^"'\s]*api[^"'\s]*/g);
    if (apiUrls) {
      console.log('\n=== API URLs ===');
      [...new Set(apiUrls)].forEach(u => console.log(u));
    }
  });
}).on('error', e => console.error(e));
