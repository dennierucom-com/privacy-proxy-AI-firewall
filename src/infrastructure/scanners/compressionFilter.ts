import { EmbeddingsFilter } from '@langchain/classic/retrievers/document_compressors/embeddings_filter';
import { Embeddings } from '@langchain/core/embeddings';
import { Document } from '@langchain/core/documents';
import { ICompressionFilter, DocumentInterface } from '../../core/interfaces';

export class CompressionFilter implements ICompressionFilter {
  private filter: EmbeddingsFilter;

  constructor(embeddings: Embeddings, similarityThreshold: number) {
    this.filter = new EmbeddingsFilter({
      embeddings,
      similarityThreshold,
    });
  }

  public async compress(text: string): Promise<DocumentInterface[]> {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const docs = sentences.map((s) => new Document({ pageContent: s.trim() }));

    try {
      const compressedDocs = await this.filter.compressDocuments(docs, text);
      return compressedDocs.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      }));
    } catch (e) {
      console.warn('Compression filter encountered an error, falling back to empty fragments', e);
      return [];
    }
  }
}
