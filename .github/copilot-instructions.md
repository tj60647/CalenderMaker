# GitHub Copilot Instructions for Calendar Maker

AI-powered calendar generator using Next.js, TypeScript, Material-UI, and OpenRouter.

**Key Architecture**: Repository pattern for easy localStorage → Supabase migration.

---

---

## Required Patterns

### 1. File Headers

```typescript
/**
 * [Component Name]
 * 
 * [Brief description]
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created YYYY-MM-DD
 */
```

### 2. TSDoc for All Functions

Document **all functions** (not just exports) - this code will be read by beginners:

```typescript
/**
 * Save a calendar note to storage
 * 
 * This validates the note, generates IDs/timestamps, and saves using
 * the repository pattern so it works with both localStorage and Supabase.
 * 
 * @param note - The note to save (without id/timestamps)
 * @param userId - ID of the user who owns this note
 * @returns The saved note with generated id and timestamps
 * @throws {ValidationError} If note is missing required fields
 */
export async function saveNote(note: Omit<CalendarNote, 'id'>, userId: string): Promise<CalendarNote> {
  // ...
}

/**
 * Validate that a note has all required fields
 * 
 * @param note - Note to validate
 * @returns true if valid, false otherwise
 */
function validateNote(note: Partial<CalendarNote>): boolean {
  // ...
}
```

### 3. Beginner-Friendly Comments

Explain **WHY** and **HOW**, not just WHAT. Target: 1-2 years experience.

```typescript
// ✅ GOOD
// Step 1: Find Sunday before start date
// getDay() returns 0-6 where 0 is Sunday
const firstSunday = new Date(startDate);
firstSunday.setDate(startDate.getDate() - startDate.getDay());

// ❌ BAD
// Get first Sunday
const firstSunday = new Date(startDate);
firstSunday.setDate(startDate.getDate() - startDate.getDay());
```

### 4. Repository Pattern (CRITICAL)

**Never** access localStorage/Supabase directly. Always use repositories:

```typescript
// ✅ CORRECT
import { notesRepo } from '@/lib/repositories';
const notes = await notesRepo.getAll(userId);

// ❌ NEVER DO THIS
localStorage.getItem('calendar_notes');
```

### 5. Data Models (Supabase-Ready)

All models must include these fields (even with localStorage):

```typescript
interface CalendarNote {
  id: string;              // UUID
  user_id: string;         // Auth user ID
  date: string;            // ISO: "2026-01-08"
  notes: string;
  color?: string;          // Hex: "#ff0000"
  category?: string;
  time?: string;           // "14:00"
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

### 6. Material-UI Only

Use Material-UI components with `sx` prop for styling:

```typescript
import { Box, Button } from '@mui/material';

<Box sx={{ display: 'flex', gap: 2, p: 3 }}>
  <Button variant="contained">Save</Button>
</Box>
```

### 7. Type Safety

- No `any` types
- Every parameter and return value typed
- Use `unknown` instead of `any` when needed

### 8. Error Handling

Always use try-catch with user-friendly messages:

```typescript
try {
  await notesRepo.create(note, userId);
} catch (error) {
  console.error('Failed to save:', error);
  return { success: false, error: 'Could not save. Please try again.' };
}
```

---

## Code Organization

```typescript
/**
 * File header
 */

// 1. Imports (React → libraries → local)
// 2. Types & interfaces
// 3. Constants
// 4. Main component/function
// 5. Helper functions
// 6. Exports
```

React components:

```typescript
export function MyComponent() {
  // Hooks
  // State
  // Effects
  // Event handlers
  // Early returns (loading, error)
  // Main render
}
```

---

## Key Rules Summary

1. ✅ File headers with @author Thomas J McLeish
2. ✅ TSDoc **all functions** (for beginners learning the code)
3. ✅ Explain WHY in comments (target: beginners)
4. ✅ Use repository pattern (never direct storage)
5. ✅ Match Supabase schema (id, user_id, timestamps)
6. ✅ Material-UI with sx prop
7. ✅ No `any` types
8. ✅ Try-catch with friendly errors

**Remember**: Beginners will read this code to learn. Over-document rather than under-document.

**Migration Goal**: Swap localStorage for Supabase by changing ONE line of code.
