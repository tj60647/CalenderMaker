# Calendar Maker - Product Roadmap

**Last Updated:** 2026-01-28  
**Current Version:** 0.1.1 (Deployed Beta)  
**Status:** Live on Vercel / Beta Testing

---

## Vision

Transform calendar creation from a manual, design-heavy process into a conversational AI experience where users can build, customize, and export professional calendars through natural language.

**Target Users:**
- Content creators needing calendar graphics
- Teachers planning academic schedules
- Event planners organizing timelines
- Freelancers managing project schedules
- Anyone who needs a custom calendar view

---

## Product Phases

### Phase 0: MVP (Complete ✅)
**Status:** Launched January 2026  
**Goal:** Prove core concept with minimal features

**What's Done:**
- ✅ Interactive calendar grid (month view)
- ✅ AI chat interface (OpenRouter + Claude Opus 4.5)
- ✅ Natural language note creation
- ✅ Date detail panel (view/edit/delete)
- ✅ Export as SVG/PNG
- ✅ localStorage persistence
- ✅ Basic authentication (demo-level)
- ✅ AI evaluation framework (30 test cases)

**Success Metrics:**
- Core workflow functional
- AI understands 90% of date requests
- Export quality acceptable for sharing

---

## Phase 1: Production Hardening 🔨

**Timeline:** 2-3 weeks  
**Status:** Next up  
**Priority:** Critical for public launch

### 1.1 Documentation & Onboarding (Week 1)

**Goal:** Make project usable by external developers and users

**Tasks:**
- [x] Write comprehensive README.md ⚠️ **CRITICAL**
  - Product description and value proposition
  - Installation instructions
  - Environment variable setup
  - Demo credentials
  - Screenshots/GIF demo
  - License and attribution
  
- [ ] Create CONTRIBUTING.md
  - Code style guide
  - Branch naming conventions
  - PR process
  - Development setup
  
- [x] Add .env.example
  - Document all required variables
  - Add setup instructions
  
- [ ] Create deployment guide
  - Vercel setup
  - Environment configuration
  - Domain setup
  - Monitoring setup

**Success Metrics:**
- New developer can set up project in <10 minutes
- Users understand what app does from README
- Zero setup questions in issues

---

### 1.2 Error Handling & UX Polish (Week 1-2)

**Goal:** Professional user experience with graceful error handling

**Tasks:**
- [ ] Add Material-UI Snackbar notifications
  - Success messages (note saved, calendar updated)
  - Error messages (network failure, invalid date)
  - Warning messages (approaching localStorage limit)
  - Info messages (AI is thinking, export started)
  
- [ ] Implement loading states
  - Calendar loading skeleton
  - Chat message loading animation
  - Export progress indicator
  - "AI is typing" indicator
  
- [ ] Add error boundaries
  - Wrap calendar component
  - Wrap chat interface
  - Wrap export utilities
  - Friendly error fallback UI
  
- [ ] Input validation
  - Date field validation
  - Note length limits (2000 chars)
  - Category name validation
  - Color hex format validation

**Success Metrics:**
- No silent failures
- Users understand what went wrong
- Clear next steps on errors
- Zero confusion about app state

---

### 1.3 Testing & Quality (Week 2-3)

**Goal:** Increase test coverage to 50%+ and fix known issues

**Tasks:**
- [ ] Fix Jest type errors ⚠️ **BLOCKING**
  - [jest.setup.ts](jest.setup.ts) has 3 type errors
  - Blocks clean TypeScript builds
  - Solution: Proper type casting or jest-fetch-mock
  
- [ ] Test export utilities (currently 0%)
  - Test SVG generation
  - Test PNG rendering
  - Test date formatting
  - Mock canvas/DOM APIs
  
- [ ] Complete API route tests
  - Mock OpenRouter responses
  - Test tool execution
  - Test error handling
  - Test rate limiting (when added)
  
- [ ] Add React component tests
  - Calendar component (date selection, navigation)
  - ChatInterface (send message, display history)
  - DateDetailPanel (CRUD operations)
  - Target: 50%+ component coverage

**Success Metrics:**
- All tests pass with no type errors
- Coverage >50% overall
- CI/CD pipeline green
- Confidence in refactoring

---

### 1.4 Security & Monitoring (Week 3)

**Goal:** Basic production security and observability

**Tasks:**
- [ ] Add rate limiting
  - 5 chat messages/minute per user
  - 10 calendar operations/minute per user
  - Use simple in-memory store (upgrade to Redis later)
  
- [ ] Input sanitization
  - Sanitize note content (DOMPurify)
  - Validate dates on server
  - Escape AI responses
  
- [ ] Add structured logging
  - Replace console.log with Winston
  - Add request IDs for tracing
  - Log levels (error, warn, info, debug)
  - Log to file in production
  
- [ ] Basic analytics
  - Track feature usage (chat, export, notes)
  - Track errors
  - Track AI response times
  - Use Vercel Analytics (free tier)

**Success Metrics:**
- No XSS vulnerabilities
- API costs under control
- Can diagnose production issues
- Understand user behavior

---

### 1.5 Deployment (Week 3)

**Goal:** Live production deployment on Vercel

**Tasks:**
- [ ] Set up Vercel project
  - Connect GitHub repo
  - Configure build settings
  - Set environment variables
  
- [ ] Configure custom domain (optional)
  - DNS setup
  - SSL certificate
  - WWW redirect
  
- [ ] Set up monitoring
  - Vercel Analytics
  - Error tracking (Sentry free tier)
  - Uptime monitoring (UptimeRobot)
  
- [ ] Create demo account
  - Pre-populated calendar
  - Sample notes
  - Demo in README

**Success Metrics:**
- App accessible at public URL
- Zero critical errors in first 24h
- <2s page load time
- 99%+ uptime

---

## Phase 2: Supabase Migration 🗄️

**Timeline:** 2-3 weeks  
**Status:** Planned  
**Priority:** High (required for multi-user scale)

### 2.1 Database Setup (Week 1)

**Goal:** Move from localStorage to Supabase PostgreSQL

**Tasks:**
- [ ] Create Supabase project
  - Free tier (sufficient for MVP)
  - Choose region (US East)
  
- [ ] Define database schema
  ```sql
  -- Already designed in types/index.ts
  CREATE TABLE calendar_notes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    date DATE NOT NULL,
    notes TEXT NOT NULL,
    category TEXT,
    color TEXT,
    time TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE TABLE calendar_configs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    color_scheme JSONB,
    selected_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
  
- [ ] Set up Row Level Security (RLS)
  - Users can only see their own notes
  - Users can only see their own configs
  
- [ ] Create indexes
  - Index on (user_id, date) for fast queries
  - Index on (user_id, category) for filtering

**Success Metrics:**
- Tables created successfully
- RLS policies working
- Can query from browser console

---

### 2.2 Repository Implementation (Week 2)

**Goal:** Swap localStorage for Supabase (ONE line change!)

**Tasks:**
- [ ] Create SupabaseRepository class
  - Implement INotesRepository interface
  - Use Supabase JS client
  - Handle errors gracefully
  
- [ ] Update repository factory
  ```typescript
  // lib/repositories/index.ts
  // OLD:
  export const notesRepo = new LocalStorageRepository<CalendarNote>('notes');
  // NEW:
  export const notesRepo = new SupabaseRepository<CalendarNote>('calendar_notes');
  ```
  
- [ ] Test CRUD operations
  - Create note
  - Read notes (all, by date, by category)
  - Update note
  - Delete note
  
- [ ] Data migration script
  - Export from localStorage
  - Import to Supabase
  - Assign to user

**Success Metrics:**
- Zero application code changes (except repository factory)
- All existing tests pass
- Performance comparable to localStorage

---

### 2.3 Authentication Upgrade (Week 2-3)

**Goal:** Replace demo auth with real Supabase Auth

**Tasks:**
- [ ] Update NextAuth config
  ```typescript
  // lib/auth/auth-options.ts
  // OLD: CredentialsProvider (localStorage)
  // NEW: SupabaseProvider
  ```
  
- [ ] Add auth flows
  - Sign up with email/password
  - Email verification
  - Password reset
  - Social login (Google, GitHub)
  
- [ ] Update UI
  - Sign up page
  - Forgot password page
  - Email verification instructions
  
- [ ] Session management
  - Automatic token refresh
  - Logout across tabs
  - Session expiry handling

**Success Metrics:**
- Secure authentication
- Users can sign up independently
- Password reset works
- Sessions persist correctly

---

## Phase 3: User Experience 🎨

**Timeline:** 3-4 weeks  
**Status:** Planned  
**Priority:** High (improves usability)

### 3.1 Color Customization UI (Week 1)

**Goal:** Let users customize calendar colors visually

**Tasks:**
- [ ] Create ColorSchemeEditor component
  - Material-UI color pickers
  - Preview in real-time
  - Save/cancel actions
  
- [ ] Add color presets
  - Light mode (default)
  - Dark mode
  - High contrast
  - Pastel
  - Vibrant
  
- [ ] Category management
  - Create custom categories
  - Edit category colors
  - Delete categories
  - Reorder categories
  
- [ ] Special date colors
  - Pick dates on calendar
  - Assign colors
  - Use for holidays/birthdays

**Success Metrics:**
- Users can customize colors without code
- Presets load instantly
- Colors persist across sessions

---

### 3.2 Mobile Responsive Design (Week 2)

**Goal:** Full mobile experience

**Tasks:**
- [ ] Responsive calendar grid
  - Stack weeks on small screens
  - Touch-friendly date cells
  - Swipe to change months
  
- [ ] Mobile chat interface
  - Full-screen on mobile
  - Keyboard handling
  - Scroll to latest message
  
- [ ] Mobile navigation
  - Bottom tab bar
  - Hamburger menu
  - Touch gestures
  
- [ ] Test on devices
  - iOS Safari
  - Android Chrome
  - Tablet sizes

**Success Metrics:**
- Usable on 320px width
- No horizontal scrolling
- Touch interactions feel native
- Passes Google Mobile-Friendly test

---

### 3.3 Search & Filter UI (Week 3)

**Goal:** Find notes quickly without AI

**Tasks:**
- [ ] Add search bar
  - Keyword search
  - Highlight matches
  - Live results
  
- [ ] Category filter chips
  - Show all categories
  - Click to filter
  - Multiple selection
  
- [ ] Date range picker
  - Material-UI DateRangePicker
  - Presets (this week, this month, next month)
  - Custom range
  
- [ ] Filter persistence
  - Save in URL params
  - Shareable links
  - Remember last filter

**Success Metrics:**
- Find notes in <3 seconds
- Filters work intuitively
- Can clear filters easily

---

### 3.4 Onboarding & Help (Week 4)

**Goal:** Guide new users to success

**Tasks:**
- [ ] Interactive tutorial
  - Tour calendar on first visit
  - Highlight key features
  - Show example interactions
  
- [ ] Example prompts
  - "Try: Add dentist appointment on March 15"
  - "Try: What's my week of April 1?"
  - Rotate suggestions
  
- [ ] Help documentation
  - In-app help panel
  - FAQ
  - Video tutorials
  
- [ ] Empty states
  - Friendly message when no notes
  - Suggestions for first action
  - Sample calendar option

**Success Metrics:**
- New users complete first action in <2 minutes
- <10% bounce rate
- Users discover AI features

---

## Phase 4: Scale & Collaboration 🚀

**Timeline:** 1-2 months  
**Status:** Future  
**Priority:** Medium (for team use cases)

### 4.1 Multi-Calendar Support

**Goal:** Manage multiple calendars (work, personal, projects)

**Tasks:**
- [ ] Calendar selection UI
  - Dropdown in header
  - Create new calendar
  - Switch between calendars
  
- [ ] Calendar CRUD
  - Create calendar (name, description)
  - Rename calendar
  - Delete calendar
  - Archive calendar
  
- [ ] Calendar settings per calendar
  - Default color scheme
  - AI model selection
  - Time zone
  - Week start day
  
- [ ] Import/Export per calendar
  - Export specific calendar
  - Import to specific calendar

**Effort:** 2 weeks

---

### 4.2 Sharing & Permissions

**Goal:** Share calendars with others (view-only or edit)

**Tasks:**
- [ ] Share link generation
  - Create unique share link
  - Expiration date
  - Revoke access
  
- [ ] Permission levels
  - View only (see events)
  - Comment (add comments, no edits)
  - Edit (full access)
  
- [ ] Collaboration UI
  - See who has access
  - Remove collaborators
  - Change permissions
  
- [ ] Real-time updates
  - WebSocket connection
  - See others' changes
  - Conflict resolution

**Effort:** 3 weeks

---

### 4.3 Recurring Events

**Goal:** Handle repeating events efficiently

**Tasks:**
- [ ] Recurrence patterns
  - Daily
  - Weekly (specific days)
  - Monthly (date or day-of-week)
  - Yearly
  - Custom (every N days/weeks/months)
  
- [ ] Exception handling
  - Skip specific dates
  - Modify single occurrence
  - Delete series vs single event
  
- [ ] AI understanding
  - "Every Tuesday at 3pm"
  - "Biweekly on Mondays"
  - "Last Friday of every month"
  
- [ ] UI for recurrence
  - Recurrence rule editor
  - Visual preview
  - Edit series dialog

**Effort:** 2 weeks

---

## Phase 5: Premium Features 💎

**Timeline:** 2-3 months  
**Status:** Future  
**Priority:** Low (monetization focus)

### 5.1 Advanced AI Features

**Goal:** Premium AI capabilities

**Tasks:**
- [ ] Model selection
  - Choose from 10+ models
  - Compare pricing/speed
  - Custom system prompts
  
- [ ] Smart suggestions
  - AI suggests events based on patterns
  - Conflict warnings
  - Time optimization
  
- [ ] Natural language queries
  - "Find my busiest week in March"
  - "When am I free next Tuesday?"
  - "Summarize my April schedule"
  
- [ ] Bulk operations
  - "Move all March meetings to April"
  - "Delete all events with 'draft' in the name"

**Effort:** 3 weeks

---

### 5.2 Integrations

**Goal:** Connect to external calendars and tools

**Tasks:**
- [ ] Google Calendar sync
  - Two-way sync
  - Import events
  - Export events
  
- [ ] Microsoft Outlook sync
  - Read Outlook events
  - Create Outlook events
  
- [ ] Slack integration
  - Daily digest
  - Create events from Slack
  - Reminders
  
- [ ] Zapier/Make.com
  - Trigger on new event
  - Create event from other apps

**Effort:** 4 weeks

---

### 5.3 Advanced Export

**Goal:** Professional export options

**Tasks:**
- [ ] Custom templates
  - Design calendar templates
  - Choose fonts/colors/layout
  - Save templates
  
- [ ] PDF export
  - Multi-page support
  - Print-optimized
  - Custom page size
  
- [ ] Printable calendars
  - Wall calendar format
  - Desk calendar format
  - Pocket calendar format
  
- [ ] Embed code
  - iframe embed
  - JavaScript widget
  - API access

**Effort:** 3 weeks

---

### 5.4 Analytics & Insights

**Goal:** Understand calendar usage patterns

**Tasks:**
- [ ] Time tracking
  - Log actual time spent
  - Compare to scheduled time
  - Productivity metrics
  
- [ ] Category analytics
  - Time per category
  - Trends over time
  - Visual charts
  
- [ ] Reports
  - Weekly summary
  - Monthly overview
  - Yearly trends
  
- [ ] Recommendations
  - "You schedule too many meetings on Mondays"
  - "Your busiest month is October"
  - "You have 4 hours of free time on Thursday"

**Effort:** 2 weeks

---

## Phase 6: Enterprise 🏢

**Timeline:** 3+ months  
**Status:** Future (if demand exists)  
**Priority:** Optional

### 6.1 Team Features

- [ ] Organization accounts
- [ ] Team workspaces
- [ ] Role-based access control
- [ ] Audit logs
- [ ] SSO (SAML, OAuth)

### 6.2 White Label

- [ ] Custom branding
- [ ] Custom domain
- [ ] Remove Calendar Maker branding
- [ ] API access

### 6.3 Compliance

- [ ] GDPR compliance
- [ ] SOC 2 Type II
- [ ] HIPAA (if needed)
- [ ] Data residency options

---

## Success Metrics

### MVP (Current)
- ✅ Core workflow functional
- ✅ AI understands date requests
- ✅ Export quality acceptable

### Phase 1 (Production)
- Zero critical bugs in first week
- <2s page load time
- 99%+ uptime
- 50%+ test coverage

### Phase 2 (Supabase)
- <500ms query time
- Zero data loss
- 100 concurrent users supported

### Phase 3 (UX)
- 90% mobile usability score
- <10% bounce rate
- Users create 5+ notes per session

### Phase 4 (Scale)
- Support 1000+ users
- Real-time updates <1s latency
- 10+ calendars per user

### Phase 5 (Premium)
- 10% conversion to paid
- $10-20 MRR per paying user
- 90% retention month-over-month

---

## Revenue Model (Future)

### Free Tier
- 1 calendar
- 100 notes
- Basic export (SVG/PNG)
- Community support

### Pro ($9/month)
- Unlimited calendars
- Unlimited notes
- Advanced export (PDF, templates)
- Priority AI model
- Email support

### Team ($29/month, up to 5 users)
- Everything in Pro
- Shared calendars
- Permissions
- Team analytics
- Slack integration

### Enterprise (Custom pricing)
- Everything in Team
- White label
- SSO
- SLA
- Dedicated support
- Custom features

---

## Risk Mitigation

### Technical Risks

**Risk:** AI costs spiral out of control  
**Mitigation:**
- Rate limiting (Phase 1)
- Usage monitoring (Phase 1)
- Switch to cheaper model if needed
- Cache common responses

**Risk:** Supabase free tier limits reached  
**Mitigation:**
- Monitor usage
- Upgrade to paid tier ($25/month)
- Optimize queries
- Implement pagination

**Risk:** Performance degrades with scale  
**Mitigation:**
- Index optimization
- Query caching
- CDN for static assets
- Load testing before launch

### Business Risks

**Risk:** Low user adoption  
**Mitigation:**
- Product Hunt launch
- Share on Reddit/HN
- Video demos
- Influencer outreach

**Risk:** Competition from established players  
**Mitigation:**
- Focus on AI-first experience
- Emphasize simplicity
- Target niche (content creators)
- Open source advantage

**Risk:** OpenRouter API changes  
**Mitigation:**
- Vendor abstraction (easy to swap)
- Monitor API changelog
- Test with multiple providers
- Keep local LLM as backup option

---

## Open Questions

1. **Monetization Timing:** When to introduce paid plans?
   - Option A: After 100 active users
   - Option B: After Phase 3 (UX improvements)
   - Option C: Never (keep open source)

2. **Target Market:** Who is primary audience?
   - Content creators (current assumption)
   - Students/teachers
   - Freelancers
   - Event planners
   - Decision: User research needed

3. **AI Model Strategy:** Stick with Claude or diversify?
   - Claude is expensive but high quality
   - GPT-4o is cheaper but less consistent
   - Gemini is fast but less capable
   - Decision: Let users choose in Pro tier

4. **Open Source Strategy:** How open should we be?
   - Current: Fully open source (MIT)
   - Option: Core open, premium features closed
   - Option: Open source for non-commercial only
   - Decision: Keep fully open for now

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) (to be created in Phase 1) for:
- How to pick tasks from roadmap
- Development setup
- Code review process
- Feature request process

**Priority Labels:**
- 🔴 Critical (blocking release)
- 🟡 High (important for UX)
- 🟢 Medium (nice to have)
- ⚪ Low (future consideration)

---

## Changelog

- **2026-01-09:** Initial roadmap created
- **Phase 0 Complete:** MVP features functional
- **Next Up:** Phase 1 (Production Hardening)

---

**Maintained by:** Thomas J McLeish  
**Questions?** Open an issue or discussion  
**Want to help?** Pick a task and open a PR!
