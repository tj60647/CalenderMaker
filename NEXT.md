# Next

Updated: 2026-11-22

## Where it stands

Calendar Maker works and is live behind its own sign-in at https://calender-maker.vercel.app: a calendar built by talking to an AI assistant, made as a teaching tool for interaction design students. It has an agent with tools, a promptfoo evaluation set, sign-in with password reset, and optional Supabase storage. It was built between 8 January and 8 February 2026, and nothing has changed since. Phase 1 of `ROADMAP.md` (production hardening) was never started.

## Next step

Settle the app's real name. The published app calls itself TimeTwin (its page title and its assistant), while this repository is called CalenderMaker (misspelled) and the package and README say Calendar Maker. Once TJ picks the name, use it in the README, the package, the repository name and the site.

## After that

- Decide whether to keep it as it is, develop it further, or archive it.
- If it is kept: make the README name the model the app actually uses; it says Claude Opus 4.5, while the model setting in the code names GPT-5.2.
- Remove the debug `console.log` added to `app/auth/forgot-password/page.tsx` on 3 February.
- Then Phase 1.3 of `ROADMAP.md`, starting with the Jest type errors it marks as blocking.

## Blocked or waiting

- None.

## Open questions

- Which name is the real one: TimeTwin or Calendar Maker?
- Is it still used with students?
- This plan was drafted by Claude on 2026-11-22 from the code and its history. Is the next step right?
