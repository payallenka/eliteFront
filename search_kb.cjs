const fs = require('fs');
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const kbEmbeddingsFile = './kb_embeddings_hf.json';

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(query) {
  return await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: query
  });
}

async function searchKB(query, topN = 3) {
  const kbChunks = JSON.parse(fs.readFileSync(kbEmbeddingsFile, 'utf8'));
  const queryEmbedding = await embedQuery(query);

  // Compute similarity for each chunk
  const scored = kbChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Sort by score, descending
  scored.sort((a, b) => b.score - a.score);

  // Return top N chunks
  return scored.slice(0, topN);
}

// Example usage:
(async () => {
  const userQuery = "What are the living costs for students in France?";
  const topChunks = await searchKB(userQuery, 3);

  // Prepare context for Gemini
  const context = topChunks.map(c => c.text).join('\n---\n');
  console.log("Context to inject:\n", context);

  // You can now prepend this context to the user query before sending to Gemini
})();