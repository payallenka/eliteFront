import fs from 'fs';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';
import path from 'path';
dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const kbEmbeddingsFile = path.join(process.cwd(), 'kb_embeddings_hf.json');

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

export async function getKBContext(query, topN = 5) {
  const kbChunks = JSON.parse(fs.readFileSync(kbEmbeddingsFile, 'utf8'));
  const queryEmbedding = await embedQuery(query);
  const scored = kbChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, topN);
  
  // Return the actual content chunks with detailed information
  let contextText = '';
  topChunks.forEach((chunk, index) => {
    contextText += `\n--- Knowledge Base Context ${index + 1} (from ${chunk.file}) ---\n`;
    contextText += chunk.text;
    contextText += '\n';
  });
  
  return contextText;
}
