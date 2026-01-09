/**
 * AI Eval Framework - Utilities
 * 
 * Helper functions for building eval test suites.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import fs from 'fs';
import { EvalCase } from './types';

/**
 * Load eval cases from JSONL file
 * 
 * @param filePath - Absolute path to JSONL file
 * @returns Array of eval cases
 */
export function loadEvalCases<T extends EvalCase = EvalCase>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

/**
 * Filter eval cases by tag
 * 
 * @param cases - All eval cases
 * @param tag - Tag to filter by
 * @returns Filtered cases
 */
export function filterByTag<T extends EvalCase = EvalCase>(cases: T[], tag: string): T[] {
  return cases.filter(c => c.tags.includes(tag));
}

/**
 * Get all unique tags from eval cases
 * 
 * @param cases - All eval cases
 * @returns Array of unique tags
 */
export function getAllTags<T extends EvalCase = EvalCase>(cases: T[]): string[] {
  return Array.from(new Set(cases.flatMap(c => c.tags)));
}

/**
 * Measure execution time of a function
 * 
 * @param fn - Function to measure
 * @returns Tuple of [result, executionTimeMs]
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return [result, end - start];
}
