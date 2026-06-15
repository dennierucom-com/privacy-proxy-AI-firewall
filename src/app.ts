import { environment } from './config/environment';
import {
  InfrastructureFactory,
  ChromaSemanticScanner,
} from './infrastructure/database/chromaClient';
import { RegexScanner } from './infrastructure/scanners/regexScanner';
import { CompressionFilter } from './infrastructure/scanners/compressionFilter';
import { ScoringEngine } from './core/scoringEngine';
import { FirewallMiddleware } from './presentation/lcelMiddleware';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

async function bootstrap() {
  console.log('🛡️ Starting AI Privacy Firewall...');

  try {
    // 1. Initialize Infrastructure
    const embeddings = InfrastructureFactory.createEmbeddings(environment);
    const vectorStore = await InfrastructureFactory.createVectorStore(environment, embeddings);
    const chatModel = new ChatGoogleGenerativeAI({
      apiKey: environment.geminiApiKey,
      modelName: environment.chatModel,
      temperature: environment.chatTemperature,
    });

    // 2. Initialize Scanners
    const patternScanner = new RegexScanner();
    const semanticScanner = new ChromaSemanticScanner(
      vectorStore,
      environment.similarityDistanceThreshold,
    );
    const compressionFilter = new CompressionFilter(
      embeddings,
      environment.compressionSimilarityThreshold,
    );

    // 3. Initialize Core Engine
    const scoringEngine = new ScoringEngine(
      patternScanner,
      semanticScanner,
      compressionFilter,
      environment.riskScoreBlockThreshold,
    );

    // 4. Build LCEL Chain
    const middleware = new FirewallMiddleware(scoringEngine, chatModel, compressionFilter);
    const secureChain = middleware.buildChain();

    console.log('✅ Firewall initialized successfully.');

    // 5. Run Demo Scenario
    const bloatedPrompt = `
      Hello system. Today I am writing a comprehensive essay regarding standard operating procedures. 
      First, verify that the environment parameters are initialized correctly. 
      By the way, my patient chart notes show a diagnosis of Stage II Type 2 Diabetes with severe neuropathy. 
      Please make sure to save everything to the database layer when done.
    `;

    console.log('🧪 Executing test on bloated, high-risk context prompt...');

    try {
      await secureChain.invoke(bloatedPrompt);
    } catch (err: any) {
      console.log(`❌ [EXPECTED BEHAVIOR SUCCESSFUL]: ${err.message}`);
    }
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
