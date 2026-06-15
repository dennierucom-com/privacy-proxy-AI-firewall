import {
  IPatternScanner,
  ISemanticScanner,
  ICompressionFilter,
  FirewallVerdict,
} from './interfaces';

export class ScoringEngine {
  constructor(
    private readonly patternScanner: IPatternScanner,
    private readonly semanticScanner: ISemanticScanner,
    private readonly compressionFilter: ICompressionFilter,
    private readonly blockThreshold: number,
  ) {}

  public async evaluate(prompt: string): Promise<FirewallVerdict> {
    let finalRiskScore = 0;

    // 1. Run deterministic pattern parsing
    const regexResult = this.patternScanner.scan(prompt);
    finalRiskScore += regexResult.totalWeight;

    // 2. Isolate high-risk sentence fragments via compression filter
    const compressedDocs = await this.compressionFilter.compress(prompt);

    // 3. Evaluate compressed content against semantic vector database
    if (compressedDocs.length > 0) {
      console.log(
        `\n🗜️ [COMPRESSION ACTIVE] Isolated ${compressedDocs.length} high-risk sentence fragments.`,
      );
      const semanticScore = await this.semanticScanner.scanDocuments(compressedDocs, prompt);
      finalRiskScore += semanticScore;
    }

    console.log(`🛡️ [FIREWALL AUDIT] Final Evaluated Risk Score: ${finalRiskScore}`);

    const blocked = finalRiskScore >= this.blockThreshold;

    if (blocked) {
      console.error(
        `SECURITY_ALERT [FAIL CLOSED]: Intercepted payload. Score (${finalRiskScore}) violates regulatory boundary limits.`,
      );
    }

    return {
      riskScore: finalRiskScore,
      blocked,
      signals: regexResult.signals,
      compressedFragments: compressedDocs.length,
    };
  }
}
