/**
 * AI Eval Framework - Core Types
 * 
 * Generic types for AI evaluation system. These work with any AI agent
 * regardless of domain (calendar, chatbot, code generator, etc.).
 * 
 * Copy this to any project that needs AI evals.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

/**
 * Metadata about an eval run
 * 
 * Tracks everything needed to reproduce or compare runs:
 * - Agent configuration (model, prompt, settings)
 * - Environment (git, node version, who ran it)
 * - Test suite info
 */
export interface EvalRunMetadata {
  run_id: string;
  timestamp: string;
  agent_config: {
    name: string;
    model: string;
    temperature: number;
    system_prompt: string;
    system_prompt_hash: string;
    system_prompt_version?: string;
    [key: string]: unknown; // Domain-specific config (tools, max_tokens, etc.)
  };
  environment: {
    git_commit?: string;
    git_branch?: string;
    node_version: string;
    run_by?: string;
  };
  test_suite: {
    total_cases: number;
    tags: string[];
  };
}

/**
 * Result for a single test case
 * 
 * Generic enough to work for any AI task:
 * - Tool calling, text generation, classification, etc.
 */
export interface EvalTestResult {
  run_id: string;
  test_id: string;
  prompt: string;
  passed: boolean;
  execution_time_ms: number;
  error?: string;
  
  // Domain-specific optional fields
  tools_called?: string[];
  tools_expected?: string[];
  actions_generated?: number;
  actions_expected?: number;
  clarification_asked?: boolean;
  clarification_expected?: boolean;
}

/**
 * Structure of a test case in JSONL
 * 
 * Flexible structure that works across domains.
 */
export interface EvalCase<TEngineering = unknown, TDesign = unknown> {
  id: string;
  prompt: string;
  initialState?: unknown; // Calendar: notes array, Chatbot: conversation history
  engineering: TEngineering; // Domain-specific assertions
  design: TDesign; // Manual review criteria
  tags: string[];
}
