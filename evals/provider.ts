/**
 * Promptfoo Custom Provider
 * 
 * Mocks the database state (using test case vars) and runs the actual agent logic.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-26
 */

import { runAgent } from '../lib/chat-agent.ts';
import { SYSTEM_PROMPT_V1 } from '../lib/prompts/system-v1.ts';
import type { ProviderResponse, CallApiContext } from 'promptfoo';

// Mock types
interface CalendarNote {
  date: string;
  notes: string;
  category?: string;
  time?: string;
  duration?: number;
}

export default class TimeTwinProvider {
  constructor(options: any) {
    // Config if needed
  }

  id() {
    return 'timetwin-agent';
  }

  async callApi(prompt: string, context: CallApiContext): Promise<ProviderResponse> {
    const initialCalendar = (context.vars.initial_calendar || []) as CalendarNote[];
    const userPrompt = context.vars.user_prompt || prompt;

    // Mock Tool Executor
    const toolExecutor = async (name: string, args: any): Promise<string> => {
      console.log(`[MockTool] ${name}`, args);
      
      switch (name) {
        case 'get_date_notes': {
          const notes = initialCalendar.filter(n => n.date === args.date);
          return JSON.stringify({ notes });
        }
        case 'search_calendar': {
          const notes = initialCalendar.filter(n => 
            n.date >= args.startDate && n.date <= args.endDate
          );
          return JSON.stringify({ notes });
        }
        case 'get_week_notes': {
            // Simple approach: check if date is within +/- 3 days of requested date ?? 
            // "get_week_notes" args has "dateInWeek".
            // We need to calculate start/end of that week (Sunday-Saturday).
            // This logic allows the agent to see "Physics Lab" etc.
            
            const target = new Date(args.dateInWeek);
            const day = target.getDay(); // 0 (Sun) - 6 (Sat)
            
            const start = new Date(target);
            start.setDate(target.getDate() - day);
            const startStr = start.toISOString().split('T')[0];

            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const endStr = end.toISOString().split('T')[0];
            
            const notes = initialCalendar.filter(n => 
                n.date >= startStr && n.date <= endStr
            );
            return JSON.stringify(notes);
        }
        case 'search_by_keyword': {
          const check = (args.keyword as string).toLowerCase();
          const notes = initialCalendar.filter(n => 
            n.notes.toLowerCase().includes(check) || 
            (n.category && n.category.toLowerCase().includes(check))
          );
          return JSON.stringify({ notes });
        }
        default:
          return JSON.stringify({ error: `Unknown tool: ${name}` });
      }
    };

    try {
      if (!process.env.OPENROUTER_CALENDARMAKER_API_KEY) {
          throw new Error('OPENROUTER_CALENDARMAKER_API_KEY not set');
      }

      const result = await runAgent({
        messages: [{ role: 'user', content: userPrompt }],
        apiKey: process.env.OPENROUTER_CALENDARMAKER_API_KEY,
        model: 'openai/gpt-5.2-20251211',
        systemPrompt: SYSTEM_PROMPT_V1,
        toolExecutor: toolExecutor
      });

      return {
        output: result.message
      };

    } catch (err: unknown) {
      return {
        error: `Agent execution failed: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
}
