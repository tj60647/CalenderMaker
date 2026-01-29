/**
 * Chat Agent Logic
 * 
 * Core agent loop that handles OpenRouter API calls and tool execution.
 * Decoupled from Next.js request handling to allow for testing/evals.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-26
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Tool definitions for OpenRouter
 * These tell the AI what tools are available and how to use them.
 */
export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_calendar',
      description: 'Search for calendar notes within a date range. Use this to check what events exist before adding/modifying/deleting notes.',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date in ISO format (YYYY-MM-DD)',
          },
          endDate: {
            type: 'string',
            description: 'End date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_week_notes',
      description: 'Get all notes for a calendar week (Sunday-Saturday) containing the specified date. Use this when user mentions "week of" a date.',
      parameters: {
        type: 'object',
        properties: {
          dateInWeek: {
            type: 'string',
            description: 'Any date in the desired week (YYYY-MM-DD)',
          },
        },
        required: ['dateInWeek'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_by_keyword',
      description: 'Search notes by keyword (case-insensitive). Use this to find notes about specific topics.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Text to search for in notes',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_date_notes',
      description: 'Get all notes for a specific date. Use this to check what\'s scheduled on a particular day.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['date'],
      },
    },
  },
];

interface RunAgentParams {
  messages: ChatMessage[];
  apiKey: string;
  model: string;
  systemPrompt: string;
  toolExecutor: (name: string, args: Record<string, unknown>) => Promise<string>;
  requestId?: string;
  maxLoops?: number;
  onProgress?: (status: string) => void;
}

interface AgentResponse {
  message: string;
  toolCalls: { name: string; args: any; result: any }[];
  rawResponse: any;
}

/**
 * Run the ReAct agent loop
 */
export async function runAgent({
  messages,
  apiKey,
  model,
  systemPrompt,
  toolExecutor,
  requestId = 'unknown',
  maxLoops = 5,
  onProgress
}: RunAgentParams): Promise<AgentResponse> {
  
  const currentMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages
  ];

  const allToolCalls: { name: string; args: any; result: any }[] = [];
  let loopCount = 0;

  while (loopCount < maxLoops) {
    loopCount++;
    console.log(`[${requestId}] Loop ${loopCount}/${maxLoops}`);
    
    if (loopCount > 1 && onProgress) {
        onProgress(`Thinking (Step ${loopCount})...`);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AI Calendar Generator',
      },
      body: JSON.stringify({
        model: model,
        messages: currentMessages,
        temperature: 0,
        response_format: { type: 'json_object' },
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message;

    if (!assistantMessage) {
        throw new Error('No message in response from OpenRouter');
    }

    // Check for tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        currentMessages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
        });

        for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
                console.error(`[${requestId}] Failed to parse args for ${toolName}`);
            }

            console.log(`[${requestId}] Executing tool: ${toolName}`);
            
            if (onProgress) {
                // Determine a user-friendly status message based on the tool
                let statusMsg = `Using tool: ${toolName}...`;
                if (toolName === 'search_calendar') statusMsg = 'Checking your calendar...';
                if (toolName === 'get_week_notes') statusMsg = 'Reading this week\'s schedule...';
                if (toolName === 'search_by_keyword') statusMsg = 'Searching specific events...';
                
                onProgress(statusMsg);
            }

            const result = await toolExecutor(toolName, args);

            allToolCalls.push({ name: toolName, args, result: JSON.parse(result) });

            currentMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result,
            });
        }
    } else {
        // Final response
        console.log(`[${requestId}] Agent finished. Returning response.`);
        return {
            message: assistantMessage.content,
            toolCalls: allToolCalls,
            rawResponse: data
        };
    }
  }

  throw new Error(`Agent exceeded max loops (${maxLoops})`);
}
