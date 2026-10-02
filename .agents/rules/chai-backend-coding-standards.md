---
trigger: always_on
---
# Backend Coding Standards & File Structure
Reference source: https://github.com/hiteshchoudhary/chai-backend

Read this before writing or modifying any code in this project. Match
these conventions exactly instead of introducing new ones, even if
another valid approach exists. This is the STACK-SPECIFIC companion to
the generic structure rules — use this one whenever the project you're
coding in is actually Node.js/Express/MongoDB (or close enough to
follow the same libraries); use the generic version when the stack
differs.

--------------------------------------------------------------------
## 1. TECH STACK (as used in the reference project)
--------------------------------------------------------------------
- Runtime/framework: Node.js + Express 4, ES Modules (`"type": "module"`
  in package.json — use `import`/`export`, never `require`)
- Database/ODM: MongoDB via Mongoose 8
- Auth: JWT (`jsonwebtoken`) access + refresh token pair, `bcrypt` for
  password hashing
- File upload: `multer` (disk storage, local temp folder) →
  `cloudinary` (permanent hosted storage)
- Cross-cutting: `cors`, `cookie-parser`, `dotenv`
- Dev tooling: `nodemon` for the dev script, `prettier` for formatting
- No test framework, no TypeScript, no ORM other than Mongoose

--------------------------------------------------------------------
## 2. PROJECT ROOT LAYOUT
--------------------------------------------------------------------
```
project-root/
├── public/
│   └── temp/              -> multer's local upload destination; files
│                             here are transient (uploaded to Cloudinary,
│                             then deleted) — keep a .gitkeep, not the
│                             uploaded files, under version control
├── src/                    -> all application source code
├── .env.sample              -> every required env var, committed with
│                             placeholder values — real .env is
│                             git-ignored, never committed
├── .gitignore
├── .prettierrc               -> see Section 10, formatting is
│                             enforced by this file, not by eyeballing
├── .prettierignore
├── package.json
└── Readme.md
```

--------------------------------------------------------------------
## 3. `src/` FOLDER STRUCTURE & RESPONSIBILITIES
--------------------------------------------------------------------
```
src/
├── index.js            -> ENTRY POINT ONLY. Loads dotenv, calls
│                        connectDB(), and only starts app.listen()
│                        inside connectDB()'s .then(). Never put route
│                        or business logic here.
├── app.js               -> creates the Express app, registers global
│                        middleware (cors, json/urlencoded parsers,
│                        static, cookieParser), imports every router,
│                        and mounts each with app.use(). Exports the
│                        app instance — kept separate from index.js so
│                        the app can be imported without starting a
│                        server.
├── constants.js          -> plain exported constants (e.g. DB_NAME).
│                        No logic.
├── db/
│   └── index.js           -> ONE function (connectDB) that connects
│                        Mongoose to MongoDB and logs success/failure.
│                        process.exit(1) on failure. Nothing else
│                        lives in this file.
├── models/
│   └── <entity>.model.js    -> one Mongoose Schema + model per entity.
│                        See Section 5.
├── controllers/
│   └── <resource>.controller.js -> business logic, one file per
│                        resource, matching the resource's route file
│                        name. See Section 6.
├── routes/
│   └── <resource>.routes.js -> Express Router wiring path+middleware
│                        to controller functions. See Section 7.
├── middlewares/
│   └── <purpose>.middleware.js -> reusable request interceptors
│                        (auth.middleware.js, multer.middleware.js).
│                        See Section 8.
└── utils/
    ├── ApiError.js       -> shared error class
    ├── ApiResponse.js     -> shared success-response class
    ├── asyncHandler.js    -> shared async try/catch wrapper
    └── cloudinary.js       -> wrapper around one external service SDK
                            (add one file like this per external
                            service, e.g. a future stripe.js or
                            razorpay.js)
```

--------------------------------------------------------------------
## 4. NAMING CONVENTIONS
--------------------------------------------------------------------
- `<resource>.model.js`, `<resource>.controller.js`,
  `<resource>.routes.js`, `<purpose>.middleware.js` — the `<resource>`
  segment must match across model/controller/routes for the same
  resource (`video.model.js` + `video.controller.js` + `video.routes.js`).
- Model files export a PascalCase, singular model name as a NAMED
  export: `export const User = mongoose.model("User", userSchema)`.
  The Mongoose collection name (auto-pluralized/lowercased by
  Mongoose) is never referenced directly elsewhere — always import
  and use the model.
- Controller functions are camelCase verbs describing the action:
  `registerUser`, `loginUser`, `refreshAccessToken`,
  `updateUserAvatar` — named exports, exported together in one
  `export { ... }` block at the bottom of the file.
- Router instance is always named `router` inside a routes file;
  file's default export is that router.
- Utility classes are PascalCase nouns (`ApiError`, `ApiResponse`);
  utility functions are camelCase verbs (`asyncHandler`, `connectDB`,
  `uploadOnCloudinary`).
- Route paths are kebab-case, action-oriented for non-CRUD endpoints:
  `/refresh-token`, `/change-password`, `/current-user`,
  `/update-account`, not `/updateAccount`.

--------------------------------------------------------------------
## 5. MODEL CONVENTIONS (Mongoose)
--------------------------------------------------------------------
- Declare field-level constraints directly in the schema definition:
  `required`, `unique`, `lowercase`, `trim`, `index` — don't validate
  these by hand in the controller if Mongoose can enforce them.
- Always pass `{ timestamps: true }` as the schema's second argument.
- Logic that is intrinsic to the entity itself lives on the schema,
  not in a controller or util:
  - A `pre("save", ...)` hook for anything that must happen every time
    a document is saved (e.g. hashing the password), always guarded so
    it only runs when relevant:
    ```js
    userSchema.pre("save", async function (next) {
        if (!this.isModified("password")) return next();
        this.password = await bcrypt.hash(this.password, 10);
        next();
    });
    ```
  - Instance methods (`schema.methods.<name>`) for behavior that
    belongs to a single document, e.g. `isPasswordCorrect(password)`,
    `generateAccessToken()`, `generateRefreshToken()`. Controllers call
    `user.generateAccessToken()`, they never reimplement token signing
    inline.
- Relationships are modeled with `Schema.Types.ObjectId` + `ref`
  (e.g. `watchHistory` on the user referencing `"Video"`), not
  denormalized copies of the related data.

--------------------------------------------------------------------
## 6. CONTROLLER CONVENTIONS
--------------------------------------------------------------------
This is the core logic layer — follow this shape for every new
controller function:

1. **Wrap every controller in `asyncHandler`** — never write a bare
   `async (req, res) => {}` route handler.
2. **Open with a short numbered comment plan** before writing the
   implementation, in plain language, e.g.:
   ```js
   const registerUser = asyncHandler(async (req, res) => {
       // get user details from frontend
       // validation - not empty
       // check if user already exists: username, email
       // upload to cloudinary, avatar
       // create user object - create entry in db
       // remove password and refresh token field from response
       // check for user creation
       // return res
       ...
   });
   ```
   Keep this comment plan even in the final code — it documents intent
   inline. This is a deliberate habit in this codebase, not
   leftover scaffolding to delete.
3. **Destructure inputs immediately**: `const { fullName, email, ... } = req.body`.
4. **Validate with a short-circuit + `ApiError`**, not a validation
   library:
   ```js
   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
       throw new ApiError(400, "All fields are required");
   }
   ```
5. **Check for conflicts/existence with a direct query**, throwing a
   descriptive `ApiError` with the right status code (`409` for
   conflict, `404` for not found, `401` for auth failure):
   ```js
   const existedUser = await User.findOne({ $or: [{ username }, { email }] });
   if (existedUser) throw new ApiError(409, "User with email or username already exists");
   ```
6. **Never construct or send an error response by hand** — always
   `throw new ApiError(statusCode, message)` and let `asyncHandler`
   forward it via `next(err)`.
7. **On success, always respond the same way**:
   ```js
   return res.status(200).json(new ApiResponse(200, data, "Human-readable message"));
   ```
8. **Re-fetch sensitive documents with excluded fields** rather than
   deleting fields off an in-memory object:
   `User.findById(user._id).select("-password -refreshToken")`.
9. **Small helpers used by only one controller file** (e.g.
   `generateAccessAndRefereshTokens`) are defined at the top of that
   controller file, not exported, and not moved to `utils/` — they
   only get promoted to `utils/` once more than one controller needs
   them.
10. An unfinished controller is left as a stub with a `// TODO:`
    comment describing what it must do and wrapped in `asyncHandler`
    with an empty body — not deleted, not half-implemented silently.

--------------------------------------------------------------------
## 7. ROUTES CONVENTIONS
--------------------------------------------------------------------
- One `Router()` instance per file, default-exported.
- Import every controller function used, by name, from the matching
  controller file.
- Chain HTTP verbs off a single `router.route(path)` call when a path
  supports multiple verbs is not required — otherwise one
  `router.route(path).verb(...)` per line.
- Insert middleware as extra arguments before the controller,
  left-to-right in execution order:
  `router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)`.
- Group routes with a plain comment separating access levels:
  `//secured routes` above anything requiring `verifyJWT`.
- Mount every resource router in `app.js` under a versioned base path:
  `app.use("/api/v1/<resource>", <resource>Router)`.

--------------------------------------------------------------------
## 8. MIDDLEWARE CONVENTIONS
--------------------------------------------------------------------
- Named export (not default) so intent is explicit at the import site:
  `export const verifyJWT = asyncHandler(async (req, _, next) => {...})`.
- Auth middleware reads the token from either the cookie or the
  `Authorization` header, verifies it, loads the referenced user
  (excluding sensitive fields), attaches it to `req.user`, then calls
  `next()`. On any failure, `throw new ApiError(401, ...)` — same
  error contract as controllers.
- Upload middleware (multer) is configured once, exported as `upload`,
  and applied per-route with `.single(field)` or
  `.fields([{name, maxCount}, ...])` depending on how many files that
  endpoint accepts.

--------------------------------------------------------------------
## 9. UTILS CONVENTIONS
--------------------------------------------------------------------
- `ApiError` (extends `Error`): constructor takes
  `(statusCode, message, errors = [], stack = "")`, sets
  `success = false` and `data = null`, captures a stack trace when one
  isn't passed in. This is the ONLY way controllers/middleware signal
  a failure.
- `ApiResponse`: constructor takes `(statusCode, data, message = "Success")`
  and derives `success = statusCode < 400`. This is the ONLY way
  controllers send a successful payload.
- `asyncHandler`: a higher-order function —
  `(requestHandler) => (req, res, next) => Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))`
  — every controller and every async middleware is passed through
  this before being handed to Express.
- A wrapper around each external service gets its own file in
  `utils/` (`cloudinary.js` here). The wrapper:
  - configures the SDK client from `process.env` once, at module load
  - exposes one small function per operation actually needed
    (`uploadOnCloudinary`), not a pass-through of the whole SDK
  - catches its own errors, cleans up any local temp resource in
    BOTH the success and failure path (`fs.unlinkSync(localFilePath)`),
    and returns `null` on failure instead of throwing — the calling
    controller decides what a `null` result means (usually another
    `ApiError`).

--------------------------------------------------------------------
## 10. RESPONSE / ERROR CONTRACT
--------------------------------------------------------------------
Every endpoint returns one of these two JSON shapes — never a raw
object, string, or Mongoose document:
```
Success: { statusCode, data, message, success: true }
Error:   { statusCode, data: null, message, success: false, errors: [] }
```
Controllers never deviate from this by hand-building `res.json({...})`
— always go through `new ApiResponse(...)` or `throw new ApiError(...)`.

--------------------------------------------------------------------
## 11. AUTH & SESSION CONVENTIONS
--------------------------------------------------------------------
- Two tokens: a short-lived access token and a longer-lived refresh
  token, both generated by instance methods on the `User` model, both
  signed with their own secret + expiry pulled from env vars
  (`ACCESS_TOKEN_SECRET`/`ACCESS_TOKEN_EXPIRY`,
  `REFRESH_TOKEN_SECRET`/`REFRESH_TOKEN_EXPIRY`).
- On login, the refresh token is persisted on the user document
  (`user.refreshToken = refreshToken; await user.save({ validateBeforeSave: false })`)
  so it can be checked against on refresh.
- Both tokens are sent to the client as cookies using one shared
  options object: `{ httpOnly: true, secure: true }` — never sent as
  plain JSON fields alongside the cookies unless the response body
  also needs them (login does include them in the body too; logout
  does not).
- Logout clears the stored refresh token with
  `findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }, { new: true })`,
  then `.clearCookie(...)` for both tokens — it does not delete the
  user document or touch any other field.
- The refresh endpoint re-verifies the incoming refresh token against
  both the JWT signature AND the value stored on the user document
  before issuing a new pair.

--------------------------------------------------------------------
## 12. FILE UPLOAD CONVENTIONS
--------------------------------------------------------------------
1. `multer` disk storage writes the incoming file to `./public/temp`
   with its original filename.
2. The controller reads the local path off
   `req.file(s)?.<field>[0]?.path`, guarding with optional chaining —
   for optional files, check `Array.isArray(...)` and length before
   accessing index 0.
3. The controller calls the relevant `utils/` upload wrapper
   (`uploadOnCloudinary`) with that local path.
4. If the upload wrapper returns `null`/falsy for a REQUIRED file, the
   controller throws an `ApiError` — the local temp file has already
   been cleaned up by the wrapper itself either way.
5. Only the hosted URL (`avatar.url`) is persisted to the database —
   never the local temp path.

--------------------------------------------------------------------
## 13. CONFIG & ENVIRONMENT VARIABLES
--------------------------------------------------------------------
- `dotenv.config({ path: './.env' })` is called exactly once, in
  `src/index.js`, before anything else runs.
- This repo does NOT centralize env vars into one config object —
  `process.env.<VAR>` is read directly, at the point of use, in
  whichever file needs it (models, controllers, db/index.js,
  utils/cloudinary.js, app.js). Match this — don't introduce a
  central `conf.js` here unless asked to refactor.
- Every var used anywhere in the code must have a corresponding
  placeholder line added to `.env.sample`, committed. The real `.env`
  stays git-ignored.
- Non-secret fixed values (e.g. the DB name) go in `constants.js`
  instead of an env var.

--------------------------------------------------------------------
## 14. FORMATTING (enforced by `.prettierrc`)
--------------------------------------------------------------------
```json
{
    "singleQuote": false,
    "bracketSpacing": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "semi": true
}
```
Double quotes, 2-space indentation, semicolons required, ES5-style
trailing commas. Run Prettier rather than hand-matching whatever
indentation happens to appear in a given file — some existing files in
this repo predate consistent formatting.

--------------------------------------------------------------------
## 15. QUICK CHECKLIST FOR THE AGENT
--------------------------------------------------------------------
[ ] New resource → matching trio of files: `<name>.model.js`,
    `<name>.controller.js`, `<name>.routes.js`
[ ] Every controller wrapped in `asyncHandler`, opens with a short
    numbered comment plan
[ ] Validation and failure paths use `throw new ApiError(code, msg)` —
    never a hand-built error response
[ ] Every success path returns `new ApiResponse(code, data, msg)`
[ ] Entity-intrinsic logic (hashing, token generation, comparisons)
    lives on the Mongoose schema as a `pre` hook or instance method,
    not in the controller
[ ] Sensitive fields excluded via `.select("-field1 -field2")` on
    re-fetch, not deleted from an in-memory object
[ ] New route registered in its `<resource>.routes.js`, and that
    router mounted in `app.js` under `/api/v1/<resource>`
[ ] New middleware is a named export, wrapped in `asyncHandler` if
    async, throws `ApiError` on failure
[ ] New external-service integration gets its own file in `utils/`,
    configured from `process.env`, catches its own errors, returns
    `null`/falsy on failure instead of throwing
[ ] New env var added to `.env.sample`, read inline via `process.env`
    (no new central config file)
[ ] Code formatted per `.prettierrc` (double quotes, 2-space indent,
    semicolons, ES5 trailing commas)
