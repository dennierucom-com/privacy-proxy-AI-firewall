import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { environment } from '../../../src/config/environment';
import {
  InfrastructureFactory,
  ChromaSemanticScanner,
} from '../../../src/infrastructure/database/chromaClient';
import { RegexScanner } from '../../../src/infrastructure/scanners/regexScanner';
import { CompressionFilter } from '../../../src/infrastructure/scanners/compressionFilter';
import { ScoringEngine } from '../../../src/core/scoringEngine';
import { FirewallMiddleware } from '../../../src/presentation/lcelMiddleware';

describe('Firewall Integration Tests', () => {
  let secureChain: any;

  beforeAll(async () => {
    if (!environment.geminiApiKey) {
      console.warn('Skipping integration tests: GEMINI_API_KEY is not set');
      return;
    }

    try {
      const embeddings = InfrastructureFactory.createEmbeddings(environment);
      const vectorStore = await InfrastructureFactory.createVectorStore(environment, embeddings);
      const chatModel = new ChatGoogleGenerativeAI({
        apiKey: environment.geminiApiKey,
        modelName: environment.chatModel,
        temperature: environment.chatTemperature,
      });

      const patternScanner = new RegexScanner();
      const semanticScanner = new ChromaSemanticScanner(
        vectorStore,
        environment.similarityDistanceThreshold,
      );
      const compressionFilter = new CompressionFilter(
        embeddings,
        environment.compressionSimilarityThreshold,
      );

      const scoringEngine = new ScoringEngine(
        patternScanner,
        semanticScanner,
        compressionFilter,
        environment.riskScoreBlockThreshold,
      );

      const middleware = new FirewallMiddleware(scoringEngine, chatModel, compressionFilter);
      secureChain = middleware.buildChain();
    } catch (e) {
      console.error('Failed to initialize integration test environment. Is ChromaDB running?', e);
      throw e;
    }
  });

  beforeEach(() => {
    if (!secureChain) {
      // @ts-ignore
      pending('Integration test environment could not be initialized');
    }
  });

  const testScenarios = [
    {
      id: 'CASE_01_CLEAN_DEV',
      description: 'Standard developer code architecture request (No risk)',
      payload:
        'Please provide a code snippet showing how to use array destructuring in clean TypeScript controllers.',
      shouldBlock: false,
    },
    {
      id: 'CASE_02_EXPLICIT_PII',
      description: 'Deterministic pattern injection (Regex test)',
      payload:
        'Can you email the setup parameters to support staff? Contact point is 555-321-9876 or update record via SSN 000-12-3456.',
      shouldBlock: true,
    },
    {
      id: 'CASE_03_BLOATED_HIDDEN_PHI',
      description: 'A large corporate paragraph containing a sneaky medical sentence fragment',
      payload:
        'The system migration roadmap is scheduled for next Tuesday at midnight. All servers must be cold booted sequentially. On a personal note, my clinical chart indicates Stage II Type 2 Diabetes with severe neuropathy and I am adjusting to my Metformin. Please verify that database backups are validated before deployment.',
      shouldBlock: true,
    },
    {
      id: 'CASE_04_FALSE_POSITIVE_TRAP',
      description: 'Uses heavy clinical words but lacks patient context (Should pass)',
      payload:
        'Explain the theoretical chemical mechanics of Metformin and how it impacts glucose suppression pathways in human physiology.',
      shouldBlock: false,
    },
    {
      id: 'CASE_05_CRITICAL_MENTAL_HEALTH',
      description: 'Highly sensitive conversational disclosure vector matching seeded records',
      payload:
        'I feel completely overwhelmed. I was just admitted to the psychiatric ward after an acute depressive episode under observation.',
      shouldBlock: true,
    },
    {
      id: 'CASE_06_MALFORMED_INPUT',
      description: 'Handling empty space configurations or parsing noise errors',
      payload: '      \n\n   ',
      shouldBlock: false,
    },
    {
      id: 'CASE_07_FINANCIAL_MEDICAL',
      description: 'Medical ledger tracking identifier disclosure',
      payload:
        'Please verify why my invoice from St. Jude Hospital shows a balance of $12,450 for the appendectomy procedure.',
      shouldBlock: true,
    },
  ];

  for (const scenario of testScenarios) {
    it(`should handle scenario: ${scenario.id}`, async () => {
      try {
        const response = await secureChain.invoke(scenario.payload);
        if (scenario.shouldBlock) {
          fail('Expected firewall to block the payload, but it allowed it.');
        }
        expect(typeof response).toBe('string');
      } catch (err: any) {
        if (!scenario.shouldBlock) {
          fail(
            `Expected firewall to allow the payload, but it blocked it with error: ${err.message}`,
          );
        }
        expect(err.message).toMatch(/SECURITY_ALERT|violates regulatory boundary limits/);
      }
    }, 15000); // 15s timeout
  }
});
