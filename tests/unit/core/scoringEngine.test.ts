import { ScoringEngine } from '../../../src/core/scoringEngine';
import { IPatternScanner, ISemanticScanner, ICompressionFilter, ScanResult, DocumentInterface } from '../../../src/core/interfaces';

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;
  let mockPatternScanner: jest.Mocked<IPatternScanner>;
  let mockSemanticScanner: jest.Mocked<ISemanticScanner>;
  let mockCompressionFilter: jest.Mocked<ICompressionFilter>;

  const BLOCK_THRESHOLD = 40;

  beforeEach(() => {
    mockPatternScanner = {
      scan: jest.fn(),
    };
    mockSemanticScanner = {
      scanDocuments: jest.fn(),
    };
    mockCompressionFilter = {
      compress: jest.fn(),
    };

    scoringEngine = new ScoringEngine(
      mockPatternScanner,
      mockSemanticScanner,
      mockCompressionFilter,
      BLOCK_THRESHOLD
    );
  });

  it('should return a 0 risk score and not block a clean prompt', async () => {
    const cleanPrompt = 'This is a clean prompt with no PHI.';
    mockPatternScanner.scan.mockReturnValue({ signals: [], totalWeight: 0 });
    mockCompressionFilter.compress.mockResolvedValue([]);

    const result = await scoringEngine.evaluate(cleanPrompt);

    expect(result.riskScore).toBe(0);
    expect(result.blocked).toBe(false);
    expect(mockSemanticScanner.scanDocuments).not.toHaveBeenCalled();
  });

  it('should block if regex scan returns a weight >= threshold', async () => {
    const ssnPrompt = 'My SSN is 000-12-3456';
    const ssnSignal = { type: 'SSN', weight: 80 };
    mockPatternScanner.scan.mockReturnValue({ signals: [ssnSignal], totalWeight: 80 });
    mockCompressionFilter.compress.mockResolvedValue([]);

    const result = await scoringEngine.evaluate(ssnPrompt);

    expect(result.riskScore).toBe(80);
    expect(result.blocked).toBe(true);
    expect(result.signals).toContain(ssnSignal);
  });

  it('should evaluate semantic score if compressed docs are returned and block if threshold exceeded', async () => {
    const medicalPrompt = 'I was just admitted to the psychiatric ward after an acute depressive episode.';
    mockPatternScanner.scan.mockReturnValue({ signals: [], totalWeight: 0 });
    const docs: DocumentInterface[] = [{ pageContent: medicalPrompt }];
    mockCompressionFilter.compress.mockResolvedValue(docs);
    mockSemanticScanner.scanDocuments.mockResolvedValue(50);

    const result = await scoringEngine.evaluate(medicalPrompt);

    expect(result.riskScore).toBe(50);
    expect(result.blocked).toBe(true);
    expect(mockSemanticScanner.scanDocuments).toHaveBeenCalledWith(docs, medicalPrompt);
  });

  it('should accumulate scores from both regex and semantic scanners', async () => {
    const mixedPrompt = 'Call me at 555-123-4567 about my psychiatric admission.';
    const phoneSignal = { type: 'PHONE', weight: 20 };
    mockPatternScanner.scan.mockReturnValue({ signals: [phoneSignal], totalWeight: 20 });
    const docs: DocumentInterface[] = [{ pageContent: 'about my psychiatric admission.' }];
    mockCompressionFilter.compress.mockResolvedValue(docs);
    mockSemanticScanner.scanDocuments.mockResolvedValue(50);

    const result = await scoringEngine.evaluate(mixedPrompt);

    expect(result.riskScore).toBe(70);
    expect(result.blocked).toBe(true);
  });
});
