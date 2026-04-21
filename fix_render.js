const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/tools/pdf-to-img/page.tsx',
  'app/tools/pdf-edit/page.tsx'
];

targetFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    content = content.replace(/page\.render\(\{ canvasContext: ctx, viewport \}\)/g, 'page.render({ canvasContext: ctx, viewport } as any)');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
