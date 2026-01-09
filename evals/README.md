# Calendar AI Evaluation Suite

Systematic testing framework for calendar AI behavior. Contains 30 curated test cases covering critical scenarios, edge cases, and conversational flows.

## Quick Start

### Run Engineering Evals (Automated)

```bash
npm test calendar-evals
```

**Results saved to:** `evals/results/YYYY-MM-DDTHH-mm-ss-runid/`

Each run creates:
- **metadata.json** - Full agent config, system prompt, git commit, environment
- **results.csv** - Per-test results (import to Google Sheets)
- **results.json** - Same data in JSON format
- **summary.txt** - Human-readable summary with pass rates

### View Test Cases

Open `evals/calendar-evals.jsonl` in VS Code with JSON syntax highlighting.

---

## Test Case Structure

Each line in `calendar-evals.jsonl` is a complete test case:

```jsonl
{
  "id": "week-understanding-1",
  "prompt": "what's the week of march 24 2026",
  "initialCalendar": [],
  "engineering": {
    "mustCallTools": ["get_week_notes"],
    "expectedWeekRange": {"start": "2026-03-22", "end": "2026-03-28"},
    "shouldAskClarification": false
  },
  "design": {
    "criteria": ["clarity", "transparency"],
    "notes": "Should explain Sun-Sat range clearly"
  },
  "tags": ["week-understanding", "tool-usage"]
}
```

### Fields

- **id**: Unique identifier (use kebab-case)
- **prompt**: User input to test
- **initialCalendar**: Array of notes to set up before test (optional)
- **engineering**: Automated assertions
  - `mustCallTools`: Tools AI should use (e.g., `get_week_notes`)
  - `mustNotCallTools`: Tools AI shouldn't use
  - `expectedActions`: Array of actions AI should generate
  - `expectedWeekRange`: For week tests, the Sun-Sat range
  - `shouldAskClarification`: true if AI should ask questions
- **design**: Manual review criteria
  - `criteria`: Dimensions to evaluate (tone, clarity, helpfulness, etc.)
  - `notes`: Guidance for human reviewers
- **tags**: For filtering/grouping tests

---

## Test Coverage (30 Cases)

### Week Understanding (3 cases)
- Parsing "week of [date]" as Sunday-Saturday
- Checking existing events in a week
- Handling "no class week of" requests

### Tool Usage (3 cases)
- When to check calendar before acting
- Conflict detection with existing events
- Query responses (what's on this date?)

### Conflict Detection (3 cases)
- Detecting time overlaps
- Multiple events on same day
- Recurring event conflicts

### Date Parsing (5 cases)
- Relative dates (tomorrow, next Tuesday)
- Various formats (3/24, March 24th)
- Ambiguous dates (Q1 2026)

### Clarification (3 cases)
- Ambiguous requests ("cancel my class" when multiple exist)
- Missing information (no date specified)
- Multiple interpretations

### Edge Cases (3 cases)
- Invalid dates (Feb 30)
- Past dates
- Far future dates

### Multi-Action (2 cases)
- Multiple events in one prompt
- Batch operations

### Categorization (2 cases)
- Inferring categories from context
- Missing required information

### Time/Duration (2 cases)
- Duration parsing (2 hours = 120 mins)
- Time format variations (noon, 2pm)

### Search (2 cases)
- Keyword search accuracy
- Semantic understanding

### Conversational (2 cases)
- Open-ended statements
- Empathy and proactivity

---

## Adding New Test Cases

### 1. Edit the JSONL File

Open `evals/calendar-evals.jsonl` and add a new line:

```jsonl
{"id":"your-test-id","prompt":"your test prompt","initialCalendar":[],"engineering":{"mustCallTools":[],"expectedActions":[],"shouldAskClarification":false},"design":{"criteria":["tone","clarity"],"notes":"What to look for"},"tags":["your-category"]}
```

**Tips:**
- Keep each line as a single JSON object (no line breaks within)
- Use descriptive IDs: `edge-invalid-time`, `conflict-double-booking`
- Tag appropriately for filtering: `tool-usage`, `date-parsing`, `edge-case`

### 2. Format for Readability

Use a JSON formatter in VS Code:
1. Copy the line
2. Paste into a new file
3. Format (Shift+Alt+F)
4. Copy back as single line

### 3. Run Tests

```bash
npm test calendar-evals
```

---

## Tracking Results Over Time

### Compare Runs

```bash
# List all runs
ls evals/results/

# Compare two runs
diff evals/results/2026-01-08T10-30-00-abc123/summary.txt \
     evals/results/2026-01-09T14-20-00-xyz789/summary.txt
```

### What's Tracked Per Run

**metadata.json:**
- Agent configuration (model, temperature, tools, max loops)
- **Full system prompt** (human readable) + hash
- Git commit + branch
- Node version, username, timestamp
- Test suite tags and total cases

**results.csv/json:**
- Per-test: ID, prompt, passed/failed, tools called, actions generated
- Execution time per test
- Error messages for failures
- Clarification behavior

### Detecting Changes

**System prompt changed?**
```bash
# Check hash in metadata.json
jq '.agent_config.system_prompt_hash' evals/results/*/metadata.json
```

**Performance regression?**
```bash
# Compare average times
jq '.test_suite.total_cases' evals/results/*/summary.txt
```

**Pass rate over time:**
Import all `results.csv` files to Google Sheets, create chart.

---

## Manual Design Review

For subjective evaluation (tone, helpfulness, clarity):

### Option 1: Manual Testing

1. Start dev server: `npm run dev`
2. Open app: http://localhost:3000
3. Test each prompt from the JSONL file
4. Score using design criteria (1-5 scale)

### Option 2: Export to Spreadsheet

```bash
# Copy JSONL content
cat evals/calendar-evals.jsonl

# Paste into JSON-to-CSV converter
# https://www.convertcsv.com/json-to-csv.htm

# Import CSV to Google Sheets
# Add columns: design_score_1, design_score_2, reviewer_notes
```

**Scoring Dimensions:**
- **Clarity** (1-5): Is the response easy to understand?
- **Tone** (1-5): Friendly and conversational?
- **Helpfulness** (1-5): Proactive without being pushy?
- **Transparency** (1-5): Explains what it's doing?
- **Accuracy** (1-5): Correct information and actions?

---

## Tracking Progress

### Current Status

Run this to see coverage:

```bash
npm test calendar-evals -- --verbose
```

Look for the coverage report at the end:

```
📊 Eval Coverage by Tag:
  date-parsing: 5 cases
  tool-usage: 8 cases
  conflict-detection: 6 cases
  ...
```

### Growing Your Eval Suite

**Add cases when:**
- You fix a bug → Regression test
- User reports issue → Coverage gap
- New feature → Happy path + edge cases
- Prompt changes → Verify no regressions

**Best practices:**
- Add 2-3 cases per bug fix
- Review monthly with team
- Aim for 50-100 cases within 6 months
- Tag consistently for easy filtering

---

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run AI Evals
  run: npm test calendar-evals
  env:
    OPENROUTER_CALENDARMAKER_API_KEY: ${{ secrets.OPENROUTER_KEY }}
```

**Note:** Evals will call the real OpenRouter API, which costs money. Consider:
- Mocking for most CI runs
- Running evals nightly instead of per-commit
- Using cheaper models for evals (gpt-4o-mini)

---

## Roadmap

### Current: Step 1 (Local JSONL)
- ✅ 30 test cases
- ✅ Jest engineering evals
- ✅ Manual design review workflow

### Future: Step 2 (Google Sheets Integration)
- Bidirectional sync (Sheets ↔ JSONL)
- Team collaboration with comments
- Automated scoring with LLM-as-judge

### Future: Step 3 (Advanced Analytics)
- Track pass rates over time
- Regression detection dashboard
- A/B testing different prompts

---

## Contributing

### Before Committing New Cases

1. Run tests: `npm test calendar-evals`
2. Ensure your case has descriptive `design.notes`
3. Tag appropriately
4. Add to coverage areas if creating new category

### Code Review Checklist

- [ ] ID is unique and descriptive
- [ ] Prompt is realistic (something a real user would say)
- [ ] Engineering criteria are specific and testable
- [ ] Design criteria are relevant
- [ ] Tags help with filtering/grouping
- [ ] Tests pass

---

## Questions?

- **"How do I test tool calling?"** → Mock the fetch in tests, capture tool_calls
- **"Can I test with real OpenRouter?"** → Yes, set `OPENROUTER_CALENDARMAKER_API_KEY` env var
- **"How do I score design criteria?"** → Manual review or LLM-as-judge (coming in Step 2)
- **"Can I filter to specific tags?"** → Edit test file to filter: `evalCases.filter(c => c.tags.includes('edge-case'))`

---

**Last Updated:** 2026-01-08
**Test Count:** 30 cases
**Coverage:** Week understanding, tool usage, conflict detection, date parsing, clarification, edge cases, multi-action, categorization, time/duration, search, conversational
