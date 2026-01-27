import { SYSTEM_PROMPT_V1 } from './prompts/system-v1';

export const AGENT_CONFIG = {
  name: "TimeTwin Assistant",
  model: "openai/gpt-5.2-20251211",
  modelCard: {
    description: "GPT-5.2 is the latest frontier-grade model in the GPT-5 series, offering stronger agentic and long context perfomance compared to GPT-5.1. It uses adaptive reasoning to allocate computation dynamically, responding quickly to simple queries while spending more depth on complex tasks.\n\nBuilt for broad task coverage, GPT-5.2 delivers consistent gains across math, coding, sciende, and tool calling workloads, with more coherent long-form answers and improved tool-use reliability.",
    contextWindow: 400000,
    maxOutput: 128000,
    provider: "OpenAI",
    pricing: {
      input: "$1.75 / 1M tokens",
      output: "$14.00 / 1M tokens"
    }
  },
  baseSystemPrompt: SYSTEM_PROMPT_V1,
};
