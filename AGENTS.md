# Workspace Workflow & Feature Guidelines

## 1. Rule & Context Inspection
- Always read and strictly adhere to `AGENTS.md` guidelines at the start of every task.

## 2. React Native to React Web Feature Translation
- When requested to build or modify features for React Web applications (`store-app`, `store-management`, Next.js projects):
  - Check for and analyze existing reference implementations in the React Native / Uber mobile codebase (`uber/`, `my-app/`).
  - Adapt mobile patterns, state logic, and API workflows to web best practices (Next.js App Router, TypeScript, responsive layout).

## 3. Proactive Suggestions & Guidance
- Whenever given a user prompt to build a feature or perform a task:
  - Offer proactive design/architectural suggestions, potential optimizations, and implementation options before proceeding.
  - Highlight edge cases or user experience improvements.

## 4. Project Folder Structure Standard (`store-management` Pattern)
- When organizing or building Next.js projects and features, adhere to the `store-management` layout standard:
  - `app/`: Next.js App Router root for pages (`app/<route>/page.tsx`) and API endpoints (`app/api/<endpoint>/route.ts`).
  - `src/`: Shared core application layer separated from router logic:
    - `src/components/`: Reusable UI components
    - `src/context/`: Global React context providers
    - `src/db/` & `src/schema/`: Database connections (Drizzle/ORM) and Zod/TypeScript schemas
    - `src/hooks/`: Custom React hooks
    - `src/interface/`: Shared interfaces and type definitions
    - `src/lib/` & `src/utils/`: Helper utilities and client integrations
    - `src/services/`: API and business logic service layer
    - `src/store/` & `src/slice/`: Redux/state management modules


## 5. Implementation Plan (Mandatory)
- Whenever the user gives a query to generate, make, or build something, you must write an implementation plan detailing what you are going to do into a temporary file (artifact).
- Do NOT output the implementation plan in the chat prompt.
- After writing the plan to the temporary file, proceed with the implementation immediately without asking for confirmation.
