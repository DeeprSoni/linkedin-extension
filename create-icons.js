const fs = require('fs');
const path = require('path');

// Create simple base64 encoded PNG icons
// These are 1x1 pixel PNGs that will be replaced with proper icons later

const sizes = [16, 48, 128];

// Minimal valid PNG (transparent 1x1 pixel) in base64
const minimalPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

sizes.forEach(size => {
  const filePath = path.join(__dirname, 'icons', `icon${size}.png`);
  const buffer = Buffer.from(minimalPNG, 'base64');
  fs.writeFileSync(filePath, buffer);
  console.log(`Created ${filePath}`);
});

console.log('\nNote: These are placeholder icons. Replace them with proper icons before publishing.');
