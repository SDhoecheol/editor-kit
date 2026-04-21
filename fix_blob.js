const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/tools/rollnester/page.tsx',
  'app/tools/pdf-watermark/page.tsx',
  'app/tools/pdf-split/page.tsx',
  'app/tools/pdf-merge/page.tsx',
  'app/tools/pdf-edit/page.tsx',
  'app/tools/pdf-compress-target/page.tsx'
];

targetFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    content = content.replace(/new Blob\(\[pdfBytes\],/g, 'new Blob([pdfBytes as unknown as BlobPart],');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
