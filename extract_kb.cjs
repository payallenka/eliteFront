const fs = require('fs');
const path = require('path');

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  __dirname,
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
);

const kbDir = path.join(process.cwd(), 'training data');
const outputFile = path.join(process.cwd(), 'kb_chunks.json');

async function extractChunksFromPDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
 
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) }).promise;
  
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  // Split into paragraph chunks
  const chunks = text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
  return chunks;
}

async function main() {
  const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.pdf'));
  let allChunks = [];
  for (const file of files) {
    const filePath = path.join(kbDir, file);
    const chunks = await extractChunksFromPDF(filePath);
    allChunks.push(...chunks.map(text => ({ file, text })));
    console.log(`Extracted ${chunks.length} chunks from ${file}`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(allChunks, null, 2));
  console.log(`Saved all chunks to ${outputFile}`);
}

main();
