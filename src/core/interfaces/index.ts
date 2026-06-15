export interface ScanSignal {
  type: string;
  weight: number;
}

export interface ScanResult {
  signals: ScanSignal[];
  totalWeight: number;
}

export interface DocumentInterface {
  pageContent: string;
  metadata?: Record<string, any>;
}

export interface IPatternScanner {
  scan(text: string): ScanResult;
}

export interface ISemanticScanner {
  scanDocuments(docs: DocumentInterface[], query?: string): Promise<number>;
}

export interface ICompressionFilter {
  compress(text: string): Promise<DocumentInterface[]>;
}

export interface FirewallVerdict {
  riskScore: number;
  blocked: boolean;
  signals: ScanSignal[];
  compressedFragments: number;
}
