/**
 * AI Action Parser
 * 
 * Parses AI responses to extract calendar actions (add/update/delete notes).
 * Uses structured JSON responses from the AI to make database changes.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

/**
 * Types of actions the AI can perform
 */
export type ActionType = 'add' | 'update' | 'delete' | 'none';

/**
 * Parsed action from AI response
 */
export interface CalendarAction {
  type: ActionType;
  date?: string;           // ISO date: "2026-01-15"
  notes?: string;
  category?: string;
  color?: string;
  time?: string;
  duration?: number;       // Duration in minutes (e.g., 60 for 1 hour)
  noteId?: string;         // For update/delete operations
}

/**
 * AI response with actions
 */
export interface AIResponse {
  message: string;         // Human-readable response
  actions: CalendarAction[]; // Actions to perform
}

/**
 * Parse AI response to extract calendar actions
 * 
 * The AI returns a JSON response with message and actions array:
 * ```json
 * {
 *   "message": "I'll add that for you!",
 *   "actions": [{"type":"add","date":"2026-01-15","notes":"Dentist"}]
 * }
 * ```
 * 
 * @param aiMessage - Raw JSON string from AI
 * @returns Parsed response with message and actions
 */
export function parseAIResponse(aiMessage: string): AIResponse {
  console.log('[AI Actions Parser] ===== RAW AI MESSAGE =====');
  console.log(aiMessage);
  console.log('[AI Actions Parser] ===== END RAW MESSAGE =====');

  try {
    // Parse the JSON response
    const parsed = JSON.parse(aiMessage);
    
    console.log('[AI Actions Parser] Parsed JSON:', {
      hasMessage: !!parsed.message,
      hasActions: !!parsed.actions,
      actionCount: Array.isArray(parsed.actions) ? parsed.actions.length : 0
    });

    // Validate structure
    if (typeof parsed.message !== 'string') {
      throw new Error('Response missing "message" field');
    }

    if (!Array.isArray(parsed.actions)) {
      throw new Error('Response missing "actions" array');
    }

    // Validate and collect actions
    const validActions: CalendarAction[] = [];
    for (let i = 0; i < parsed.actions.length; i++) {
      const action = parsed.actions[i];
      console.log(`[AI Actions Parser] Validating action ${i + 1}:`, action);
      
      if (isValidAction(action)) {
        validActions.push(action);
        console.log(`[AI Actions Parser] Action ${i + 1} is valid`);
      } else {
        console.error(`[AI Actions Parser] Action ${i + 1} failed validation:`, action);
      }
    }

    console.log('[AI Actions Parser] Final result:', {
      messageLength: parsed.message.length,
      actionCount: validActions.length,
      actions: validActions
    });

    return {
      message: parsed.message,
      actions: validActions
    };
  } catch (error) {
    console.error('[AI Actions Parser] Failed to parse JSON response:', {
      error: error instanceof Error ? error.message : String(error),
      rawMessage: aiMessage.substring(0, 200)
    });
    
    // Fallback: return the raw message as-is
    return {
      message: aiMessage,
      actions: []
    };
  }
}

/**
 * Validate a calendar action has required fields
 * 
 * @param action - Action to validate
 * @returns true if valid, false otherwise
 */
export function isValidAction(action: CalendarAction): boolean {
  if (action.type === 'add') {
    return !!(action.date && action.notes);
  }
  
  if (action.type === 'update') {
    return !!(action.noteId && (action.date || action.notes || action.category || action.color || action.time));
  }
  
  if (action.type === 'delete') {
    return !!action.noteId;
  }
  
  return action.type === 'none';
}
