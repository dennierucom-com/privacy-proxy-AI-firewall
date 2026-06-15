import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ScoringEngine } from '../core/scoringEngine';
import { ICompressionFilter } from '../core/interfaces';

export class FirewallMiddleware {
  constructor(
    private readonly scoringEngine: ScoringEngine,
    private readonly chatModel: ChatGoogleGenerativeAI,
    private readonly compressionFilter: ICompressionFilter,
  ) {}

  public buildChain(): RunnableSequence {
    return RunnableSequence.from([
      {
        originalPrompt: new RunnablePassthrough(),
        compressedContext: async (input: string) => {
          const docs = await this.compressionFilter.compress(input);
          return docs;
        },
      },
      async (state: any) => {
        const promptToAnalyze = state.originalPrompt;
        const verdict = await this.scoringEngine.evaluate(promptToAnalyze);

        if (verdict.blocked) {
          throw new Error(
            `SECURITY_ALERT [FAIL CLOSED]: Intercepted payload. Score (${verdict.riskScore}) violates regulatory boundary limits.`,
          );
        }

        return promptToAnalyze;
      },
      this.chatModel,
      new StringOutputParser(),
    ]);
  }
}
