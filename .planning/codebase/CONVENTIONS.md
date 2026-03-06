# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- React page components: `page.tsx` (Next.js App Router convention)
- React layout components: `layout.tsx`
- Interactive client components extracted from pages: PascalCase noun describing role, e.g., `BookingActions.tsx`, `ApplyButton.tsx`, `MarkAllRead.tsx`
- Shared UI components: PascalCase noun, e.g., `Button.tsx`, `Card.tsx`, `Badge.tsx`
- Controllers: camelCase with `Controller` suffix, e.g., `jobController.ts`, `authController.ts`
- Models: camelCase with `Model` suffix, e.g., `jobModel.ts`, `userModel.ts`
- Hooks: camelCase with `use` prefix, e.g., `useUser.ts`
- Lib utilities: camelCase descriptive noun, e.g., `supabase.ts`, `supabase-server.ts`, `notify.ts`, `utils.ts`

**Functions:**
- Exported controller functions: camelCase verb-noun, e.g., `createJobListing`, `getClientJobs`, `registerUser`, `loginUser`
- Exported model functions: camelCase verb-noun following CRUD intent, e.g., `createJob`, `getJobById`, `updateJobStatus`, `getNearbyProviders`
- React components: PascalCase, e.g., `Button`, `AppShell`, `LoginPage`
- React hooks: camelCase with `use` prefix, e.g., `useUser`
- Utility functions: camelCase verb-noun, e.g., `formatCurrency`, `getDistanceKm`, `reverseGeocode`
- Async handlers in client components: camelCase verb-noun, e.g., `acceptBooking`, `declineBooking`, `confirmComplete`, `submitRating`

**Variables:**
- Local state: camelCase, e.g., `loading`, `profileOpen`, `liveCount`
- Destructured Supabase responses: `{ data, error }` pattern throughout
- Constants/config data: SCREAMING_SNAKE_CASE for module-level constants, e.g., `JOB_CATEGORIES`, `BARANGAYS_QC`
- Nav arrays: camelCase noun, e.g., `clientNav`, `providerNav`

**Types/Interfaces:**
- Domain interfaces: PascalCase noun, e.g., `User`, `Job`, `Booking`, `Provider`
- Enum-like union types: PascalCase, e.g., `UserRole`, `JobStatus`, `BookingStatus`, `JobCategory`
- Component prop interfaces: `Props` (inline) or descriptive name extending HTML types, e.g., `ButtonProps`, `InputProps`, `CardProps`
- Drizzle inferred types: `[Entity]Row` for select, `New[Entity]` for insert, e.g., `UserRow`, `NewUser`, `JobRow`, `NewJob`
- API response wrapper: `ApiResponse<T>`, `PaginatedResponse<T>`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is manual/editor-driven
- Single quotes for string literals in `.ts` / `.tsx` files (single-quote style in source files, double-quote style in some page files — inconsistent)
- Semicolons used consistently
- 2-space indentation
- Trailing commas in multi-line objects and arrays

**Linting:**
- ESLint 9 flat config via `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No additional custom rules beyond Next.js defaults
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)

## Import Organization

**Order (observed pattern):**
1. Framework/runtime imports (`next/server`, `react`, `next/navigation`)
2. Third-party library imports (`@supabase/supabase-js`, `zod`, `sonner`, `lucide-react`)
3. Internal path-aliased imports using `@/` prefix (`@/lib/...`, `@/controllers/...`, `@/models/...`, `@/views/...`, `@/types`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All internal imports use `@/` — no relative `../` imports observed

**Directive placement:**
- `'use client'` at the very top of client components, before all imports
- Server Components have no directive (default in App Router)

## Error Handling

**API Routes:**
- All route handlers wrap controller calls in `try/catch`
- Input validated with Zod `safeParse` before hitting any logic
- First validation error message returned: `parsed.error.issues[0]?.message ?? 'Validation error'`
- Error responses always use `NextResponse.json({ error: message }, { status: 4xx })`
- Error coercion: `err instanceof Error ? err.message : 'Fallback string'`

Example from `src/app/api/jobs/create/route.ts`:
```typescript
try {
  // ... logic
  return NextResponse.json({ data: job }, { status: 201 })
} catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to create job'
  return NextResponse.json({ error: message }, { status: 400 })
}
```

**Model Layer:**
- On DB error for reads: return `null` or `[]` (silent failure)
- On DB error for writes: `throw new Error(error.message)` (propagated up)

Example from `src/models/userModel.ts`:
```typescript
// Read: silent null return
if (error) return null
// Write: throw
if (error) throw new Error(error.message)
```

**Client Components:**
- All async actions use `try/catch` with `toast.error(...)` for user-facing feedback
- Notification side-effects wrapped in nested `try/catch` with silent failure: `catch { // silent }`
- Loading state managed with `useState<string | null>(null)` keyed by action name

Example from `src/app/(client)/bookings/[id]/BookingActions.tsx`:
```typescript
try {
  await notifyUser(...)
} catch {
  // silent
}
toast.success('Action done!')
```

**Auth Guards:**
- Server pages: `if (!user) redirect('/login')` immediately after `supabase.auth.getUser()`
- API routes: `if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`

## Logging

**Framework:** None — `console.log` not observed in production code paths
**Approach:** User-facing feedback only via `sonner` toast notifications (`toast.error`, `toast.success`, `toast.info`)
**Server errors:** Thrown as `Error` objects and caught at the API route boundary

## Comments

**When to Comment:**
- Step separators in multi-step logic: `// 1. Create Supabase Auth user`
- Section dividers in large files: `// ============================================================`
- Deliberate workarounds: `// Use admin client so the INSERT into public.users bypasses RLS`
- In-JSX section labels: `{/* Header */}`, `{/* Active bookings */}`

**TSDoc:** Not used — no `/** ... */` documentation comments on exported functions

## Function Design

**Size:** Controllers are thin — they delegate to models with minimal business logic. Models contain query logic. Client components contain form/state logic inline.

**Parameters:** Model functions accept `SupabaseClient` as first argument, followed by typed params object for multi-field inputs. Single-value lookups use positional args.

Example:
```typescript
export async function createJob(
  supabase: SupabaseClient,
  params: { client_id: string; title: string; ... }
): Promise<Job>
```

**Return Values:**
- Reads return typed entity or `null`: `Promise<Job | null>`, `Promise<Job[]>`
- Writes return updated entity or `void`: `Promise<User | null>`, `Promise<void>`
- Explicit return type annotations on all exported model/controller functions

## Module Design

**Exports:**
- Named exports for all functions, components, and types
- No default exports except Next.js page components (`export default function XxxPage()`)
- Re-exports used in controllers to surface model functions: `export { getJobById, updateJobStatus }` in `src/controllers/jobController.ts`

**Barrel Files:** Not used — no `index.ts` aggregators in component or model directories

## Form Patterns

**Validation:** Zod schema defined at module level, `z.infer<typeof schema>` used as form type, `zodResolver` from `@hookform/resolvers/zod` passed to `useForm`

```typescript
const schema = z.object({ email: z.string().email(), ... })
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema) as Resolver<FormData>,
})
```

**Submission:** `handleSubmit(onSubmit)` bound to `<form>`, `onSubmit` is async with `setLoading(true/false)` in try/finally

## Tailwind CSS Patterns

**Class merging:** `cn()` utility from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) used for conditional class composition in all components

**Design tokens (consistent values observed):**
- Primary color: `indigo-600` / `indigo-500`
- Secondary: `cyan-500`
- Backgrounds: `white`, `slate-50`
- Text hierarchy: `slate-900` (primary), `slate-700` (secondary), `slate-500` (muted), `slate-400` (placeholder)
- Border: `slate-100`, `slate-200`
- Border radius: `rounded-xl` (inputs, buttons), `rounded-2xl` (cards)
- Minimum touch target: `min-h-[44px]` on interactive elements

---

*Convention analysis: 2026-03-06*
