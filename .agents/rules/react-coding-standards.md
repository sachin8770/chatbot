---
trigger: always_on
---
# React Coding Standards & File Structure
Reference source: https://github.com/hiteshchoudhary/chai-aur-react
Modeled specifically on the repo's capstone app, `12MegaBlog/`, which is
the only project in the repo built as a real multi-page application
(the other numbered folders — `01basicreact`, `02counter`,
`05passwordGenerator`, etc. — are single-concept practice apps and are
NOT the pattern to copy for new features).

Read this before writing or modifying any code in this project. Match
these conventions instead of introducing new ones, even if another
valid approach exists.

--------------------------------------------------------------------
## 1. TECH STACK (as used in the reference project)
--------------------------------------------------------------------
- Build tool: Vite
- UI library: React 18, plain JavaScript + JSX (no TypeScript)
- Styling: Tailwind CSS utility classes only (no CSS-in-JS, no SCSS)
- Routing: react-router-dom v6 (`createBrowserRouter`)
- Global state: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- Forms: react-hook-form
- Backend/data: a single external SDK (Appwrite in the reference)
  wrapped in hand-written service classes — treat this as the pattern
  for wrapping ANY backend/SDK (Firebase, Supabase, a REST client),
  not as an Appwrite-only rule.
- Linting: ESLint (`eslint:recommended`, `plugin:react/recommended`,
  `plugin:react/jsx-runtime`, `plugin:react-hooks/recommended`,
  `eslint-plugin-react-refresh`)

If the project you're working in uses a different backend SDK, form
library, or state library, keep the STRUCTURE and PATTERNS below and
substitute the library.

--------------------------------------------------------------------
## 2. PROJECT ROOT LAYOUT
--------------------------------------------------------------------
```
project-root/
├── public/                 -> static assets served as-is
├── src/                     -> all application source code
├── .env.sample              -> committed template of required env vars,
│                               values left blank/placeholder — never
│                               commit a real .env
├── .eslintrc.cjs
├── index.html                -> Vite entry HTML
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```
Rule: configuration files live at the root. All executable app code
lives under `src/`.

--------------------------------------------------------------------
## 3. `src/` FOLDER STRUCTURE & RESPONSIBILITIES
--------------------------------------------------------------------
```
src/
├── main.jsx              -> app bootstrap ONLY: mounts React to the
│                            DOM, wraps the tree in top-level providers
│                            (Redux <Provider>, <RouterProvider>), and
│                            defines the router's route tree.
├── App.jsx                -> root layout component rendered by every
│                            route (e.g. Header + <Outlet/> + Footer).
├── index.css / App.css     -> global styles + Tailwind directives only.
│
├── conf/
│   └── conf.js             -> ONE exported config object that reads
│                            every environment variable the app needs.
│                            No logic beyond reading + casting.
│
├── appwrite/  (rename to match your backend, e.g. `services/`,
│               `firebase/`, `api/`)
│   ├── auth.js              -> a class wrapping ALL authentication
│   │                          calls to the external SDK
│   └── config.js             -> a class wrapping ALL data/storage
│                              calls (CRUD, file upload) to the
│                              external SDK
│   Each file exports ONE singleton instance as its default export.
│
├── store/
│   ├── store.js             -> creates and exports the single Redux
│   │                          store; combines every slice's reducer
│   └── <domain>Slice.js       -> one slice file per state domain
│                              (e.g. authSlice.js). Exports its action
│                              creators (named) and reducer (default).
│
├── components/
│   ├── index.js              -> barrel file: imports every component
│   │                          and re-exports them all as named
│   │                          exports, so the rest of the app imports
│   │                          from "../components" or "../../components"
│   │                          instead of deep-pathing into subfolders.
│   ├── <SimpleThing>.jsx      -> a component with no closely related
│   │                          sub-parts sits directly in components/
│   │                          (e.g. Button.jsx, Input.jsx, Logo.jsx)
│   └── <ComplexThing>/
│       └── <ComplexThing>.jsx -> a component (or small family of
│                              related components, e.g. Header +
│                              LogoutBtn) gets its OWN subfolder named
│                              after it, PascalCase for a single
│                              component, lowercase-with-hyphen or
│                              lowercase for a multi-word grouping
│                              (the reference uses `Header/`, `Footer/`,
│                              `container/`, `post-form/` — match
│                              whichever casing already exists in the
│                              given project rather than mixing both)
│
└── pages/
    └── <RouteName>.jsx        -> one file per route/page. Pages COMPOSE
                                components and own data-fetching
                                (useEffect + service calls) and
                                page-level state; they are what the
                                router renders directly.
```

Rule: `components/` = reusable, mostly presentational building blocks.
`pages/` = route-level containers that fetch data and assemble
components. Don't fetch data inside a reusable component if a page can
own that responsibility instead.

--------------------------------------------------------------------
## 4. NAMING CONVENTIONS
--------------------------------------------------------------------
- Component files: `PascalCase.jsx`, one component per file, file name
  matches the component name exactly (`PostCard.jsx` exports `PostCard`).
- Redux slice files: `camelCaseSlice.js` (e.g. `authSlice.js`).
- Service/wrapper classes: `PascalCase` class name describing the
  domain (`AuthService`, `Service`), instantiated once, exported as a
  lowercase-named singleton (`authService`, `service`).
- Config/plain-object modules: `camelCase.js` (e.g. `conf.js`).
- Route/page components: named after the route/feature, not "Page"
  suffixed (`Home.jsx`, `AllPosts.jsx`, `AddPost.jsx`, not
  `HomePage.jsx`).
- Boolean-style component props get short, obvious names with sensible
  defaults declared in the destructuring, e.g. `authentication = true`.

--------------------------------------------------------------------
## 5. COMPONENT CONVENTIONS
--------------------------------------------------------------------
- Functional components only. No class components (the one class-like
  pattern in this codebase is the service-wrapper layer, never a UI
  component).
- Default export per component file; barrel file re-exports as named.
- Props are destructured in the function signature, with default
  values inline:
  ```jsx
  export default function Button({
      children,
      type = "button",
      bgColor = "bg-blue-600",
      textColor = "text-white",
      className = "",
      ...props
  }) {
      return (
          <button className={`px-4 py-2 rounded-lg ${bgColor} ${textColor} ${className}`} {...props}>
              {children}
          </button>
      );
  }
  ```
- Always spread `...props` onto the underlying DOM element for
  low-level reusable components (`Input`, `Button`, `Select`) so
  native attributes and event handlers still pass through.
- Use `React.forwardRef` for any input-like component that a form
  library needs to attach a ref to (see `Input.jsx`), combined with
  `useId()` for generating a label/input `id` pairing instead of a
  hardcoded id.
- Layout/wrapper components that gate rendering (auth guards, loading
  states) take a `children` prop and return `children` directly once
  their condition is satisfied — don't build a separate "layout"
  abstraction for this.
- Pull global state via `useSelector` directly inside whatever
  component needs it (including deeply nested ones like a form) rather
  than prop-drilling it down from a page.

--------------------------------------------------------------------
## 6. BARREL EXPORTS (`components/index.js`)
--------------------------------------------------------------------
Every component, however deep its subfolder, gets one import line in
`components/index.js` and one line in its `export { ... }` block:
```js
import Header from "./Header/Header";
import PostForm from "./post-form/PostForm";
// ...one import per component

export {
    Header,
    PostForm,
    // ...same names, alphabetized loosely by relation, not strict A-Z
}
```
Everywhere else in the app, import components as:
```js
import { Header, Footer, Container } from "../components";
```
never as a deep relative path like `../components/Header/Header`,
EXCEPT from inside `components/index.js` itself. A component that
imports a sibling from within `components/` may import from the
barrel one level up (`import { Button } from ".."`).
When you add a new component, you MUST add it to this barrel file in
the same change — a component that exists but isn't exported here is
considered incomplete.

--------------------------------------------------------------------
## 7. SERVICE LAYER (WRAPPING AN EXTERNAL SDK / BACKEND)
--------------------------------------------------------------------
- One class per responsibility area, not one class for the whole
  backend: e.g. `AuthService` for auth, `Service` for
  database+storage. Split further if a third area emerges (e.g.
  payments).
- The class holds the SDK client as a class field, configured from the
  central `conf` object in its constructor:
  ```js
  export class AuthService {
      client = new Client();
      account;

      constructor() {
          this.client
              .setEndpoint(conf.appwriteUrl)
              .setProject(conf.appwriteProjectId);
          this.account = new Account(this.client);
      }

      async login({ email, password }) {
          try {
              return await this.account.createEmailSession(email, password);
          } catch (error) {
              throw error;
          }
      }
  }

  const authService = new AuthService();
  export default authService;
  ```
- Export exactly ONE singleton instance as the default export. The
  rest of the app imports and calls that instance directly — never
  instantiate the service class anywhere else.
- Every method wraps its SDK call in `try/catch`. Methods central to
  app flow (login, create account) re-throw so the caller can react;
  methods that are safe to fail silently (get current user, delete a
  file) log the error and return `null`/`false` instead of throwing —
  match this per-method, don't pick one style for the whole class.
- Log format for the swallowed-error case:
  `console.log("<ServiceName> :: <methodName> :: error", error)` —
  keep this "service :: method :: error" shape so errors are greppable.
- Data-shaping happens in the CALLER (e.g. a page pulls `.documents`
  off the response) — the service methods return the raw SDK response,
  they don't reshape it.

--------------------------------------------------------------------
## 8. CONFIG & ENVIRONMENT VARIABLES
--------------------------------------------------------------------
- Every secret/environment-dependent value is read in exactly ONE
  place: `src/conf/conf.js`, as a single exported object:
  ```js
  const conf = {
      appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
      appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
  }
  export default conf
  ```
- Every value is explicitly cast with `String(...)` even though Vite
  env vars are already strings — keep this cast for consistency with
  the existing config.
- Env var names are `SCREAMING_SNAKE_CASE` and, since this is a Vite
  app, MUST be prefixed `VITE_` to be exposed to client code.
- `.env.sample` at the project root lists every required key with an
  empty or placeholder value and IS committed. The real `.env` is
  never committed.
- No file other than `conf.js` reads `import.meta.env` directly.

--------------------------------------------------------------------
## 9. STATE MANAGEMENT (REDUX TOOLKIT)
--------------------------------------------------------------------
- One slice file per state domain in `store/`, using `createSlice`:
  ```js
  const authSlice = createSlice({
      name: "auth",
      initialState: { status: false, userData: null },
      reducers: {
          login: (state, action) => {
              state.status = true;
              state.userData = action.payload.userData;
          },
          logout: (state) => {
              state.status = false;
              state.userData = null;
          },
      },
  });

  export const { login, logout } = authSlice.actions;
  export default authSlice.reducer;
  ```
- `store/store.js` is the ONLY file that calls `configureStore`, and
  the only file that imports every slice reducer to combine them.
- Component code reads state with `useSelector(state => state.<slice>.<field>)`
  and dispatches with the slice's named action creators via
  `useDispatch()` — never dispatch a hand-built plain action object.
- Keep derived/local UI state (form inputs, a loading flag, a modal's
  open state) in `useState` inside the component. Only promote state
  to a Redux slice when more than one unrelated part of the app needs
  it (the reference only has an `auth` slice for this reason).

--------------------------------------------------------------------
## 10. ROUTING (react-router-dom v6)
--------------------------------------------------------------------
- Router is defined once, in `main.jsx`, with `createBrowserRouter`
  and a nested route tree: a root path renders the root `<App/>`
  layout, and every page is a `children` entry under it.
- Pages that require a specific auth state are not wrapped in
  route-level logic — they're wrapped in a reusable guard component
  (`AuthLayout` in the reference) that takes an `authentication`
  boolean prop and the page as `children`:
  ```jsx
  {
      path: "/add-post",
      element: (
          <AuthLayout authentication>
              <AddPost />
          </AuthLayout>
      ),
  }
  ```
- The guard component itself (not the router) contains the redirect
  logic: it reads auth state via `useSelector`, compares it to the
  `authentication` prop, calls `useNavigate()` if they don't match,
  and renders a simple loading state until that check has run once.
- Dynamic segments use the standard `:param` syntax (`/post/:slug`,
  `/edit-post/:slug`) and are read in the page via `useParams()`.

--------------------------------------------------------------------
## 11. FORMS (react-hook-form)
--------------------------------------------------------------------
- Destructure exactly what you need off `useForm()`:
  `register, handleSubmit, watch, setValue, control, getValues`.
- Seed `defaultValues` from an optional incoming entity prop, falling
  back per-field with `?.` and `||`, so the SAME form component
  handles both "create" and "edit":
  ```js
  defaultValues: {
      title: post?.title || "",
      slug: post?.$id || "",
  }
  ```
- Wire plain inputs with `{...register("fieldName", { required: true })}`
  spread directly onto the shared `Input`/`Select` components (which
  must be `forwardRef` for this to work).
- Use `control` + a dedicated wrapper component (not `register`) for
  any non-native input that needs full control of its value, e.g. a
  rich text editor.
- Derive one field from another with `watch` + `useEffect` +
  `setValue`, cleaning up the subscription on unmount:
  ```js
  useEffect(() => {
      const subscription = watch((value, { name }) => {
          if (name === "title") setValue("slug", slugTransform(value.title));
      });
      return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);
  ```
- The submit handler branches on whether the "edit" entity prop was
  passed, to decide between an update-service-call and a
  create-service-call, then navigates on success.

--------------------------------------------------------------------
## 12. STYLING (Tailwind CSS)
--------------------------------------------------------------------
- Utility classes only, written inline in `className`. No separate
  stylesheet per component, no CSS modules, no styled-components.
- Reusable components accept a `className` prop (default `""`) and
  append it to their own base classes via a template literal, so
  callers can extend/override styling without editing the component:
  `` `px-3 py-2 rounded-lg ... ${className}` ``
- Similarly expose the small set of visually-variable Tailwind classes
  as props with sensible defaults (`bgColor = "bg-blue-600"`) rather
  than hardcoding them, when a component is meant to be reused in more
  than one visual context.
- Global `index.css`/`App.css` hold only the Tailwind `@tailwind`
  directives and truly global rules — not component styling.

--------------------------------------------------------------------
## 13. LINTING / CODE QUALITY
--------------------------------------------------------------------
- ESLint extends `eslint:recommended`, `plugin:react/recommended`,
  `plugin:react/jsx-runtime` (no need to `import React` just for JSX,
  though the reference code still does so in most files — follow
  whichever convention the specific file you're editing already uses),
  and `plugin:react-hooks/recommended` — respect the rules of hooks
  (no conditional hooks, correct dependency arrays).
- `eslint-plugin-react-refresh` is enabled with
  `allowConstantExport: true` — a file can export a component plus a
  small constant, but avoid exporting large unrelated values from a
  component file.
- Run the existing `lint` script before considering a change done.

--------------------------------------------------------------------
## 14. QUICK CHECKLIST FOR THE AGENT
--------------------------------------------------------------------
[ ] New component → own file, PascalCase, default export
[ ] Component has related sub-parts → own subfolder
[ ] New component added to `components/index.js` in the same change
[ ] Reusable/low-level component accepts `className` + `...props`
    and forwards them
[ ] Any new backend/SDK call goes through a service class in the
    services folder, never called directly from a component
[ ] Service class = one singleton default export, methods wrapped in
    try/catch, consistent swallow-vs-rethrow choice per method
[ ] New env var → added to `.env.sample`, read only in `conf.js`,
    `VITE_`-prefixed
[ ] New cross-cutting state → a Redux Toolkit slice in `store/`,
    registered in `store.js`; local-only state stays in `useState`
[ ] New protected/public page → added as a router child in
    `main.jsx`, wrapped in the auth guard component if needed
[ ] New form → react-hook-form (`register`/`handleSubmit`/`control`),
    reuses the shared `Input`/`Select`/`Button` components
[ ] Styling is Tailwind utility classes only, no new stylesheet files
[ ] Pages fetch data / own page-level state; components stay
    presentational and reusable
