/**
 * AI Actions Parser Tests
 * 
 * Tests for parsing AI responses and extracting calendar actions.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { parseAIResponse, isValidAction, CalendarAction } from '@/lib/ai-actions';

describe('parseAIResponse', () => {
  test('extracts actions from response with [ACTIONS] block', () => {
    const aiMessage = JSON.stringify({
      message: "I'll add that dentist appointment for you!",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Dentist appointment","category":"personal"}
      ]
    });

    const result = parseAIResponse(aiMessage);

    expect(result.message).toBe("I'll add that dentist appointment for you!");
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toEqual({
      type: 'add',
      date: '2026-01-15',
      notes: 'Dentist appointment',
      category: 'personal',
    });
  });

  test('extracts multiple actions from single response', () => {
    const aiMessage = JSON.stringify({
      message: "I'll add both appointments!",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Dentist","category":"personal"},
        {"type":"add","date":"2026-01-16","notes":"Meeting","category":"work"}
      ]
    });

    const result = parseAIResponse(aiMessage);

    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].notes).toBe('Dentist');
    expect(result.actions[1].notes).toBe('Meeting');
  });

  test('returns empty actions array when no [ACTIONS] block', () => {
    const aiMessage = JSON.stringify({
      message: "Here's what you have on your calendar...",
      actions: []
    });

    const result = parseAIResponse(aiMessage);

    expect(result.message).toBe("Here's what you have on your calendar...");
    expect(result.actions).toHaveLength(0);
  });

  test('preserves markdown formatting in message', () => {
    const aiMessage = JSON.stringify({
      message: "I'll add that **dentist appointment** for you! ✨",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Dentist"}
      ]
    });

    const result = parseAIResponse(aiMessage);

    expect(result.message).toContain('**dentist appointment**');
    expect(result.message).toContain('✨');
  });

  test('filters out invalid actions', () => {
    const aiMessage = JSON.stringify({
      message: "Adding it now!",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Test"},
        {"type":"add","date":"2026-01-16"} // missing required 'notes' field
      ]
    });

    const result = parseAIResponse(aiMessage);

    // Should only include the valid action
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].notes).toBe('Test');
  });

  test('handles actions with optional fields', () => {
    const aiMessage = JSON.stringify({
      message: "Done!",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Meeting","time":"14:00","color":"#ff0000"}
      ]
    });

    const result = parseAIResponse(aiMessage);

    expect(result.actions[0]).toEqual({
      type: 'add',
      date: '2026-01-15',
      notes: 'Meeting',
      time: '14:00',
      color: '#ff0000',
    });
  });

  test('preserves newlines in message', () => {
    const aiMessage = JSON.stringify({
      message: "Message before\\n\\n\\n\\nMessage after",
      actions: [
        {"type":"add","date":"2026-01-15","notes":"Test"}
      ]
    });

    const result = parseAIResponse(aiMessage);

    expect(result.message).toBe('Message before\\n\\n\\n\\nMessage after');
  });
});

describe('isValidAction', () => {
  test('validates add action with required fields', () => {
    const action: CalendarAction = {
      type: 'add',
      date: '2026-01-15',
      notes: 'Dentist appointment',
    };

    expect(isValidAction(action)).toBe(true);
  });

  test('invalidates add action missing date', () => {
    const action: CalendarAction = {
      type: 'add',
      notes: 'Dentist appointment',
    };

    expect(isValidAction(action)).toBe(false);
  });

  test('invalidates add action missing notes', () => {
    const action: CalendarAction = {
      type: 'add',
      date: '2026-01-15',
    };

    expect(isValidAction(action)).toBe(false);
  });

  test('validates update action with noteId', () => {
    const action: CalendarAction = {
      type: 'update',
      noteId: 'test-note-123',
      notes: 'Updated notes',
    };

    expect(isValidAction(action)).toBe(true);
  });

  test('invalidates update action missing noteId', () => {
    const action: CalendarAction = {
      type: 'update',
      notes: 'Updated notes',
    };

    expect(isValidAction(action)).toBe(false);
  });

  test('validates delete action with noteId', () => {
    const action: CalendarAction = {
      type: 'delete',
      noteId: 'test-note-123',
    };

    expect(isValidAction(action)).toBe(true);
  });

  test('invalidates delete action missing noteId', () => {
    const action: CalendarAction = {
      type: 'delete',
    };

    expect(isValidAction(action)).toBe(false);
  });

  test('validates none action', () => {
    const action: CalendarAction = {
      type: 'none',
    };

    expect(isValidAction(action)).toBe(true);
  });

  test('validates add action with optional fields', () => {
    const action: CalendarAction = {
      type: 'add',
      date: '2026-01-15',
      notes: 'Meeting',
      category: 'work',
      color: '#ff0000',
      time: '14:00',
    };

    expect(isValidAction(action)).toBe(true);
  });

  test('validates update action with multiple field changes', () => {
    const action: CalendarAction = {
      type: 'update',
      noteId: 'test-note-123',
      date: '2026-01-16',
      notes: 'Updated',
      category: 'personal',
      time: '15:00',
    };

    expect(isValidAction(action)).toBe(true);
  });
});
