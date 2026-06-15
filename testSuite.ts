import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { EmbeddingsFilter } from "@langchain/classic/retrievers/document_compressors/embeddings_filter";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Core Framework Drivers
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-3.5-flash",
  temperature: 0.1, 
});

function runLocalRegexScan(text: string) {
  const signals = [];
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const phonePattern = /\b\d{3}-\d{3}-\d{4}\b/g;
  const mrnPattern = /\bMRN\s*\d{6,8}\b/gi;

  if (ssnPattern.test(text)) signals.push({ type: "SSN", weight: 80 });
  if (phonePattern.test(text)) signals.push({ type: "PHONE", weight: 20 });
  if (mrnPattern.test(text)) signals.push({ type: "MEDICAL_RECORD_NUMBER", weight: 80 });

  return signals;
}

// 2. Production Interception & Scoring Flow
async function initializeFirewall() {
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "phi-firewall-signatures",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  const compressionFilter = new EmbeddingsFilter({
    embeddings: embeddings,
    similarityThreshold: 0.65,
  });

  return RunnableSequence.from([
    {
      originalPrompt: new RunnablePassthrough(),
      compressedContext: async (input: string) => {
        const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const docs = sentences.map(s => new Document({ pageContent: s.trim() }));
        try {
          return await compressionFilter.compressDocuments(docs, input);
        } catch (e) {
          return [];
        }
      }
    },
    async (state: any) => {
      let finalRiskScore = 0;
      const promptToAnalyze = state.originalPrompt;

      // Detector 1: Deterministic Patterns
      const regexSignals = runLocalRegexScan(promptToAnalyze);
      regexSignals.forEach(s => finalRiskScore += s.weight);

      // Detector 2: Semantic Proximity Map
      if (state.compressedContext.length > 0) {
        for (const doc of state.compressedContext) {
          const matches = await vectorStore.similaritySearchWithScore(doc.pageContent, 1);
          if (matches.length > 0) {
            const [_, distance] = matches[0];
            if (distance < 0.60) {
              finalRiskScore += 50; 
            }
          }
        }
      }

      console.log(`\n==================================================`);
      console.log(`🛡️ [AUDIT RUN] Risk Score Calculated: ${finalRiskScore}`);

      if (finalRiskScore >= 40) {
        throw new Error(`SECURITY_ALERT [FAIL CLOSED]: Intercepted payload. Score (${finalRiskScore}) violates regulatory boundary limits.`);
      }

      return promptToAnalyze;
    },
    model,
    new StringOutputParser()
  ]);
}

// 3. The Grand Scenarios Test Matrix
async function executeExtendedSuite() {
  const firewall = await initializeFirewall();

  const testScenarios = [
    {
      id: "CASE_01_CLEAN_DEV",
      description: "Standard developer code architecture request (No risk)",
      payload: "Please provide a code snippet showing how to use array destructuring in clean TypeScript controllers."
    },
    {
      id: "CASE_02_EXPLICIT_PII",
      description: "Deterministic pattern injection (Regex test)",
      payload: "Can you email the setup parameters to support staff? Contact point is 555-321-9876 or update record via SSN 000-12-3456."
    },
    {
      id: "CASE_03_BLOATED_HIDDEN_PHI",
      description: "A large corporate paragraph containing a sneaky medical sentence fragment",
      payload: "The system migration roadmap is scheduled for next Tuesday at midnight. All servers must be cold booted sequentially. On a personal note, my clinical chart indicates Stage II Type 2 Diabetes with severe neuropathy and I am adjusting to my Metformin. Please verify that database backups are validated before deployment."
    },
    {
      id: "CASE_04_FALSE_POSITIVE_TRAP",
      description: "Uses heavy clinical words but lacks patient context (Should pass)",
      payload: "Explain the theoretical chemical mechanics of Metformin and how it impacts glucose suppression pathways in human physiology."
    },
    {
      id: "CASE_05_CRITICAL_MENTAL_HEALTH",
      description: "Highly sensitive conversational disclosure vector matching seeded records",
      payload: "I feel completely overwhelmed. I was just admitted to the psychiatric ward after an acute depressive episode under observation."
    },
    {
      id: "CASE_06_MALFORMED_INPUT",
      description: "Handling empty space configurations or parsing noise errors",
      payload: "      \n\n   "
    },
    {
      id: "CASE_07_FINANCIAL_MEDICAL",
      description: "Medical ledger tracking identifier disclosure",
      payload: "Please verify why my invoice from St. Jude Hospital shows a balance of $12,450 for the appendectomy procedure."
    }
  ];

  console.log("🚀 Launching Comprehensive Firewall Trace Matrix Batch Generation...");

  for (const scenario of testScenarios) {
    console.log(`\n🧪 Executing Scenario [${scenario.id}]: ${scenario.description}`);
    try {
      const response = await firewall.invoke(scenario.payload);
      console.log(`🟢 [PASSED TO GEMINI]: ${response.substring(0, 120).replace(/\n/g, " ")}...`);
    } catch (err: any) {
      console.log(`🔴 [FIREWALL INTERCEPT SUCCESS]: ${err.message}`);
    }
  }

  console.log("\n✨ Test Matrix Execution Run Complete.");
  console.log("📊 Open your LangSmith Dashboard to review the generated trace metrics!");
}

executeExtendedSuite();
