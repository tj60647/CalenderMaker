import * as fs from 'fs';
import * as path from 'path';

interface CalendarEvalCase {
  id: string;
  prompt: string;
  initialCalendar: any[];
  engineering?: {
    mustCallTools?: string[];
    mustNotCallTools?: string[];
    shouldAskClarification?: boolean;
    expectedActions?: any[];
  };
  design?: {
    notes?: string;
  };
  tags: string[];
}

function convert() {
  const jsonlPath = path.join(process.cwd(), 'evals/calendar-evals.jsonl');
  const content = fs.readFileSync(jsonlPath, 'utf-8');
  
  const cases: CalendarEvalCase[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  const yamlTests = cases.map(c => {
    const asserts = [];

    // Assertion: Helper function calls
    // Note: To check tool calls in promptfoo 'output', the provider needs to return them.
    // Our provider currently returns only 'message'.
    // We might need to adjust provider to return a JSON object with 'toolCalls' inside it 
    // OR Promptfoo usually validates the *LLM Output text*.
    // Since our agent returns a JSON response structure to the user:
    // { "message": "...", "actions": [...] }
    // We can assert on that JSON.
    
    // Check if output is valid JSON
    asserts.push({
      type: 'is-json',
      value: 'required: ["message", "actions"]' 
    });

    if (c.engineering?.shouldAskClarification) {
        // Simple heuristic: "actions" should be empty, message should contain "?"
        asserts.push({
            type: 'javascript',
            value: 'JSON.parse(output).actions.length === 0 && JSON.parse(output).message.includes("?")'
        });
    }

    if (c.engineering?.expectedActions && c.engineering.expectedActions.length > 0) {
        // Check if actions match expected count
        asserts.push({
            type: 'javascript',
            value: `JSON.parse(output).actions.length === ${c.engineering.expectedActions.length}`
        });
    }

    // Design Rubric (LLM-as-a-Judge)
    if (c.design?.notes) {
        asserts.push({
            type: 'llm-rubric',
            value: `The response must satisfy these design requirements: ${c.design.notes}`
        });
    }

    return {
      vars: {
        user_prompt: c.prompt,
        initial_calendar: c.initialCalendar,
        id: c.id
      },
      assert: asserts,
      tags: c.tags
    };
  });

  const fullConfig = {
    prompts: ["{{user_prompt}}"],
    providers: ["file://./provider.ts"],
    defaultTest: {
      options: {
        provider: {
            text: {
                id: 'timetwin-agent',
                config: {
                    // Env vars usually picked up automatically
                }
            }
        }
      }
    },
    tests: yamlTests
  };

  // Basic YAML stringify (simplified)
  // Ideally use 'js-yaml' but I don't want to install dependencies right now.
  // I'll output JSON for now, Promptfoo accepts json config too! 
  // Wait, I can just use JSON.stringify and save as promptfoo.json
  
  fs.writeFileSync(
    path.join(process.cwd(), 'evals/promptfoo.json'), 
    JSON.stringify(fullConfig, null, 2)
  );
  
  console.log('Created promptfoo.json');
}

convert();
