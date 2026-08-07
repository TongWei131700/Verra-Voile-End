const https = require('https');

// Fetch the page HTML and extract all junebugweddings.com image URLs
const url = 'https://junebugweddings.com/vendors/wedding-photographers/france/south-of-france/Andrea-Martinetti';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find all image URLs from junebugweddings.com
    const imgRegex = /https:\/\/images\.junebugweddings\.com\/[a-f0-9]+\/[a-f0-9]+\/[a-f0-9]+\.[a-z]+/g;
    const matches = [...new Set(data.match(imgRegex) || [])];
    
    // Also look for images in data attributes, JSON-LD, or inline scripts
    const dataImgRegex = /"((?:https?:)?\/\/images\.junebugweddings\.com\/[^"]+)"/g;
    const dataMatches = [...new Set((data.match(dataImgRegex) || []).map(m => m.replace(/"/g, '').replace(/^\/\//, 'https://')))];
    
    // Also look for static headshot images
    const headshotRegex = /https:\/\/static\.junebugweddings\.com\/[^"'\s]+/g;
    const headshots = [...new Set(data.match(headshotRegex) || [])];
    
    // Combine all
    const allImages = [...new Set([...matches, ...dataMatches, ...headshots])];
    
    console.log('=== Junebug images found ===');
    allImages.forEach((img, i) => console.log(`${i+1}. ${img}`));
    console.log(`\nTotal: ${allImages.length} images`);
    
    // Also check for any JSON data embedded in the page
    const jsonMatch = data.match(/window\.__[A-Z_]+\s*=\s*(\{[\s\S]*?\});/);
    if (jsonMatch) {
      console.log('\n=== Found embedded JSON data ===');
      console.log(jsonMatch[0].substring(0, 500));
    }
    
    // Check for portfolio/gallery sections
    const galleryPatterns = data.match(/(portfolio|gallery|carousel|slider|hotlist-images|vendor_images)[^<]{0,500}/gi);
    if (galleryPatterns) {
      console.log('\n=== Gallery-related patterns ===');
      galleryPatterns.slice(0, 5).forEach(p => console.log(p.substring(0, 200)));
    }
  });
}).on('error', e => console.error(e));
