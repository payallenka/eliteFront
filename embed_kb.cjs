const fs = require('fs');
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const inputFile = './kb_chunks.json';
const outputFile = './kb_embeddings_hf.json';

async function getEmbedding(text) {
  // Using "sentence-transformers/all-MiniLM-L6-v2" model for embeddings
  const response = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text
  });
  return response; // array of floats
}

async function main() {
  const kbChunks = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const results = [];

  for (const [i, chunk] of kbChunks.entries()) {
    try {
      const embedding = await getEmbedding(chunk.text);
      results.push({ ...chunk, embedding });
      console.log(`✅ [${i + 1}/${kbChunks.length}] Embedded chunk from ${chunk.file}`);
    } catch (err) {
      console.error(`❌ Failed to embed chunk from ${chunk.file}:`, err.message);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`💾 Saved embeddings to ${outputFile}`);
}

main();
