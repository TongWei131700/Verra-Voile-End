const https = require('https');

// First, get the page to find the vendor ID and any CSRF tokens
const pageUrl = 'https://junebugweddings.com/vendors/wedding-photographers/france/south-of-france/Andrea-Martinetti';

https.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract the fetch_gallery function and surrounding context
    const galleryFnMatch = data.match(/async function fetch_gallery\(\)[\s\S]*?\n\s*\}/);
    if (galleryFnMatch) {
      console.log('=== fetch_gallery function ===');
      console.log(galleryFnMatch[0]);
    }
    
    // Look for the AJAX call details
    const ajaxMatch = data.match(/url:\s*['"]\/ajax\/vendor\/portfolio['"][\s\S]*?(?:\}|\))/);
    if (ajaxMatch) {
      console.log('\n=== AJAX call details ===');
      console.log(ajaxMatch[0]);
    }
    
    // Look for vendor/hotlist ID
    const idMatches = data.match(/(hotlist_id|hotlistId|vendor_id|vendorId|accountId|account_id)['":\s]+['"]*(\d+|acct\d+)/gi);
    if (idMatches) {
      console.log('\n=== IDs ===');
      idMatches.forEach(m => console.log(m));
    }
    
    // Look for data attributes on the page that contain IDs
    const dataIdMatch = data.match(/data-(?:hotlist|vendor|account|id)['"]*\s*=\s*['"]([^'"]+)['"]/gi);
    if (dataIdMatch) {
      console.log('\n=== Data ID attributes ===');
      dataIdMatch.forEach(m => console.log(m));
    }
    
    // Look for the slug or identifier used in the AJAX call
    const slugMatch = data.match(/Andrea-Martinetti/g);
    console.log(`\nSlug "Andrea-Martinetti" appears ${slugMatch ? slugMatch.length : 0} times`);
    
    // Try to find the full AJAX call with all parameters
    const fullAjaxMatch = data.match(/\$\.ajax\([\s\S]*?portfolio[\s\S]*?\}/);
    if (fullAjaxMatch) {
      console.log('\n=== Full AJAX call ===');
      console.log(fullAjaxMatch[0].substring(0, 500));
    }
    
    // Also try $.post or fetch patterns
    const postMatch = data.match(/\$\.(?:post|get|ajax)\([\s\S]*?portfolio[\s\S]*?\)/);
    if (postMatch) {
      console.log('\n=== POST/GET call ===');
      console.log(postMatch[0].substring(0, 500));
    }
    
    // Look for the gallery-images section
    const gallerySection = data.match(/gallery-images[\s\S]*?(?:<\/div>){3,5}/);
    if (gallerySection) {
      console.log('\n=== Gallery section HTML ===');
      console.log(gallerySection[0].substring(0, 500));
    }
  });
}).on('error', e => console.error(e));
