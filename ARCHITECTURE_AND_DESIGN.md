# How the System Works: A Strategic Guide

**Who this is for:** Interaction Designers, User Researchers, and Students exploring system design.
**Goal:** Understand *why* the components are organized this way and *how* data flows through the system, without using technical jargon.

---

## 🏛️ System Overview

This application separates what the user *sees* from what the system *thinks* and what the system *remembers*.

### 1. The Visible Interface (Frontend)
**Where:** `app/` and `components/` folders

This is the part of the system users interact with.
*   **Design Decision:** We use pre-built components (Material UI) rather than custom-drawing every button. This ensures accessibility and consistency.
*   **Responsibility:** These files only handle *display* and *input*. They do not make decisions. When a user clicks "Save", this layer just sends a signal. It doesn't know *how* to save.
*   ** Feedback:** The interface is designed to fake speed. It will often show a "success" state before the server has technically finished, to make the app feel responsive.

### 2. The Decision Maker (AI Logic)
**Where:** `lib/ai-actions.ts`

This is where the application interprets human language.
*   **The Problem:** Humans are messy ("Next Tues"). Computers need structure ("2026-03-24").
*   **The Strategy:** We give the AI a very strict "form" to fill out. Instead of letting it chat freely, we force it to convert your sentence into a specific data format.
*   **Safety:** We give the AI a "System Persona"—a set of rules it must follow (like "You are a helpful assistant"). This prevents it from going off-topic.

### 3. The Memory (Data Storage)
**Where:** `lib/repositories/`

This is the part of the system that saves your data.
*   **The Strategy:** Users might want to save data on their own computer (for privacy) or in the cloud (for sharing).
*   **The Solution:** We created a "Connection Manager" (technically called a Repository).
    *   The rest of the app just says "Save this note."
    *   The Connection Manager looks at your settings and decides: "Okay, I'll put this in the Browser Storage" OR "I'll send this to the Cloud Database."
    *   **Why this matters:** This allows us to change where data lives without breaking the rest of the app.

---

## 🔁 The Journey of a Request

Here is what happens when a user types "Dentist on Friday":

1.  **Capture:** The **Interface** (`ChatInterface`) captures the text.
2.  **Translate:** It sends the text to the **Decision Maker** (AI).
3.  **Process:** The AI looks at "Friday" and the current date, calculates the result, and formats it as a "Note Object."
4.  **Hand-off:** The system hands this Note Object to the **Connection Manager**.
5.  **Save:** The Manager saves it to the permanent storage (Browser or Cloud).
6.  **Refresh:** The **Interface** sees the new data and updates the Calendar grid.

---

## 🧭 Map for Exploration

If you are exploring the files to understand the design:

*   **To see how we talk to users:** Look in `components/chat`.
*   **To see the rules for the AI:** Look in `lib/calendar-tools.ts`.
*   **To see how we switch between Local and Cloud storage:** Look in `lib/repositories/index.ts`.

---

## 🧠 Questions to ask an AI Assistant

If you are using an AI coding assistant to explore this project, ask these questions:

1.  *"Which file controls what the AI is allowed to do?"*
2.  *"Show me the part of the system that decides where to save the data."*
3.  *"How does the calendar know when to update?"*
4.  *"Why are the button components separate from the logic code?"*

**Note:** Focus on the *flow* of information and the *responsibilities* of each part, rather than the specific lines of code.

---

## 🛠️ Development & Deployment Scenarios

We follow a "Three-Stage Rocket" strategy to decouple development from infrastructure dependencies.

### Scenario 1: No Supabase + Demo Mode (The "Starter" Kit)
**Goal:** Zero-config, works immediately after `git clone`.

*   **Setup:** No `.env.local` required (or missing keys).
*   **Storage:** `LocalStorageRepository` (Browser memory).
*   **Auth:** Demo Login (`demo` / `demo`).
*   **Identity:** System uses a hardcoded "Demo User ID" (`0000...0001`).
*   **Use Case:** Quick prototyping, UI development, teaching without cloud setup.

### Scenario 2: Supabase + Demo Mode (The "Hybrid" Kit)
**Goal:** Test database schema and real-time features without building auth UI.

*   **Setup:** `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY`.
*   **Storage:** `SupabaseRepository` (Real Cloud Database).
*   **Auth:** Demo Login (`demo` / `demo`) - NextAuth still in simple mode.
*   **Identity:** System uses "Demo User ID" but forces writes to the real DB.
*   **Critical Requirement:** Must run `supabase/enable_demo_user.sql` to bypass Foreign Key constraints.
*   **Use Case:** verifying database migrations, checking RLS policies, backend testing.

### Scenario 3: Supabase + User Accounts (The "Production" Kit)
**Goal:** Full robust application with real security.

*   **Setup:** Full `.env.local` with Supabase keys + `NEXTAUTH_SECRET`.
*   **Storage:** `SupabaseRepository`.
*   **Auth:** Real Supabase Auth (Email/Password, Google, etc).
*   **Identity:** Real UUIDs from Supabase `auth.users`.
*   **Transition:**
    1.  Revert `enable_demo_user.sql` (Restore strict constraints).
    2.  Update `lib/auth/auth-options.ts` to use `SupabaseProvider`.
*   **Use Case:** Production deployment, multi-user support.

| Feature | Scenario 1 (Local) | Scenario 2 (Hybrid) | Scenario 3 (Prod) |
| :--- | :--- | :--- | :--- |
| **Database** | LocalStorage | Supabase | Supabase |
| **Login** | Fake (`demo`) | Fake (`demo`) | Real (Email) |
| **Logic** | `LocalStorageRepo` | `SupabaseRepo` | `SupabaseRepo` |
| **Setup** | `npm run dev` | + `.env` keys | + Auth Provider Code |
