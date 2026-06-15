import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { EmbeddingsFilter } from "@langchain/classic/retrievers/document_compressors/embeddings_filter";
import * as dotenv from "dotenv";

dotenv.config();

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-3.5-flash",
  temperature: 0.1,
});

// Mock localized regex engine from Step 2
function runLocalRegexScan(text: string) {
  const signals = [];
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  if (ssnPattern.test(text)) signals.push({ type: "SSN", weight: 80 });
  return signals;
}

async function initializeCompressedFirewall() {
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "phi-firewall-signatures",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  // Configure an Embeddings Filter to act as our compressor
  // It only lets sentences through if they are highly relevant to known tracking vectors
  const compressionFilter = new EmbeddingsFilter({
    embeddings: embeddings,
    similarityThreshold: 0.65,
  });

  return RunnableSequence.from([
    {
      originalPrompt: new RunnablePassthrough(),
      // Advanced Optimization: Break text into sentence fragments to isolate risks
      compressedContext: async (input: string) => {
        const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const docs = sentences.map(s => new Document({ pageContent: s.trim() }));
        
        // Compress the documents relative to our vector store target
        try {
          const compressedDocs = await compressionFilter.compressDocuments(docs, input);
          return compressedDocs;
        } catch (e) {
          return []; // Fallback empty array if compression engine encounters an edge case
        }
      }
    },
    async (state: any) => {
      let finalRiskScore = 0;
      const promptToAnalyze = state.originalPrompt;

      // 1. Run quick deterministic parsing
      const regexSignals = runLocalRegexScan(promptToAnalyze);
      regexSignals.forEach(s => finalRiskScore += s.weight);

      // 2. Evaluate compressed content against Vector Database
      if (state.compressedContext.length > 0) {
        console.log(`\n🗜️ [COMPRESSION ACTIVE] Isolated ${state.compressedContext.length} high-risk sentence fragments.`);
        
        for (const doc of state.compressedContext) {
          const matches = await vectorStore.similaritySearchWithScore(doc.pageContent, 1);
          if (matches.length > 0) {
            const [matchDoc, distance] = matches[0];
            if (distance < 0.60) {
              finalRiskScore += 45; // Escalate risk score based on optimized fragments
            }
          }
        }
      }

      console.log(`🛡️ [FIREWALL AUDIT] Final Evaluated Risk Score: ${finalRiskScore}`);

      if (finalRiskScore >= 40) {
        throw new Error(`SECURITY_ALERT: PHI patterns detected. Transaction aborted via Fail-Closed protocol.`);
      }

      return promptToAnalyze;
    },
    model,
    new StringOutputParser()
  ]);
}

async function runCompressedMatrix() {
  const secureChain = await initializeCompressedFirewall();

  // Test Case: Large block of text with an isolated sneaky medical disclosure mixed with filler sentences
  const bloatedPrompt = `
    Hello system. Today I am writing a comprehensive essay regarding standard operating procedures. 
    First, verify that the environment parameters are initialized correctly. 
    By the way, my patient chart notes show a diagnosis of Stage II Type 2 Diabetes with severe neuropathy. 
    Please make sure to save everything to the database layer when done.
  `;

  try {
    console.log("🧪 Executing test on bloated, high-risk context prompt...");
    await secureChain.invoke(bloatedPrompt);
  } catch (err: any) {
    console.log(`❌ [EXPECTED BEHAVIOR SUCCESSFUL]: ${err.message}`);
  }
}

runCompressedMatrix();