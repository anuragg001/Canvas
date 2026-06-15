# Canvas AI App Builder

This repository is my learning and product-building journey for an AI-powered app builder. The core idea is simple:

- A user describes an app in natural language.
- AI generates usable frontend code.
- The user previews, iterates, and exports.

This README is intentionally written as a revision notebook so I can:

- track progress step by step,
- prepare for interviews,
- explain why each tool/service was selected,
- keep implementation status transparent (built vs planned).

---

## 1) Current Snapshot (as of now)

### What is already implemented

- Next.js app scaffold (App Router) is running.
- Global layout and typography setup are in place.
- Clerk is integrated at app root with middleware protection wiring.
- Hero section started with animated stars background and a badge.
- Header with signed-in/signed-out states using Clerk UI components.
- Tailwind v4 + shadcn/ui + animate-ui setup is in place.
- Prisma base configuration exists (schema, config, Postgres datasource).
- Product constants and marketing copy scaffolding are drafted.

### What is not implemented yet (important for interview honesty)

- No end-to-end prompt -> code generation pipeline yet.
- No Gemini API integration code yet (only UI mention).
- No Sandpack/live code execution pipeline yet.
- No billing/credits backend yet (only constants and UI placeholders).
- No Arcjet runtime protection rules applied yet.
- No production DB models/migrations yet.

---

## 2) Step-by-Step Progress Log

Use this like a changelog and interview timeline.

### Step 01: Project foundation

I initialized a modern full-stack React foundation with:

- Next.js 16
- React 19
- TypeScript strict mode
- ESLint

Why this step matters:
This gives a reliable baseline with routing, SSR/CSR flexibility, and type safety before adding AI complexity.

### Step 02: Design system and UI velocity

I added and configured:

- shadcn/ui component system
- Tailwind CSS v4
- tw-animate-css
- animate-ui background components
- Lucide icons

Result:
UI development is now fast and consistent. I can focus on product logic without rebuilding basic components.

### Step 03: Global layout and branding shell

Implemented:

- Root layout with fonts (Lora + DM Sans)
- Global theme provider
- Fixed top header
- Initial hero section with stars background

Result:
The app has a recognizable visual identity and reusable shell for future pages.

### Step 04: Authentication foundation

Implemented:

- ClerkProvider at root level
- Clerk middleware in proxy
- Sign-in/sign-up modals in header
- Signed-in and signed-out UI state handling

Result:
Auth building blocks are ready for user-specific projects, credits, and billing in later steps.

### Step 05: Domain constants and feature planning

Implemented:

- Pricing/credits constants
- Suggestions/features/steps data arrays

Result:
I now have reusable config-driven content for landing and pricing flows.

### Step 06: Database scaffolding

Implemented:

- Prisma config file
- Prisma schema generator + datasource

Result:
DB layer is scaffolded and ready for real models (users, projects, generations, subscriptions).

---

## 3) Architecture Intent (Current -> Target)

### Current architecture

- Frontend shell exists.
- Auth plumbing exists.
- DB tooling exists.
- AI generation flow is not wired yet.

### Target architecture

1. User enters prompt (+ optional image).
2. Backend route validates auth + credits.
3. Prompt sent to Gemini.
4. Returned code normalized into project file structure.
5. Dependencies validated (allowlist + npm check).
6. Live preview generated.
7. User iterates in chat.
8. Export/download or deploy.

---

## 4) Third-Party Services and Libraries

This section covers all major third-party dependencies from package.json and their role.

### A) Core framework

- next: app framework, routing, rendering, server actions.
- react + react-dom: component rendering and state model.
- typescript: static typing and safer refactors.

### B) UI system and interaction

- tailwindcss + @tailwindcss/postcss: utility-first styling.
- shadcn: component workflow and design primitives.
- @base-ui/react: low-level accessible interaction primitives.
- lucide-react: icon set.
- motion: animation engine.
- tw-animate-css: animation utilities.

### C) Rich UI building blocks

- cmdk: command palette.
- embla-carousel-react: carousel.
- react-day-picker: date UI.
- input-otp: OTP input UX.
- react-resizable-panels: split/resizable layouts.
- recharts: charting.
- sonner: toast notifications.
- vaul: drawer/sheet interactions.

### D) Auth, backend, data, and security

- @clerk/nextjs: authentication and user session management.
- prisma: ORM and schema/migration workflow.
- pg: PostgreSQL driver.
- @arcjet/next: security/risk protection tooling (planned usage).

### E) AI and coding workflow tools

- @cline/sdk: SDK for AI-assisted workflows/agents (currently installed, not yet wired).

### F) Utility libraries

- clsx + tailwind-merge + class-variance-authority: class composition patterns.
- date-fns: date formatting/manipulation.
- next-themes: theme management.

---

## 5) Interview Q&A (Design Choices)

### Q1) Why Next.js instead of plain React?

Answer:
I needed SSR/CSR flexibility, route handlers, and a production-ready app structure. Next.js gives me App Router, middleware, optimization, and a clear path to scaling full-stack features in one codebase.

### Q2) Why Clerk for auth?

Answer:
It reduced auth complexity early. I can quickly support sign-in/up, session state, and protected routes, then spend more time on AI generation and product logic.

### Q3) Why Prisma with Postgres?

Answer:
Prisma gives type-safe DB access and maintainable schema evolution. Postgres is reliable for relational entities like users, projects, generations, subscriptions, and credit ledgers.

### Q4) Why shadcn/ui + Tailwind instead of custom CSS components from scratch?

Answer:
The goal is speed with consistency. shadcn gives composable accessible primitives while Tailwind keeps styling fast and explicit. This pairing helps ship MVP features quickly.

### Q5) Why include Arcjet now even before final launch?

Answer:
Because AI-generation endpoints are expensive and abuse-prone. Planning security early avoids retrofitting risk controls later.

### Q6) Why mention Gemini in UI before integration?

Answer:
It is part of the intended product direction and keeps branding aligned during UI-first development. In interview context, I clearly call it roadmap status, not completed integration.

---

## 6) Case-Based Interview Practice

### Case 1: "Your AI endpoint cost spikes overnight. What do you do?"

Answer strategy:

1. Add per-user and per-IP rate limiting.
2. Enforce credit checks before inference.
3. Cache repeated prompts where safe.
4. Add request budget alarms and dashboards.
5. Introduce model-tier routing (cheap model for drafts, premium for final pass).

### Case 2: "Generated code often fails in preview. How would you improve reliability?"

Answer strategy:

1. Constrain output format (strict file manifest JSON).
2. Validate dependencies and ban hallucinated packages.
3. Run lint/type checks on generated files.
4. Add auto-fix loop with structured error feedback.
5. Track failure categories to continuously improve prompts/system instructions.

### Case 3: "How do you design the credits system to avoid race conditions?"

Answer strategy:

1. Use DB transactions.
2. Debit credits before generation starts.
3. Write generation event with idempotency key.
4. Refund on known failure states.
5. Add audit table for every credit mutation.

### Case 4: "Why did you build UI first instead of backend first?"

Answer strategy:

1. UI-first helped validate user flow quickly.
2. It clarified required backend contracts.
3. It improved communication of product vision.
4. It reduced rework by making state transitions visible early.

---

## 7) My Learning Notes (for revision)

- I am building this project incrementally, not all at once.
- I separate "implemented" and "planned" to avoid overclaiming.
- I prefer scaffold-first development: UI shell -> auth -> data -> AI pipeline -> monetization -> hardening.
- Interviewers appreciate explicit tradeoffs and staged delivery.

---

## 8) Current File-Level Highlights

- app/layout.tsx: app shell, fonts, ThemeProvider, ClerkProvider, Header mount.
- app/page.tsx: hero section with stars background + product badge.
- components/Header.tsx: auth-aware nav and topbar interactions.
- components/theme-provider.tsx: theme wrapper over next-themes provider.
- lib/constants.ts: pricing/credits plan constants.
- lib/data.ts: landing copy blocks, feature cards, workflow steps.
- prisma/schema.prisma: Prisma client generator + Postgres datasource scaffold.
- prisma.config.ts: Prisma config using env datasource URL.
- proxy.ts: Clerk middleware and matcher config.

---

## 9) Run and Develop

1. Install dependencies:
	npm install
2. Start dev server:
	npm run dev
3. Lint:
	npm run lint

Environment variables (expected eventually):

- Clerk keys
- Database URL(s)
- Gemini API key
- Arcjet keys
- Billing provider keys (when subscription flow is added)

---

## 10) Next Planned Milestones

1. Create DB models: UserProfile, Project, Generation, CreditLedger, Subscription.
2. Build protected dashboard/project pages.
3. Implement prompt submission pipeline.
4. Integrate Gemini API route.
5. Add dependency validator and generation sanitizer.
6. Add live preview execution pipeline.
7. Implement credit deduction/refund transaction flow.
8. Add Arcjet protection to expensive endpoints.
9. Add tests for generation pipeline and credits ledger consistency.

---

## 11) How I Will Keep Updating This README

For every new feature I build, I will add:

1. What I built.
2. Why I built it this way.
3. Tradeoffs considered.
4. Interview Q&A related to that feature.
5. One case-based scenario and solution.

This makes the README both a technical logbook and interview preparation document.