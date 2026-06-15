import * as dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  geminiApiKey: string;
  chromaUrl: string;
  chromaCollection: string;
  embeddingModel: string;
  chatModel: string;
  chatTemperature: number;
  similarityDistanceThreshold: number;
  compressionSimilarityThreshold: number;
  riskScoreBlockThreshold: number;
}

function loadConfig(): AppConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('FATAL: GEMINI_API_KEY environment variable is missing.');
  }

  return {
    geminiApiKey,
    chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
    chromaCollection: process.env.CHROMA_COLLECTION || 'phi-firewall-signatures',
    embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
    chatModel: process.env.CHAT_MODEL || 'gemini-3.5-flash',
    chatTemperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.1'),
    similarityDistanceThreshold: parseFloat(process.env.SIMILARITY_DISTANCE_THRESHOLD || '0.60'),
    compressionSimilarityThreshold: parseFloat(
      process.env.COMPRESSION_SIMILARITY_THRESHOLD || '0.65',
    ),
    riskScoreBlockThreshold: parseInt(process.env.RISK_SCORE_BLOCK_THRESHOLD || '40', 10),
  };
}

export const environment = Object.freeze(loadConfig());
