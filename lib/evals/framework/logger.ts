/**
 * AI Eval Framework - Logger
 * 
 * Generic eval result logger that works with any AI system.
 * Tracks configuration, environment, and per-test results.
 * 
 * Copy this to any project that needs AI evals.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import * as fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { EvalRunMetadata, EvalTestResult } from './types';

/**
 * Eval run logger
 * 
 * Creates a timestamped folder for each eval run and saves:
 * - metadata.json (configuration, environment, test suite info)
 * - results.csv (per-test results)
 * - results.json (same as CSV but in JSON)
 * - summary.txt (human-readable summary)
 * 
 * Usage:
 * ```typescript
 * const logger = new EvalLogger(
 *   systemPrompt,
 *   { name: 'my-agent', model: 'gpt-4', temperature: 0 },
 *   30,
 *   ['tool-usage', 'edge-cases']
 * );
 * 
 * // Run tests...
 * logger.logResult({ test_id: '1', prompt: 'test', passed: true, ... });
 * 
 * logger.save(); // Writes to evals/results/
 * ```
 */
export class EvalLogger {
  private runId: string;
  private runDir: string;
  private metadata: EvalRunMetadata;
  private results: EvalTestResult[] = [];

  /**
   * Create a new eval logger
   * 
   * @param systemPrompt - Full system prompt text
   * @param agentConfig - Agent configuration (model, temp, domain-specific settings)
   * @param totalCases - Number of test cases
   * @param tags - All tags in test suite
   */
  constructor(
    systemPrompt: string,
    agentConfig: Omit<EvalRunMetadata['agent_config'], 'system_prompt' | 'system_prompt_hash'>,
    totalCases: number,
    tags: string[]
  ) {
    this.runId = this.generateRunId();
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.runDir = path.join(process.cwd(), 'evals', 'results', `${timestamp}-${this.runId}`);
    
    if (!fs.existsSync(this.runDir)) {
      fs.mkdirSync(this.runDir, { recursive: true });
    }

    this.metadata = {
      run_id: this.runId,
      timestamp: new Date().toISOString(),
      agent_config: {
        ...agentConfig,
        system_prompt: systemPrompt,
        system_prompt_hash: this.hashPrompt(systemPrompt),
      } as EvalRunMetadata['agent_config'],
      environment: {
        git_commit: this.getGitCommit(),
        git_branch: this.getGitBranch(),
        node_version: process.version,
        run_by: process.env.USER || process.env.USERNAME,
      },
      test_suite: {
        total_cases: totalCases,
        tags: tags,
      },
    };
  }

  private generateRunId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private hashPrompt(prompt: string): string {
    return 'sha256:' + crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
  }

  private getGitCommit(): string | undefined {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return undefined;
    }
  }

  private getGitBranch(): string | undefined {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return undefined;
    }
  }

  /**
   * Log a test result
   */
  logResult(result: Omit<EvalTestResult, 'run_id'>): void {
    this.results.push({
      run_id: this.runId,
      ...result,
    });
  }

  /**
   * Save all results to disk as a single consolidated JSON file
   * 
   * Creates run.json containing metadata, results, and summary.
   * CSV export is available on-demand from the dashboard.
   */
  save(): void {
    const summary = this.generateSummaryObject();
    
    const consolidatedData = {
      metadata: this.metadata,
      results: this.results,
      summary,
    };

    const runJsonPath = path.join(this.runDir, 'run.json');
    fs.writeFileSync(runJsonPath, JSON.stringify(consolidatedData, null, 2));

    console.log(`\n📊 Eval results saved to: ${this.runDir}`);
    console.log(`   - run.json (all data - export CSV from dashboard)`);
  }

  /**
   * Generate summary as structured object
   */
  private generateSummaryObject(): {
    runId: string;
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    avgExecutionTime: number;
    failedTests: Array<{ id: string; input: string; error?: string }>;
  } {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const avgTime = this.results.reduce((sum, r) => sum + r.execution_time_ms, 0) / this.results.length;
    const passRate = this.results.length > 0 ? (passed / this.results.length) * 100 : 0;

    const failedTests = this.results
      .filter(r => !r.passed)
      .map(r => ({
        id: r.test_id,
        input: r.prompt,
        error: r.error,
      }));

    return {
      runId: this.runId,
      totalTests: this.results.length,
      passed,
      failed,
      passRate,
      avgExecutionTime: avgTime,
      failedTests,
    };
  }

  /**
   * Export results to CSV format (used by dashboard export)
   */
  exportToCSV(): string {
    if (this.results.length === 0) return '';

    // Get all keys from first result (handles dynamic fields)
    const allKeys = Object.keys(this.results[0]);
    const headers = allKeys;

    const rows = this.results.map(r => 
      allKeys.map(key => {
        const value = (r as unknown as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
    );

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  getRunDir(): string {
    return this.runDir;
  }

  getRunId(): string {
    return this.runId;
  }
}
