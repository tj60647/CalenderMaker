# AI Eval Framework

Reusable evaluation system for AI agents. Works with any AI application (chatbots, code generators, calendar assistants, etc.).

## Quick Copy-Paste Setup

### 1. Copy Framework to Your Project

```bash
cp -r lib/evals/framework/ YOUR_PROJECT/lib/evals/framework/
```

### 2. Create Your Test Suite

```typescript
// __tests__/evals/my-agent-evals.test.ts
import { EvalLogger } from '@/lib/evals/framework/logger';
import { loadEvalCases, getAllTags } from '@/lib/evals/framework/utils';

describe('My AI Agent Evals', () => {
  let evalLogger: EvalLogger;

  beforeAll(() => {
    const evalCases = loadEvalCases('evals/my-test-cases.jsonl');
    const allTags = getAllTags(evalCases);
    
    evalLogger = new EvalLogger(
      getSystemPrompt(),
      {
        name: 'my-agent-v1',
        model: 'gpt-4',
        temperature: 0,
        // Add your domain-specific config
        max_tokens: 1000,
      },
      evalCases.length,
      allTags
    );
  });

  afterAll(() => {
    evalLogger.save();
  });

  test.each(evalCases)('$id: $prompt', async (evalCase) => {
    const startTime = Date.now();
    
    // Run your AI agent
    const response = await runMyAgent(evalCase.prompt);
    
    // Check assertions
    const passed = checkAssertions(response, evalCase.engineering);
    
    // Log result
    evalLogger.logResult({
      test_id: evalCase.id,
      prompt: evalCase.prompt,
      passed,
      execution_time_ms: Date.now() - startTime,
      // Add domain-specific fields
      response_length: response.length,
      error: passed ? undefined : 'Assertion failed',
    });
    
    expect(passed).toBe(true);
  });
});
```

### 3. Create Test Cases (JSONL)

```jsonl
{"id":"test-1","prompt":"Your test prompt","initialState":{},"engineering":{"expected":"result"},"design":{"criteria":["clarity"]},"tags":["basic"]}
{"id":"test-2","prompt":"Another test","initialState":{},"engineering":{"expected":"other"},"design":{"criteria":["accuracy"]},"tags":["edge-case"]}
```

### 4. Run Evals

```bash
npm test my-agent-evals
```

Results saved to `evals/results/YYYY-MM-DDTHH-mm-ss-runid/`

---

## Core Files

### `types.ts`
- `EvalRunMetadata` - Configuration tracking
- `EvalTestResult` - Per-test results
- `EvalCase` - Test case structure

**Generic and extensible** - add domain-specific fields via `[key: string]: any`

### `logger.ts`
- `EvalLogger` - Tracks runs, saves results
- Output: Single `run.json` file with metadata, results, and summary
- Captures: git commit, system prompt, environment
- Export CSV/JSON on-demand from dashboard

### `utils.ts`
- `loadEvalCases()` - Load JSONL test cases
- `filterByTag()` - Filter by tag
- `getAllTags()` - Extract unique tags
- `measureTime()` - Timing helper

### `dashboard/`
- `EvalDashboard.tsx` - React component for visualization
- `data-loader.ts` - Load runs from disk
- `export.ts` - CSV/JSON export functions
- `types.ts` - Dashboard-specific types

---

## Customization

### Domain-Specific Fields

**Calendar AI:**
```typescript
evalLogger.logResult({
  // Standard fields
  test_id: 'week-1',
  prompt: 'week of march 24',
  passed: true,
  execution_time_ms: 50,
  
  // Calendar-specific
  tools_called: ['get_week_notes'],
  actions_generated: 0,
  clarification_asked: false,
});
```

**Chatbot:**
```typescript
evalLogger.logResult({
  // Standard fields
  test_id: 'safety-1',
  prompt: 'dangerous request',
  passed: true,
  execution_time_ms: 100,
  
  // Chatbot-specific
  safety_flags: ['violence'],
  sentiment_score: -0.5,
  refusal_message: 'I cannot help with that',
});
```

**Code Generator:**
```typescript
evalLogger.logResult({
  // Standard fields
  test_id: 'codegen-1',
  prompt: 'write fibonacci function',
  passed: true,
  execution_time_ms: 200,
  
  // Code-specific
  compilable: true,
  tests_passed: 5,
  code_length: 150,
  language: 'python',
});
```

### Agent Configuration

Add any fields to agent config:

```typescript
new EvalLogger(
  systemPrompt,
  {
    name: 'my-agent',
    model: 'gpt-4',
    temperature: 0,
    
    // Calendar: tools, max_loops
    tools_enabled: ['search', 'create'],
    max_loops: 5,
    
    // Code gen: language, frameworks
    target_language: 'typescript',
    frameworks: ['react', 'next.js'],
    
    // Chatbot: safety settings
    safety_level: 'high',
    moderation: true,
  },
  totalCases,
  tags
);
```

---

## File Structure

```
your-project/
├── lib/
│   └── evals/
│       ├── framework/           # Generic (copy from template)
│       │   ├── types.ts
│       │   ├── logger.ts
│       │   ├── utils.ts
│       │   └── README.md
│       └── your-domain/         # Your specific tests
│           └── helpers.ts
├── __tests__/
│   └── evals/
│       └── your-agent-evals.test.ts
├── evals/
│   ├── test-cases.jsonl        # Your test cases
│   └── results/                 # Auto-generated (gitignored)
│       └── 2026-01-09T.../
└── .gitignore                   # Add: /evals/results/
```

---

## Output Format

Each eval run creates a single `run.json` file containing all data:

### run.json Structure
```json
{
  "metadata": {
    "run_id": "2026-01-09T06-23-21-pamn3qz",
    "timestamp": "2026-01-09T06:23:21.000Z",
    "agent_config": {
      "name": "calendar-ai-v1",
      "model": "gpt-4",
      "temperature": 0,
      "system_prompt": "Full prompt text...",
      "system_prompt_hash": "sha256:abc123...",
      "your_custom_field": "value"
    },
    "environment": {
      "git_commit": "e2fa3b9c...",
      "git_branch": "master",
      "node_version": "v20.11.0",
      "run_by": "username"
    },
    "test_suite": {
      "total_cases": 30,
      "tags": ["tool-usage", "edge-cases", "date-parsing"]
    }
  },
  "results": [
    {
      "run_id": "2026-01-09T06-23-21-pamn3qz",
      "testCaseId": "test-1",
      "input": "add dentist appointment march 24 at 2pm",
      "passed": true,
      "executionTime": 50,
      "your_domain_field": "value"
    }
  ],
  "summary": {
    "runId": "2026-01-09T06-23-21-pamn3qz",
    "totalTests": 30,
    "passed": 28,
    "failed": 2,
    "passRate": 93.3,
    "avgExecutionTime": 75,
    "failedTests": [
      {
        "id": "test-5",
        "input": "ambiguous date",
        "error": "Failed to parse date"
      }
    ]
  }
}
```

### Export Formats

The dashboard provides on-demand export:
- **Export Latest CSV** - Current run results as CSV (for Excel/Sheets)
- **Download JSON** - Full run data as JSON (programmatic access)
- **Export All Runs CSV** - Aggregated results from multiple runs

**Why one file?** 
- 75% fewer files on disk
- Single source of truth
- Export only what you need
- Easier to version control

---

## Dashboard

The framework includes a reusable dashboard for visualizing eval results.

### Setup Dashboard (Next.js)

```typescript
// app/evals/page.tsx
import { Box } from '@mui/material';
import path from 'path';
import { 
  EvalDashboard,
  loadAllRuns, 
  getTrendData, 
  getDashboardSummary 
} from '@/lib/evals/framework/dashboard';

export default function EvalsPage() {
  const resultsDir = path.join(process.cwd(), 'evals', 'results');
  const runs = loadAllRuns(resultsDir);
  const summary = getDashboardSummary(runs);
  const trendData = getTrendData(runs, 30);
  const recentRuns = runs.slice(0, 10);

  return (
    <EvalDashboard
      title="My AI Evals"
      summary={summary}
      trendData={trendData}
      recentRuns={recentRuns}
    />
  );
}
```

### Dashboard Features

- **Overview Cards**: Total runs, avg pass rate, execution time, test count
- **Latest Run Details**: Run ID, timestamp, pass rate, model, git commit
- **Pass Rate Trend**: Line chart showing pass rate over time
- **Execution Time Trend**: Line chart showing performance changes
- **Problematic Tests**: Lists tests with pass rate < 80%
- **Recent Runs Table**: Last 10 runs with key metrics

### Dependencies

Install Recharts for charts:

```bash
npm install recharts
```

### View Dashboard

Navigate to `http://localhost:3000/evals` to see your eval results.

---

## Best Practices

1. **Start Small**: Begin with 20-30 test cases, add more as you find gaps
2. **Tag Everything**: Use tags to organize and filter tests
3. **Version Control**: Track results/ in .gitignore but commit test cases
4. **Run Regularly**: Run evals after every prompt change or model update
5. **Fix Failing Tests**: Don't let problematic tests accumulate
6. **Document Changes**: Use git commit tracking to understand regressions
7. **Monitor Dashboard**: Check trends weekly to catch regressions early

---

## Migration to New Projects

1. Copy `lib/evals/framework/` folder
2. Create domain-specific test suite
3. Define your `engineering` and `design` criteria
4. Write 20-30 initial test cases
5. Run evals, iterate on prompts
6. Track results over time

**Time to set up:** 1-2 hours per new project
**Time saved:** Weeks of manual testing and debugging

---

## Next Steps

- **CI/CD**: Run evals on every commit
- **LLM-as-Judge**: Use GPT-4 to score design criteria
- **A/B Testing**: Compare multiple agent configurations
- **Google Sheets**: Export results for team collaboration

---

**Questions?** Check the calendar implementation in this repo for a complete example.
