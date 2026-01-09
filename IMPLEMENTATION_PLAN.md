# Interactive Calendar Generator - Implementation Plan

## Project Overview
Transform a static React calendar into an AI-powered interactive calendar generator with:
- Conversational interface for adding details to dates
- OpenRouter AI integration
- Local storage persistence
- TypeScript
- Vercel deployment

---

## Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5+ with Lucide React icons
- **Authentication**: NextAuth.js (simple email/password, Supabase-ready)
- **AI Provider**: OpenRouter API (with model selection)
- **Storage**: localStorage → Supabase (abstracted via repository pattern)
- **Export Formats**: SVG + PNG
- **Deployment**: Vercel

### Key Components
1. Calendar Grid Component
2. Date Detail Panel
3. Chat Interface Component (MUI)
4. AI Integration Service with Model Selector
5. **Storage Repository Layer** (localStorage → Supabase-ready)
6. **Simple Auth Layer** (NextAuth.js)
7. Export Utilities (SVG + PNG)
8. Color Customization Panel

---

## Feature Specifications

### 1. Interactive Calendar
- **Dynamic Date Range**: Allow users to select start/end dates
- **Customizable Color Coding**: User can customize colors for:
  - Weekends
  - Month 1 / Month 2
  - Special days/holidays
  - Individual dates
  - Categories (work, personal, holidays, etc.)
- **Click to Select**: Click dates to view/edit details
- **Hover States**: Show preview of notes on hover with MUI Tooltip
- **Visual Indicators**: Badge/dot on dates with notes
- **Color Picker**: Material-UI color picker for customization

### 2. Conversational Interface
- **Chat Panel**: Side panel or modal for AI conversation
- **Natural Language Input**: 
  - "Add dentist appointment on Nov 20 at 2pm"
  - "Mark Nov 25-27 as vacation"
  - "What's on December 5?"
- **AI Understanding**: Parse dates, times, and event details
- **Confirmation**: Show parsed info before saving
- **Edit/Delete**: Conversational commands to modify existing notes

### 3. Data Model
```typescript
interface DateNote {
  date: string; // ISO format: "2025-11-16"
  notes: string; // Main note content
  color?: string; // Optional custom color
  category?: string; // e.g., "holiday", "meeting", "personal"
  time?: string; // Optional time
  createdAt: string;
  updatedAt: string;
}

interface ColorScheme {
  weekend: string;
  month1: string;
  month2: string;
  outOfRange: string;
  specialDays: Record<string, string>; // date -> color
  categories: Record<string, string>; // category -> color
}

interface CalendarConfig {
  startDate: string;
  endDate: string;
  title: string;
  specialDates?: Record<string, string>; // date -> label
  colorScheme: ColorScheme;
  selectedModel: string; // OpenRouter model ID
}
```

### 4. OpenRouter Integration
- **API Endpoint**: `/api/chat` (Next.js API route)
- **Model Selection**: Dropdown to choose from premium models:
  - OpenAI: GPT-5.2, GPT-5.2-Pro, GPT-5.1
  - Anthropic: Claude Opus 4.5, Claude Sonnet 3.5
  - Google: Gemini 3 Pro, Gemini 3 Flash
- **Default Model**: `anthropic/claude-opus-4.5`
- **System Prompt**: Train to understand calendar operations
- **Structured Output**: Parse AI responses for date operations
- **Rate Limiting**: Consider implementing basic rate limits
- **Model Info Display**: Show pricing and capabilities for selected model

### 5. Authentication (Simple, Supabase-Ready)

**Phase 1 (MVP - LocalStorage)**:
- NextAuth.js with Credentials provider
- Simple email/password (stored in localStorage)
- No actual security - just user identification
- Auto-login for single user

**Phase 2 (Future - Supabase)**:
- Switch NextAuth to Supabase provider
- Real authentication
- Zero code changes in components (thanks to abstraction)

```typescript
// NextAuth config (easy to swap providers)
export const authOptions = {
  providers: [
    // Phase 1: Local
    CredentialsProvider({ /* localStorage */ }),
    
    // Phase 2: Uncomment when ready
    // SupabaseProvider({ /* real auth */ })
  ]
};
```

### 6. Storage Architecture (Supabase-Ready)

**Repository Pattern** - Abstract storage so switching to Supabase is trivial:

```typescript
// lib/repositories/base.repository.ts
interface IRepository<T> {
  getAll(userId: string): Promise<T[]>;
  getById(id: string, userId: string): Promise<T | null>;
  create(data: T, userId: string): Promise<T>;
  update(id: string, data: Partial<T>, userId: string): Promise<T>;
  delete(id: string, userId: string): Promise<void>;
}

// Phase 1: LocalStorage implementation
class LocalStorageRepository<T> implements IRepository<T> {
  // Uses localStorage, but API matches Supabase
}

// Phase 2: Supabase implementation (future)
class SupabaseRepository<T> implements IRepository<T> {
  // Same interface, different backend
  // Just swap the class, everything else works!
}
```

**Data Structure (matches Supabase schema)**:
```typescript
// This structure works for both localStorage AND Supabase
interface CalendarNote {
  id: string;              // UUID (generate in browser for now)
  user_id: string;         // Auth user ID
  date: string;            // ISO date
  notes: string;
  color?: string;
  category?: string;
  time?: string;
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}

interface CalendarConfig {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  title: string;
  color_scheme: ColorScheme; // JSON field
  selected_model: string;
  created_at: string;
  updated_at: string;
}
```

### 7. Local Storage Strategy (Phase 1)
```typescript
// Storage keys (structured like Supabase tables)
- "calendar_notes": CalendarNote[]       // Array, not object (like DB)
- "calendar_config": CalendarConfig      // Single config per user
- "chat_history": ChatMessage[]         // Array
- "color_presets": ColorScheme[]        // Saved themes
- "current_user": { id: string, email: string } // Auth state

// All operations use repository pattern
// Auto-save on every change
// Export/Import functionality for backup
```

### 6. Export Functionality
- **SVG Export**: Vector format, scalable, editable
  - Generate SVG with all notes visible
  - Option to include/exclude notes in export
  - Maintain 16:9 aspect ratio
- **PNG Export**: Raster format for easy sharing
  - Convert calendar to PNG using html2canvas or similar
  - High resolution (2x or 3x for retina)
  - Configurable dimensions
- **Export Options Dialog**:
  - Choose format (SVG/PNG)
  - Include/exclude notes
  - Resolution (PNG only)
  - Custom dimensions
- **Legend**: Include color coding legend in exports

---

## Project Structure

```
calendar-maker/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth.js config
│   │   ├── chat/
│   │   │   └── route.ts          # OpenRouter API integration
│   │   └── models/
│   │       └── route.ts          # Get available models
│   ├── login/
│   │   └── page.tsx              # Simple login page (optional)
│   ├── layout.tsx                 # Root layout with MUI theme
│   ├── page.tsx                   # Main calendar page
│   └── globals.css                # Global styles (minimal)
├── components/
│   ├── Calendar.tsx               # Main calendar grid (MUI Grid)
│   ├── DateCell.tsx               # Individual date cell (MUI Card)
│   ├── ChatPanel.tsx              # AI chat interface (MUI)
│   ├── DateDetailPanel.tsx        # Date notes viewer/editor (MUI Dialog)
│   ├── CalendarConfig.tsx         # Date range selector (MUI DatePicker)
│   ├── ColorCustomizer.tsx        # Color customization panel (MUI)
│   ├── ModelSelector.tsx          # OpenRouter model dropdown (MUI Select)
│   ├── ExportDialog.tsx           # Export options (SVG/PNG)
│   └── AuthGuard.tsx              # Simple auth wrapper
├── lib/
│   ├── auth.ts                    # Auth utilities
│   ├── repositories/
│   │   ├── base.repository.ts    # Repository interface
│   │   ├── localStorage.repository.ts  # Phase 1 implementation
│   │   ├── notes.repository.ts   # Notes-specific logic
│   │   └── config.repository.ts  # Config-specific logic
│   ├── storage.ts                 # Low-level storage (used by repos)
│   ├── calendar-utils.ts          # Date calculations
│   ├── ai-parser.ts               # Parse AI responses
│   ├── svg-generator.ts           # SVG export logic
│   ├── png-generator.ts           # PNG export logic
│   └── openrouter-models.ts       # Model definitions
├── types/
│   └── index.ts                   # TypeScript interfaces
├── theme/
│   └── theme.ts                   # MUI theme configuration
├── .env.local                     # Environment variables
├── next.config.js
└── package.json
```

---

## Implementation Phases

### Phase 1: Project Setup (45 min)
- [ ] Initialize Next.js with TypeScript
- [ ] Install dependencies:
  - @mui/material @mui/icons-material @emotion/react @emotion/styled
  - next-auth (authentication)
  - lucide-react (for additional icons)
  - date-fns (date utilities)
  - html2canvas (PNG export)
  - react-colorful or @mui/x-color-picker (color picker)
  - uuid (for generating IDs)
- [ ] Set up MUI theme provider
- [ ] Create basic project structure
- [ ] Load OpenRouter models data
- [ ] Set up NextAuth.js with simple local provider

### Phase 2: Calendar Core (1-2 hours)
- [ ] Port existing calendar component to TypeScript
- [ ] Add date selection functionality
- [ ] Implement dynamic date range
- [ ] Create date cell component with note indicators
- [ ] Add hover previews

### Phase 3: Storage Layer with Repository Pattern (1 hour)
- [ ] Create repository interface (IRepository)
- [ ] Implement LocalStorageRepository class
- [ ] Create NotesRepository and ConfigRepository
- [ ] Add userId to all operations (ready for multi-user)
- [ ] Implement CRUD operations
- [ ] Add auto-save functionality
- [ ] Create export/import for backup
- [ ] Test with mock userId

### Phase 4: AI Integration (1-2 hours)
- [ ] Set up OpenRouter API route
- [ ] Create chat interface component
- [ ] Implement AI prompt engineering for calendar ops
- [ ] Parse AI responses for structured data
- [ ] Add error handling and fallbacks

### Phase 5: Chat Interface (1 hour)
- [ ] Build chat UI component
- [ ] Add message history
- [ ] Implement streaming responses (optional)
- [ ] Add quick action buttons
- [ ] Show loading states

### Phase 6: Export Functionality (1 hour)
- [ ] Update SVG generator to include notes and custom colors
- [ ] Implement PNG export using html2canvas
- [ ] Build export dialog with options
- [ ] Add resolution/dimension controls
- [ ] Test different date ranges and formats

### Phase 7: Color Customization (45 min)
- [ ] Build color customizer panel with MUI
- [ ] Add color pickers for all elements
- [ ] Create color preset system (save/load themes)
- [ ] Apply colors in real-time to calendar
- [ ] Include color legend in exports

### Phase 8: Model Selection (30 min)
- [ ] Parse OpenRouter models JSON
- [ ] Filter to premium models (OpenAI, Anthropic, Google)
- [ ] Build model selector dropdown with info
- [ ] Display pricing and context length
- [ ] Save selected model to config

### Phase 9: Polish & Deploy (1 hour)
- [ ] Responsive design tweaks
- [ ] Error boundaries
- [ ] Loading states
- [ ] Environment variable setup
- [ ] Vercel deployment configuration
- [ ] Test production build

---

## Environment Variables

```env
# .env.local
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your Vercel URL
```

---

## OpenRouter Setup

1. Sign up at https://openrouter.ai/
2. Get API key from dashboard
3. Choose model (recommended: `anthropic/claude-3.5-sonnet`)
4. Set up billing (pay-per-use)

**Estimated Costs**: ~$0.003 per message (Claude Sonnet)

---

## AI System Prompt Strategy

```typescript
const systemPrompt = `You are a helpful calendar assistant. Users will ask you to:
1. Add events/notes to specific dates
2. Query what's on certain dates
3. Update or delete existing notes
4. Understand natural language date references

Parse their requests and respond with structured JSON:
{
  "action": "add" | "update" | "delete" | "query",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD" (optional, for ranges),
  "content": "event description",
  "time": "HH:MM" (optional),
  "category": "meeting" | "holiday" | "personal" | "other"
}

Also provide a friendly confirmation message.`;
```

---

## User Flow Examples

### Example 1: Adding an Event
```
User: "Add dentist appointment on November 20 at 2pm"
AI: "I'll add a dentist appointment on November 20, 2025 at 2:00 PM."
    [Structured data sent to app]
App: Updates calendar, shows note on Nov 20
```

### Example 2: Querying Dates
```
User: "What's happening the week of Thanksgiving?"
AI: "Let me check November 25-27, 2025..."
    [Queries stored notes]
    "You have marked Nov 25-27 as Thanksgiving week."
```

### Example 3: Bulk Operations
```
User: "Mark all weekends in December as relaxation time"
AI: "I'll add 'relaxation time' to all Saturdays and Sundays in December 2025."
    [Multiple date updates]
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables set in Vercel dashboard
- [ ] Test OpenRouter API connection
- [ ] Test localStorage in production build
- [ ] Verify responsive design on mobile
- [ ] Add error boundaries
- [ ] Test SVG export with various data

### Vercel Configuration
```json
// vercel.json (optional)
{
  "env": {
    "OPENROUTER_API_KEY": "@openrouter-api-key"
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### Post-Deployment
- [ ] Test all features in production
- [ ] Verify API routes work
- [ ] Test on different browsers
- [ ] Check mobile experience
- [ ] Monitor OpenRouter API usage

---

## Migration to Supabase (Future - Easy!)

When ready to move to Supabase, here's what changes:

### 1. Create Supabase Tables (5 min)
```sql
-- Run in Supabase SQL editor
create table calendar_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  date date not null,
  notes text,
  color text,
  category text,
  time text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table calendar_configs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  start_date date not null,
  end_date date not null,
  title text,
  color_scheme jsonb,
  selected_model text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Row Level Security
alter table calendar_notes enable row level security;
alter table calendar_configs enable row level security;

create policy "Users can only access their own notes"
  on calendar_notes for all
  using (auth.uid() = user_id);

create policy "Users can only access their own config"
  on calendar_configs for all
  using (auth.uid() = user_id);
```

### 2. Install Supabase (2 min)
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 3. Create Supabase Repository (30 min)
```typescript
// lib/repositories/supabase.repository.ts
import { createClient } from '@supabase/supabase-js';

class SupabaseRepository<T> implements IRepository<T> {
  // Same interface as LocalStorageRepository!
  // Just uses Supabase client instead
}
```

### 4. Switch Auth Provider (5 min)
```typescript
// app/api/auth/[...nextauth]/route.ts
// Comment out CredentialsProvider
// Uncomment SupabaseProvider
// That's it!
```

### 5. Update Repository Factory (2 min)
```typescript
// lib/repositories/index.ts
export function getRepository<T>(table: string) {
  // Before: return new LocalStorageRepository<T>(table);
  return new SupabaseRepository<T>(table); // One line change!
}
```

**Total Migration Time**: ~1-2 hours
**Code Changes Required**: Minimal - just swap implementations!

---

## Future Enhancements (Post-MVP)

1. **Multiple Calendars**: Create/manage multiple calendar instances
2. **Cloud Sync**: Optional backend for cross-device sync
3. **Sharing**: Export as shareable links
4. **Templates**: Pre-made calendar templates
5. **Recurring Events**: AI understands "every Monday"
6. **Image Upload**: Attach images to dates
7. **PDF Export**: In addition to SVG
8. **Dark Mode**: Theme support
9. **Calendar Views**: Month, week, agenda views
10. **Integrations**: Import from Google Calendar, etc.

---

## Potential Challenges & Solutions

### Challenge 1: AI Parsing Accuracy
- **Issue**: AI might misunderstand dates
- **Solution**: Show parsed data for user confirmation before saving

### Challenge 2: localStorage Limits
- **Issue**: 5-10MB browser storage limit
- **Solution**: Implement data compression, warn at 80% capacity

### Challenge 3: Cross-Browser Compatibility
- **Issue**: Different localStorage implementations
- **Solution**: Use try-catch, provide fallback

### Challenge 4: API Rate Limits
- **Issue**: Too many AI requests
- **Solution**: Debounce requests, cache responses

### Challenge 5: SVG Size with Many Notes
- **Issue**: SVG becomes large with lots of text
- **Solution**: Truncate notes in export, provide full version option

---

## Testing Strategy

1. **Unit Tests**: Utility functions (date parsing, storage)
2. **Component Tests**: Calendar interactions
3. **Integration Tests**: AI → Storage → UI flow
4. **Manual Tests**: 
   - Add notes via chat
   - Edit existing notes
   - Delete notes
   - Export SVG
   - Refresh page (persistence test)
   - Different date ranges

---

## Coding Standards for Implementation

**All generated code MUST follow these rules:**

### 1. File Headers
Every file must include a header comment:
```typescript
/**
 * [Component/Module Name]
 * 
 * [Brief description of what this file does]
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created [YYYY-MM-DD]
 */
```

### 2. TSDoc Comments
All exported functions, classes, interfaces, and types must have TSDoc:
```typescript
/**
 * [Brief description]
 * 
 * [Detailed explanation if needed]
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * ```typescript
 * // Usage example
 * ```
 */
```

### 3. Beginner-Friendly Comments
- Explain complex logic in plain English
- Comment WHY, not just WHAT
- Break down multi-step operations
- Explain magic numbers and constants
- Reference documentation for non-obvious patterns

### 4. Type Safety
- Every function parameter and return value must be typed
- No `any` types unless absolutely necessary (document why)
- Use interfaces for object shapes
- Use enums for fixed sets of values

### 5. Code Organization
```typescript
// File structure:
// 1. Imports (grouped: React, libraries, local)
// 2. Types/Interfaces
// 3. Constants
// 4. Main component/function
// 5. Helper functions (with TSDoc)
// 6. Exports
```

---

## Success Criteria

✅ User can create a calendar with custom date range
✅ User can add notes via conversational interface
✅ Notes persist across page refreshes
✅ Calendar displays notes visually
✅ User can export calendar as SVG and PNG
✅ Application deploys successfully to Vercel
✅ AI correctly parses 90%+ of common date requests
✅ Responsive design works on mobile
✅ Code follows all standards (headers, TSDoc, comments)
✅ Repository pattern enables easy Supabase migration

---

## Estimated Timeline

- **Setup + Auth**: 45 minutes
- **Repository Pattern**: 1 hour
- **Core Calendar**: 2 hours
- **AI Integration**: 2 hours
- **Chat Interface**: 1 hour
- **Export (SVG + PNG)**: 1 hour
- **Color Customization**: 45 minutes
- **Model Selection**: 30 minutes
- **Polish & Deploy**: 1 hour
- **Total**: ~10-11 hours for MVP
- **Future Supabase Migration**: 1-2 hours (thanks to abstraction!)

---

## Next Steps

1. **Review this plan** - Provide feedback or approval
2. **Get OpenRouter API key** - Sign up and get credentials
3. **Begin implementation** - Start with Phase 1
4. **Iterate based on testing** - Adjust as needed

---

## Questions to Consider

1. ~~**Model Choice**: Which OpenRouter model?~~ ✅ User can select from dropdown
2. **Cost Limits**: Should we implement usage caps per session?
3. **Date Range**: Should users create multiple calendars or just one?
4. **Privacy**: Any concerns with AI processing calendar data?
5. **Default Colors**: Keep existing blue/magenta scheme as default?
6. **PNG Resolution**: What default resolution for PNG exports? (2x? 3x?)
7. **Color Presets**: Should we include pre-made color themes?

---

**Ready to proceed?** Let me know if you want to adjust anything in this plan, or if you're ready to start implementation!

---

## Premium OpenRouter Models (Available for Selection)

Based on your OpenRouter models data, here are the high-quality models we'll include:

### OpenAI Models
- **GPT-5.2-Pro** (`openai/gpt-5.2-pro`) - Most advanced, best for complex reasoning
- **GPT-5.2** (`openai/gpt-5.2`) - Balanced performance
- **GPT-5.1** (`openai/gpt-5.1`) - Fast and reliable
- **GPT-5.1-Codex-Max** (`openai/gpt-5.1-codex-max`) - Optimized for coding tasks

### Anthropic Models  
- **Claude Sonnet 4.5** (`anthropic/claude-sonnet-4.5`) - 1M context, best for coding **(Recommended Default)**
- **Claude Opus 4.5** (`anthropic/claude-opus-4.5`) - Frontier reasoning model
- **Claude Sonnet 3.5** - Fast and efficient

### Google Models
- **Gemini 3 Pro** (`google/gemini-3-pro-preview`) - 1M token context, multimodal
- **Gemini 3 Flash** (`google/gemini-3-flash-preview`) - Fast responses

**Default selection**: Claude Sonnet 4.5 for optimal coding performance, massive context window (1M tokens), and better value.
