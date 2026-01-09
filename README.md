# 📅 Calendar Maker

> **AI-powered calendar generator with conversational interface**

Transform calendar creation from a manual, design-heavy process into a natural conversation. Just tell the AI what you want, and watch your calendar come to life.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg)](https://nextjs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-27%25-yellow.svg)](./CODEBASE_ANALYSIS.md)

![Calendar Maker Demo](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Calendar+Maker+Demo+GIF+Coming+Soon)

---

## ✨ Features

### 🤖 **Conversational AI Interface**
Talk to your calendar like you would a personal assistant:
- "Add dentist appointment on March 15th at 2pm"
- "What's my week of April 1st look like?"
- "Mark March 25-27 as vacation"

**Powered by:** OpenRouter + Claude Opus 4.5

### 📊 **Interactive Calendar Grid**
- Month view with intuitive navigation
- Color-coded notes by category
- Click dates to view/edit details
- Today's date always highlighted
- Hover for quick note previews

### 🎨 **Smart Categories & Colors**
- Pre-defined categories (work, personal, meeting, deadline, event)
- Custom colors for any note
- Color inheritance (note → category → default)
- Visual distinction at a glance

### 💾 **Persistent Storage**
- All data saved automatically
- Works offline (localStorage)
- Ready to migrate to cloud (Supabase architecture)
- Zero setup required

### 📥 **Professional Exports**
- **SVG** - Vector format, scalable, editable in design tools
- **PNG** - High-quality raster for sharing
- Custom date range selection
- Automatic download

### 🧪 **AI Evaluation Framework**
Unique feature: Production-grade AI behavior testing
- 30 curated test cases
- Automated assertions
- Trend visualization dashboard
- Reusable for other AI projects

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (recommended: use `nvm`)
- **npm** 10+
- **OpenRouter API Key** ([Get one free](https://openrouter.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CalendarMaker.git
cd CalendarMaker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Environment Variables

Create `.env.local` in the root directory:

```env
# OpenRouter API Key (REQUIRED)
OPENROUTER_CALENDARMAKER_API_KEY=sk-or-v1-...

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Optional: Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-id
```

**Note:** For development, you can use any random string for `NEXTAUTH_SECRET`. Generate one with:
```bash
openssl rand -base64 32
```

---

## 📖 Usage

### First Time Setup

1. **Sign In** - Use any email/password (demo mode, no validation)
2. **Start Chatting** - Type a message like "Add a meeting tomorrow"
3. **View Calendar** - Click dates to see details
4. **Export** - Select date range and download SVG or PNG

### Example Prompts

**Adding Events:**
- "Add team standup every Monday at 9am"
- "Dentist appointment March 15 at 2:30pm"
- "Deadline: Q1 report on March 31"

**Querying:**
- "What do I have on March 20th?"
- "What's my week of April 1st?"
- "Find all meetings in March"

**Modifying:**
- "Move the dentist to March 16"
- "Cancel my team standup on March 10"
- "Change meeting to 3pm"

**AI Tools (Automatic):**
The AI automatically uses these tools to check your calendar:
- `search_calendar` - Find events in a date range
- `get_week_notes` - Get a full week (Sun-Sat)
- `search_by_keyword` - Text search across notes
- `get_date_notes` - Get specific day's events

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript 5 (100% typed, zero `any`) |
| **UI** | Material-UI 7 + Lucide React icons |
| **AI** | OpenRouter API (Claude Opus 4.5) |
| **Storage** | localStorage (Phase 1) → Supabase (Phase 2) |
| **Auth** | NextAuth.js 4 |
| **Testing** | Jest 30 + React Testing Library |
| **Export** | SVG + PNG (html2canvas) |

### Design Philosophy

**Migration-First Architecture** - Built for seamless transition from localStorage to Supabase:

```typescript
// Repository pattern abstracts storage
export const notesRepo: INotesRepository = 
  new LocalStorageRepository<CalendarNote>('notes');

// To migrate to Supabase: Change ONE line
export const notesRepo: INotesRepository = 
  new SupabaseRepository<CalendarNote>('calendar_notes');

// All 15+ call sites remain unchanged ✅
```

**Beginner-Friendly Code** - Every function documented for learners:
- Comprehensive TSDoc comments
- "Why" explanations, not just "what"
- Target audience: 1-2 years experience
- File headers with author/license/date

---

## 📚 Documentation

- **[Implementation Plan](IMPLEMENTATION_PLAN.md)** - Complete feature specification (729 lines)
- **[Codebase Analysis](CODEBASE_ANALYSIS.md)** - Comprehensive architecture review
- **[Product Roadmap](ROADMAP.md)** - Future features and timeline
- **[Test Protocol](TEST_PROTOCOL.md)** - Testing strategy and guidelines
- **[Eval Framework](evals/README.md)** - AI behavior testing guide
- **[Copilot Instructions](.github/copilot-instructions.md)** - Code style guide

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run AI evaluations
npm test calendar-evals
```

### Test Coverage

| Category | Coverage |
|----------|----------|
| **Overall** | 27% |
| Calendar Utilities | 100% ✅ |
| Calendar Tools | 100% ✅ |
| Repository Layer | 71% |
| AI Action Parsing | 63% |
| Export Utilities | 0% ⚠️ |

**Goal:** 50%+ by Phase 1 completion

### AI Evaluation Dashboard

View AI test results at: http://localhost:3000/evals

- 30 test cases across 7 categories
- Trend visualization with Recharts
- Git commit tracking
- CSV/JSON export

---

## 🔧 Development

### Project Structure

```
CalenderMaker/
├── app/                     # Next.js pages (App Router)
│   ├── page.tsx            # Main calendar view
│   ├── api/chat/           # OpenRouter integration
│   ├── auth/signin/        # Authentication UI
│   └── evals/              # AI eval dashboard
│
├── components/             # React components
│   ├── calendar/           # Calendar, DateDetail, JSONViewer
│   └── chat/               # ChatInterface
│
├── lib/                    # Business logic
│   ├── ai-actions.ts       # AI response parser
│   ├── calendar-utils.ts   # Date generation (100% tested)
│   ├── export-utils.ts     # SVG/PNG export
│   ├── repositories/       # Data access layer
│   ├── tools/              # AI function calling (100% tested)
│   └── evals/              # AI evaluation framework
│
├── types/                  # TypeScript definitions
├── __tests__/              # Test files (mirror src structure)
└── evals/                  # AI test cases (JSONL)
```

### Code Style

This project follows strict conventions (enforced by Copilot):

1. **File Headers** - Every file has TSDoc header with author/license/date
2. **Function Documentation** - TSDoc for ALL functions (not just exports)
3. **Beginner Comments** - Explain WHY, target junior developers
4. **Repository Pattern** - Never access storage directly
5. **Material-UI Only** - Use `sx` prop for styling
6. **No `any` Types** - Zero tolerance, use `unknown` instead
7. **Error Handling** - Try-catch with user-friendly messages

See [Copilot Instructions](.github/copilot-instructions.md) for complete guide.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm test             # Run Jest tests
npm run type-check   # TypeScript validation
npm run validate     # Lint + type-check + test
```

---

## 🗺️ Roadmap

### ✅ Phase 0: MVP (Complete)
- Interactive calendar grid
- AI chat interface
- Natural language note creation
- Export as SVG/PNG
- AI evaluation framework

### 🔨 Phase 1: Production Hardening (In Progress)
- [ ] Fix Jest type errors
- [ ] Add error notifications (Snackbar)
- [ ] Increase test coverage to 50%+
- [ ] Add rate limiting
- [ ] Deploy to Vercel

### 🗄️ Phase 2: Supabase Migration (Planned)
- [ ] Set up Supabase project
- [ ] Migrate to PostgreSQL
- [ ] Real authentication
- [ ] Multi-user support

### 🎨 Phase 3: User Experience (Planned)
- [ ] Color customization UI
- [ ] Mobile responsive design
- [ ] Search & filter interface
- [ ] Onboarding tutorial

See [ROADMAP.md](ROADMAP.md) for complete timeline and Phase 4-6 details.

---

## 🤝 Contributing

Contributions are welcome! This project is designed to be beginner-friendly.

### How to Contribute

1. **Pick a Task** - See [ROADMAP.md](ROADMAP.md) for prioritized tasks
2. **Fork & Clone** - Create your own fork
3. **Create Branch** - `git checkout -b feature/your-feature`
4. **Follow Code Style** - Read [Copilot Instructions](.github/copilot-instructions.md)
5. **Write Tests** - Add tests for new features
6. **Open PR** - Include description and screenshots

### Good First Issues

- [ ] Add tests for export utilities
- [ ] Create ColorSchemeEditor component
- [ ] Add input validation to forms
- [ ] Write CONTRIBUTING.md
- [ ] Improve mobile responsiveness

---

## 📊 Current Status

**Version:** 0.1.0 (MVP)  
**Status:** Ready for limited user testing  
**Test Coverage:** 27%  
**Deployment:** Local development only

### Known Issues

- ⚠️ Jest setup has 3 TypeScript errors (tests still pass)
- ⚠️ Export utilities have 0% test coverage
- ⚠️ Authentication is demo-level only (not secure)
- ⚠️ No mobile responsive design yet

See [CODEBASE_ANALYSIS.md](CODEBASE_ANALYSIS.md) for detailed analysis.

---

## 🛠️ Troubleshooting

### OpenRouter API Issues

**Error:** "Invalid API key"
- Check `.env.local` has correct key
- Key should start with `sk-or-v1-`
- Restart dev server after changing env vars

**Error:** "Rate limit exceeded"
- You're on free tier with limits
- Add rate limiting (Phase 1 task)
- Consider switching to cheaper model

### Build Errors

**TypeScript errors in jest.setup.ts**
- These are known issues (don't block tests)
- Will be fixed in Phase 1
- Safe to ignore for now

**Missing environment variables**
- Copy `.env.example` to `.env.local`
- Add your OpenRouter API key
- Generate NEXTAUTH_SECRET with `openssl rand -base64 32`

### Storage Issues

**localStorage full**
- Browser limit: 5-10MB
- Clear old data in DevTools → Application → Local Storage
- Migration to Supabase coming in Phase 2

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**You are free to:**
- Use for personal or commercial projects
- Modify and distribute
- Use in proprietary software

**Attribution appreciated but not required.**

---

## 👤 Author

**Thomas J McLeish**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- Portfolio: [yourportfolio.com](https://yourportfolio.com)

---

## 🙏 Acknowledgments

- **OpenRouter** - AI API aggregation
- **Anthropic** - Claude AI models
- **Vercel** - Next.js framework
- **Material-UI** - React component library
- **Lucide** - Beautiful icons

---

## ⭐ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/CalendarMaker&type=Date)](https://star-history.com/#yourusername/CalendarMaker&Date)

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/CalendarMaker?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/CalendarMaker?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/CalendarMaker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/CalendarMaker)

---

**Built with ❤️ and lots of ☕**
