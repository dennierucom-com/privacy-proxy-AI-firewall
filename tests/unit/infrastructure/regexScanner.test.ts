import { RegexScanner } from '../../../src/infrastructure/scanners/regexScanner';

describe('RegexScanner', () => {
  let scanner: RegexScanner;

  beforeEach(() => {
    scanner = new RegexScanner();
  });

  it('should return no signals for clean text', () => {
    const text = 'This text has no PII or PHI.';
    const result = scanner.scan(text);

    expect(result.signals).toHaveLength(0);
    expect(result.totalWeight).toBe(0);
  });

  it('should detect SSN patterns', () => {
    const text = 'My SSN is 000-12-3456.';
    const result = scanner.scan(text);

    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].type).toBe('SSN');
    expect(result.totalWeight).toBe(80);
  });

  it('should detect PHONE patterns', () => {
    const text = 'Call me at 555-321-9876.';
    const result = scanner.scan(text);

    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].type).toBe('PHONE');
    expect(result.totalWeight).toBe(20);
  });

  it('should detect MRN patterns', () => {
    const text = 'Patient MRN 1234567 is admitted.';
    const result = scanner.scan(text);

    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].type).toBe('MEDICAL_RECORD_NUMBER');
    expect(result.totalWeight).toBe(80);
  });

  it('should detect multiple patterns in the same text', () => {
    const text = 'Contact 555-321-9876 or update record via SSN 000-12-3456.';
    const result = scanner.scan(text);

    expect(result.signals).toHaveLength(2);
    const types = result.signals.map((s) => s.type);
    expect(types).toContain('PHONE');
    expect(types).toContain('SSN');
    expect(result.totalWeight).toBe(100);
  });
});
