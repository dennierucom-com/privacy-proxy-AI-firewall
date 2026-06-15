import { IPatternScanner, ScanResult, ScanSignal } from '../../core/interfaces';

export interface PatternRule {
  name: string;
  pattern: RegExp;
  weight: number;
}

export class RegexScanner implements IPatternScanner {
  private readonly rules: PatternRule[] = [
    { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, weight: 80 },
    { name: 'PHONE', pattern: /\b\d{3}-\d{3}-\d{4}\b/g, weight: 20 },
    { name: 'MEDICAL_RECORD_NUMBER', pattern: /\bMRN\s*\d{6,8}\b/gi, weight: 80 },
  ];

  public scan(text: string): ScanResult {
    const signals: ScanSignal[] = [];
    let totalWeight = 0;

    for (const rule of this.rules) {
      if (rule.pattern.test(text)) {
        signals.push({ type: rule.name, weight: rule.weight });
        totalWeight += rule.weight;
      }
    }

    return { signals, totalWeight };
  }
}
