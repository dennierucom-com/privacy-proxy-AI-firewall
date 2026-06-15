import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { AppConfig } from '../../config/environment';
import { ISemanticScanner, DocumentInterface } from '../../core/interfaces';

export class ChromaSemanticScanner implements ISemanticScanner {
  constructor(
    private readonly vectorStore: Chroma,
    private readonly distanceThreshold: number,
  ) {}

  public async scanDocuments(docs: DocumentInterface[], query?: string): Promise<number> {
    let semanticScore = 0;
    for (const doc of docs) {
      const matches = await this.vectorStore.similaritySearchWithScore(doc.pageContent, 1);
      if (matches.length > 0) {
        const [, distance] = matches[0];
        if (distance < this.distanceThreshold) {
          semanticScore += 50;
        }
      }
    }
    return semanticScore;
  }
}

export class InfrastructureFactory {
  static createEmbeddings(config: AppConfig): GoogleGenerativeAIEmbeddings {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      modelName: config.embeddingModel,
    });
  }

  static async createVectorStore(
    config: AppConfig,
    embeddings: GoogleGenerativeAIEmbeddings,
  ): Promise<Chroma> {
    return Chroma.fromExistingCollection(embeddings, {
      collectionName: config.chromaCollection,
      url: config.chromaUrl,
    });
  }
}
