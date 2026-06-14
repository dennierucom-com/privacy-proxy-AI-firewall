import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Free Google Gemini Embeddings Engine
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Synthetic PHI profiles representing highly sensitive vectors to catch
const syntheticPHIPatterns = [
  new Document({
    pageContent: "Patient chart notes show a diagnosis of Stage II Type 2 Diabetes with severe neuropathy. Prescribed Metformin 500mg twice daily.",
    metadata: { classification: "PHI_MEDICAL_RECORD", dangerLevel: "HIGH" }
  }),
  new Document({
    pageContent: "Subject underwent an emergency appendectomy at St. Jude Hospital. Patient billing record reflects a balance of $12,450 sent to collections.",
    metadata: { classification: "PHI_FINANCIAL_MEDICAL", dangerLevel: "HIGH" }
  }),
  new Document({
    pageContent: "Laboratory results for confidential testing return positive for infectious disease panels. Patient contact tracing requested.",
    metadata: { classification: "PHI_LABS", dangerLevel: "CRITICAL" }
  }),
  new Document({
    pageContent: "Admitted to the psychiatric ward following acute depressive episode and high-risk anxiety evaluations. Managed under Dr. Aris's supervision.",
    metadata: { classification: "PHI_MENTAL_HEALTH", dangerLevel: "CRITICAL" }
  })
];

async function seedLocalFirewallStore() {
  console.log("🚀 Initializing connection to local ChromaDB Docker container...");
  
  try {
    const vectorStore = await Chroma.fromDocuments(syntheticPHIPatterns, embeddings, {
      collectionName: "phi-firewall-signatures",
      url: process.env.CHROMA_URL || "http://localhost:8000", 
    });

    console.log("✅ Successfully seeded Vector Store with synthetic PHI patterns.");
    
    // Quick test query to ensure similarity metric returns expected distances
    const testQuery = "The doctor says my blood sugar is too high and wants me on Metformin.";
    console.log(`\n🔍 Running a test verification search for: "${testQuery}"`);
    
    const resultsWithScore = await vectorStore.similaritySearchWithScore(testQuery, 1);
    
    for (const [doc, score] of resultsWithScore) {
      console.log(`[MATCH FOUND] Score (Distance): ${score.toFixed(4)}`);
      console.log(`[CONTENT]: ${doc.pageContent}`);
      console.log(`[METADATA]: ${JSON.stringify(doc.metadata)}`);
    }

  } catch (error) {
    console.error("❌ Failed to seed local vector store database:", error);
  }
}

seedLocalFirewallStore();
