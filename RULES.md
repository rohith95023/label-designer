**PROJECT ARCHITECTURE**

**& ENGINEERING RULES**

_Product Requirements Document - Universal Developer Standard_

| **12**<br><br>Core Rules | **100+**<br><br>Code Examples | **10**<br><br>Principles |
| ------------------------ | ----------------------------- | ------------------------ |

# Overview & Purpose

This PRD defines the **non-negotiable engineering standards** that every developer must follow on every project. These rules are tech-stack agnostic - they apply equally to Node.js, Python, React, Django, or any modern framework. They exist not to restrict, but to ensure the team moves faster, safer, and with fewer surprises as the codebase grows.

| **Principle**  | **Goal**                                                           |
| -------------- | ------------------------------------------------------------------ |
| Predictability | Any developer can find any file in under 30 seconds                |
| Replaceability | Swap any module (DB, cache, email) without touching business logic |
| Safety         | Bad code fails early, loudly, and with a clear error message       |
| Scalability    | Adding a new feature never requires editing 10+ existing files     |
| Readability    | Code reads like plain English without needing to run it            |

| **1** | **Project Architecture & Folder Structure** |
| ----- | ------------------------------------------- |

## 1.1 Universal Folder Structure

Adapt layer names to your stack, but the concepts are mandatory across all projects.

src/

config/ ← App configuration & env loading

constants/ ← Magic numbers & string constants

controllers/ ← HTTP request handlers (thin layer)

services/ ← Business logic lives here

repositories/ ← All database access code

models/ ← Data models / schemas

middlewares/ ← Cross-cutting concerns (auth, logging)

routes/ ← URL definitions only

utils/ ← Pure helper functions (no side effects)

validators/ ← Input validation schemas

app.js ← App bootstrap / entry point

tests/ ← Mirror src/ structure: unit/ + integration/

docs/ ← Documentation

.env ← NEVER commit

.env.example ← Always commit

| **📌** | **GOLDEN RULE: If a new developer cannot find any file within 30 seconds, your folder structure needs improvement.** |
| ------ | -------------------------------------------------------------------------------------------------------------------- |

## 1.2 Layer Responsibility Chart

| **Layer**  | **Responsibility**                             | **Must NOT Do**                      |
| ---------- | ---------------------------------------------- | ------------------------------------ |
| Controller | Receive request, call service, return response | Contain business logic or DB queries |
| Service    | Implement business rules and workflows         | Directly access the database         |
| Repository | Execute all database queries                   | Contain business logic               |
| Model      | Define data shape and schema                   | Process or transform data            |
| Middleware | Cross-cutting concerns: auth, logging          | Business logic                       |
| Utils      | Pure helper functions                          | Have side-effects or DB access       |
| Config     | Load environment & config values               | Hardcode values                      |

| **✅** | **KEY INSIGHT: Each layer ONLY talks to the layer directly below it. Controllers never touch the DB. Services never read HTTP headers. This one rule prevents 80% of architectural mistakes.** |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **2** | **SOLID Principles - Clean Code Design** |
| ----- | ---------------------------------------- |

**S** - Single Responsibility | **O** - Open/Closed | **L** - Liskov Substitution | **I** - Interface Segregation | **D** - Dependency Inversion

## 2.1 S - Single Responsibility Principle (SRP)

A class or function should have ONE reason to change. Do ONE thing and do it well.

- **Controller** - only handles HTTP in/out
- **Service** - only runs business logic
- **Repository** - only executes DB queries

## 2.2 O - Open/Closed Principle (OCP)

Open for extension, closed for modification. Add new behavior via new classes - never by editing existing ones.

| **✅** | **Adding a new payment method = new file only. Zero changes to existing code or the core processPayment function.** |
| ------ | ------------------------------------------------------------------------------------------------------------------- |

## 2.3 L - Liskov Substitution Principle (LSP)

Subclasses must be drop-in replacements for their parent. If a function accepts a Shape, it must work with Circle and Square without checking types.

## 2.4 I - Interface Segregation Principle (ISP)

Never force a class to implement methods it doesn't use. Prefer many small, focused interfaces over one large one.

- Dog should not inherit from a class that forces it to implement fly().
- Decompose large interfaces into Swimmer, Flyer, Runner, etc.

## 2.5 D - Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Inject dependencies - never hardcode them.

// ❌ BAD

class UserService { constructor() { this.repo = new MySQLUserRepository(); } }

// ✅ GOOD

class UserService { constructor(userRepository) { this.repo = userRepository; } }

const service = new UserService(new MySQLUserRepository()); // prod

const testSvc = new UserService(new MockUserRepository()); // test

| **🎯** | **QUICK TEST: Can you swap MySQL → PostgreSQL without changing your service files? If yes, DIP is correctly applied.** |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |

| **3** | **Centralized Data Access - Repository Pattern** |
| ----- | ------------------------------------------------ |

All database operations live in dedicated repository files. If a query changes, you change it in ONE place - never in 15 controllers.

| **💡** | **RULE: No service or controller should ever contain a raw SQL query or ORM call. Every database interaction must go through a repository.** |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |

## 3.1 BaseRepository (reusable across all entities)

class BaseRepository {

constructor(model) { this.model = model; }

async findById(id) { return this.model.findByPk(id); }

async findAll(filters={}) { return this.model.findAll({ where: filters }); }

async create(data) { return this.model.create(data); }

async update(id, data) { return this.model.update(data, { where: { id } }); }

async delete(id) { return this.model.destroy({ where: { id } }); }

}

## 3.2 Entity Repository Pattern

class UserRepository extends BaseRepository {

constructor() { super(User); }

async findByEmail(email) {

return this.model.findOne({ where: { email, deletedAt: null } });

// Soft-delete filter maintained in ONE place

}

}

| **4** | **Environment Variable Management** |
| ----- | ----------------------------------- |

Environment variables separate configuration from code. The same codebase runs in dev, staging, and production with zero code changes.

| **File**     | **Purpose**                                         | **Git Status**   |
| ------------ | --------------------------------------------------- | ---------------- |
| .env         | Actual secrets for your machine                     | 🔴 NEVER commit  |
| .env.example | Template showing all required keys (no real values) | ✅ Always commit |
| .env.test    | Values for test environment                         | 🔴 NEVER commit  |

## 4.1 Centralized Config Loader

Never read process.env directly in business logic. Create a config module that validates and exports everything.

// src/config/app.config.js

require('dotenv').config();

const REQUIRED = \['DB_HOST', 'DB_PASSWORD', 'JWT_SECRET'\];

const missing = REQUIRED.filter(key => !process.env\[key\]);

if (missing.length > 0) throw new Error(\`Missing env vars: \${missing.join(', ')}\`);

module.exports = {

app: { env: process.env.NODE_ENV || 'development', port: parseInt(process.env.PORT)||3000 },

database: { host: process.env.DB_HOST, password: process.env.DB_PASSWORD },

jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN||'7d' },

};

| **🚨** | **SECURITY RULE: Run \`grep -r 'process.env' src/\` monthly. Any direct access outside config/ is a code smell and must be refactored immediately.** |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |

| **5** | **Reducing Hardcoding - Constants Files** |
| ----- | ----------------------------------------- |

Every magic number and string must live in a named constant. Hardcoded values make changes dangerous and intent invisible.

## 5.1 What Counts as Hardcoding?

if (user.role === 'admin') {} // ❌ magic string

if (items.length > 100) {} // ❌ magic number

setTimeout(callback, 86400000) // ❌ what is 86400000??

if (status === 3) {} // ❌ what does 3 mean?

## 5.2 The Fix - Freeze Constants

const USER_ROLES = Object.freeze({ ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' });

const USER_STATUS = Object.freeze({ ACTIVE: 1, INACTIVE: 2, BANNED: 3 });

const TIME_MS = Object.freeze({ ONE_HOUR: 3_600_000, ONE_DAY: 86_400_000 });

const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 10, MAX_LIMIT: 100 });

// Usage:

if (user.role === USER_ROLES.ADMIN) {} // ✅ clear

setTimeout(fn, TIME_MS.ONE_DAY) // ✅ readable

| **🔒** | **PRO TIP: Always use Object.freeze() on constants objects. It prevents accidental mutation anywhere in the codebase and makes intent explicit.** |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |

| **6** | **Naming Conventions** |
| ----- | ---------------------- |

If you have to read the function body to understand what it does, the name has failed.

| **Category**   | **Convention**    | **Example**                                 |
| -------------- | ----------------- | ------------------------------------------- |
| Variables      | camelCase         | userName, isLoggedIn, totalPrice            |
| Functions      | camelCase + verb  | getUserById(), sendEmail(), validateInput() |
| Classes        | PascalCase        | UserService, OrderRepository                |
| Constants      | SCREAMING_SNAKE   | MAX_RETRIES, JWT_SECRET, BASE_URL           |
| Files          | kebab-case        | user.service.js, order-detail.component.jsx |
| DB Tables      | snake_case plural | user_profiles, order_items                  |
| API Routes     | kebab-case        | /api/user-profiles, /api/order-items        |
| Booleans       | is/has/can prefix | isActive, hasPermission, canEdit            |
| Event Handlers | handle prefix     | handleSubmit, handleClick                   |

## 6.1 File Naming Pattern

**Pattern:** &lt;entity&gt;.&lt;layer&gt;.&lt;extension&gt;

user.controller.js ← HTTP layer

user.service.js ← Business logic

user.repository.js ← DB access

user.model.js ← Schema

user.validator.js ← Input validation

user.test.js ← Unit tests

user.constants.js ← Domain constants

| **✅** | **BENEFIT: Searching 'user.' instantly surfaces ALL user-related files in any IDE.** |
| ------ | ------------------------------------------------------------------------------------ |

| **7** | **Documentation in Every File** |
| ----- | ------------------------------- |

| **Level**       | **What**                                      | **When**                          |
| --------------- | --------------------------------------------- | --------------------------------- |
| File Header     | Purpose, module description, dependencies     | Every file                        |
| Function/Method | What it does, params, return, throws, example | Every public function             |
| Inline Comment  | WHY something is done (not WHAT)              | Complex or non-obvious logic only |

## 7.1 Function JSDoc Template

/\*\*

\* Creates a new user account with hashed password.

\*

\* @param {Object} userData

\* @param {string} userData.email - Must be unique

\* @param {string} userData.password - Plain text (will be hashed)

\*

\* @returns {Promise&lt;User&gt;} Created user (password excluded)

\* @throws {ConflictError} If email already exists

\* @throws {ValidationError} If input is invalid

\*/

async function createUser(userData) { ... }

## 7.2 Comment the WHY, Not the WHAT

// ❌ BAD - just restates the code

i++; // increment i

// ✅ GOOD - explains the WHY

// Cost factor 12 per 2024 OWASP recommendations (not default 10)

const hash = await bcrypt.hash(password, 12);

// Retry up to 3 times - payment gateway times out under high load

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) { }

| **📝** | **RULE OF THUMB: A new developer should understand every file and every function WITHOUT running the code. If they can't, add more documentation.** |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |

| **8** | **Configuration-Driven Development** |
| ----- | ------------------------------------ |

Changing behavior must not require changing code. Feature flags, rate limits, upload sizes - all come from config, never scattered across logic.

## 8.1 Feature Flags

// src/config/features.config.js

module.exports = {

features: {

newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',

betaCheckout: process.env.FEATURE_BETA_CHECKOUT === 'true',

darkMode: true, // rolled out

aiRecommend: false, // still in testing

}

};

// Usage:

if (features.newDashboard) return renderNewDashboard();

## 8.2 Domain Config Example

module.exports = {

upload: { maxFileSizeMB: 10, allowedMimeTypes: \['image/jpeg','image/png'\] },

email: { from: '<noreply@app.com>', maxRetries: 3, retryDelayMs: 2000 },

rateLimit: { windowMs: 15 \* 60 \* 1000, maxReqs: 100 },

pagination:{ defaultLimit: 10, maxLimit: 100 },

};

| **🔧** | **KEY BENEFIT: When business says 'increase max upload from 10MB to 25MB', you change one number in one file. Zero code review needed.** |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |

| **9** | **Separation of Concerns (SoC)** |
| ----- | -------------------------------- |

| **Concern**             | **Owner**                               |
| ----------------------- | --------------------------------------- |
| HTTP / Request handling | Controller                              |
| Business rules          | Service                                 |
| Database access         | Repository                              |
| Data shape / schema     | Model                                   |
| Input validation        | Validator / Middleware                  |
| Authentication          | Auth Middleware                         |
| Logging                 | Logger Middleware / Service             |
| Error handling          | Error Middleware + Custom Error Classes |
| Configuration           | Config files                            |
| URL routing             | Route files                             |

## 9.1 The 10-Line Controller Test

// ✅ A correct controller - 7 lines, no business logic

async function register(req, res, next) {

try {

const user = await userService.register(req.body);

res.status(201).json(user);

} catch (err) { next(err); } // errors handled centrally

}

// If your controller exceeds ~10 lines, extract the excess into a service.

| **📏** | **THE 10-LINE TEST: If any controller function exceeds ~10 lines, it is doing too much. Extract the excess into a service immediately.** |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |

| **10** | **Scalability & Future-Modification Design** |
| ------ | -------------------------------------------- |

Scalable code means future modifications are cheap. If adding one feature requires touching 20 files, the architecture is broken.

## 10.1 Anti-Patterns That Kill Scalability

- **God Files** - one 2,000-line file that does everything
- **Circular Dependencies** - moduleA imports moduleB which imports moduleA
- **Global Mutable State** - variables that any module can modify
- **Tight Coupling** - modules directly instantiating their own dependencies
- **Premature Abstraction** - abstracting before you need to (YAGNI)

## 10.2 API Versioning

app.use('/api/v1', v1Router); // existing clients unaffected

app.use('/api/v2', v2Router); // new version built alongside

// Never remove v1 routes without a documented deprecation period

## 10.3 Dependency Injection Container

// src/container.js - wire up the entire dependency graph here

const userRepo = new UserRepository();

const emailService = new EmailService();

const userService = new UserService(userRepo, emailService);

const userController = new UserController(userService);

module.exports = { userController, userService, userRepo };

| **11** | **Error Handling & Logging** |
| ------ | ---------------------------- |

Proper error handling separates a production-ready application from a hobby project. Unhandled errors leak stack traces, crash servers, and confuse users.

## 11.1 Custom Error Classes

class AppError extends Error {

constructor(message, statusCode, code) {

super(message);

this.statusCode = statusCode;

this.code = code;

this.isOperational = true; // expected vs unexpected errors

}

}

class NotFoundError extends AppError { constructor(r){ super(\`\${r} not found\`,404,'NOT_FOUND'); }}

class ValidationError extends AppError { constructor(m){ super(m, 400, 'VALIDATION_ERROR'); }}

class UnauthorizedError extends AppError { constructor(){ super('Unauthorized',401,'UNAUTHORIZED'); }}

class ConflictError extends AppError { constructor(m){ super(m, 409, 'CONFLICT'); }}

## 11.2 Centralized Error Middleware

function errorHandler(err, req, res, next) {

if (err.isOperational) {

// Known error - safe to expose message to client

return res.status(err.statusCode).json({ success:false, code:err.code, message:err.message });

}

// Unknown error - log everything, expose nothing

logger.error('UNHANDLED ERROR', { error: err.message, stack: err.stack });

res.status(500).json({ success:false, message:'Something went wrong.' });

}

| **🛡️** | **SECURITY RULE: Never send a stack trace to the client. Log it on the server. Stack traces reveal your folder structure, package versions, and code logic to attackers.** |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **12** | **Dependency Management & Versioning** |
| ------ | -------------------------------------- |

## 12.1 Dependency Rules

- Pin exact versions in production ("express": "4.18.2" not "^4.18.2")
- Always commit lock files (package-lock.json / yarn.lock / poetry.lock)
- Run npm audit or pip-audit weekly - fix HIGH severity within 48 hours
- Keep dev dependencies separate from production dependencies
- Never import a package without understanding its maintenance status

## 12.2 Git Commit Convention (Conventional Commits)

\# FORMAT: &lt;type&gt;(&lt;scope&gt;): &lt;short description&gt;

feat(auth): add JWT refresh token support

fix(user): handle null email in registration

refactor(db): extract query builder into repository

docs(readme): update local setup instructions

test(order): add unit tests for OrderService

chore(deps): upgrade express 4.18.1 → 4.18.2

perf(search): add index on users.email

\# Types: feat | fix | refactor | docs | test | chore | perf | style

## 12.3 Pre-Flight Checklist - Every Pull Request

Every PR must pass ALL of the following before merge:

| ✅  | All new functions have JSDoc documentation         |
| --- | -------------------------------------------------- |
| ✅  | No raw process.env access outside config/          |
| ✅  | No magic numbers - use named constants             |
| ✅  | No SQL or ORM calls outside repositories           |
| ✅  | No business logic in controllers                   |
| ✅  | New features have unit tests                       |
| ✅  | Errors use custom error classes (not raw Error())  |
| ✅  | No console.log in code (use logger utility)        |
| ✅  | .env.example updated with any new variables        |
| ✅  | Commit message follows Conventional Commits format |

_These rules exist to serve the team, not to restrict it._

**_When in doubt: write it so clearly that a new graduate can understand it without asking questions._**
Rendered
PROJECT ARCHITECTURE

& ENGINEERING RULES

Product Requirements Document - Universal Developer Standard

12Core Rules	100+Code Examples	10Principles
Overview & Purpose
This PRD defines the non-negotiable engineering standards that every developer must follow on every project. These rules are tech-stack agnostic - they apply equally to Node.js, Python, React, Django, or any modern framework. They exist not to restrict, but to ensure the team moves faster, safer, and with fewer surprises as the codebase grows.

Principle	Goal
Predictability	Any developer can find any file in under 30 seconds
Replaceability	Swap any module (DB, cache, email) without touching business logic
Safety	Bad code fails early, loudly, and with a clear error message
Scalability	Adding a new feature never requires editing 10+ existing files
Readability	Code reads like plain English without needing to run it
1	Project Architecture & Folder Structure
1.1 Universal Folder Structure
Adapt layer names to your stack, but the concepts are mandatory across all projects.

src/

config/ ← App configuration & env loading

constants/ ← Magic numbers & string constants

controllers/ ← HTTP request handlers (thin layer)

services/ ← Business logic lives here

repositories/ ← All database access code

models/ ← Data models / schemas

middlewares/ ← Cross-cutting concerns (auth, logging)

routes/ ← URL definitions only

utils/ ← Pure helper functions (no side effects)

validators/ ← Input validation schemas

app.js ← App bootstrap / entry point

tests/ ← Mirror src/ structure: unit/ + integration/

docs/ ← Documentation

.env ← NEVER commit

.env.example ← Always commit

📌	GOLDEN RULE: If a new developer cannot find any file within 30 seconds, your folder structure needs improvement.
1.2 Layer Responsibility Chart
Layer	Responsibility	Must NOT Do
Controller	Receive request, call service, return response	Contain business logic or DB queries
Service	Implement business rules and workflows	Directly access the database
Repository	Execute all database queries	Contain business logic
Model	Define data shape and schema	Process or transform data
Middleware	Cross-cutting concerns: auth, logging	Business logic
Utils	Pure helper functions	Have side-effects or DB access
Config	Load environment & config values	Hardcode values
✅	KEY INSIGHT: Each layer ONLY talks to the layer directly below it. Controllers never touch the DB. Services never read HTTP headers. This one rule prevents 80% of architectural mistakes.
2	SOLID Principles - Clean Code Design
S - Single Responsibility | O - Open/Closed | L - Liskov Substitution | I - Interface Segregation | D - Dependency Inversion

2.1 S - Single Responsibility Principle (SRP)
A class or function should have ONE reason to change. Do ONE thing and do it well.

Controller - only handles HTTP in/out
Service - only runs business logic
Repository - only executes DB queries
2.2 O - Open/Closed Principle (OCP)
Open for extension, closed for modification. Add new behavior via new classes - never by editing existing ones.

✅	Adding a new payment method = new file only. Zero changes to existing code or the core processPayment function.
2.3 L - Liskov Substitution Principle (LSP)
Subclasses must be drop-in replacements for their parent. If a function accepts a Shape, it must work with Circle and Square without checking types.

2.4 I - Interface Segregation Principle (ISP)
Never force a class to implement methods it doesn't use. Prefer many small, focused interfaces over one large one.

Dog should not inherit from a class that forces it to implement fly().
Decompose large interfaces into Swimmer, Flyer, Runner, etc.
2.5 D - Dependency Inversion Principle (DIP)
High-level modules should not depend on low-level modules. Inject dependencies - never hardcode them.

// ❌ BAD

class UserService { constructor() { this.repo = new MySQLUserRepository(); } }

// ✅ GOOD

class UserService { constructor(userRepository) { this.repo = userRepository; } }

const service = new UserService(new MySQLUserRepository()); // prod

const testSvc = new UserService(new MockUserRepository()); // test

🎯	QUICK TEST: Can you swap MySQL → PostgreSQL without changing your service files? If yes, DIP is correctly applied.
3	Centralized Data Access - Repository Pattern
All database operations live in dedicated repository files. If a query changes, you change it in ONE place - never in 15 controllers.

💡	RULE: No service or controller should ever contain a raw SQL query or ORM call. Every database interaction must go through a repository.
3.1 BaseRepository (reusable across all entities)
class BaseRepository {

constructor(model) { this.model = model; }

async findById(id) { return this.model.findByPk(id); }

async findAll(filters={}) { return this.model.findAll({ where: filters }); }

async create(data) { return this.model.create(data); }

async update(id, data) { return this.model.update(data, { where: { id } }); }

async delete(id) { return this.model.destroy({ where: { id } }); }

}

3.2 Entity Repository Pattern
class UserRepository extends BaseRepository {

constructor() { super(User); }

async findByEmail(email) {

return this.model.findOne({ where: { email, deletedAt: null } });

// Soft-delete filter maintained in ONE place

}

}

4	Environment Variable Management
Environment variables separate configuration from code. The same codebase runs in dev, staging, and production with zero code changes.

File	Purpose	Git Status
.env	Actual secrets for your machine	🔴 NEVER commit
.env.example	Template showing all required keys (no real values)	✅ Always commit
.env.test	Values for test environment	🔴 NEVER commit
4.1 Centralized Config Loader
Never read process.env directly in business logic. Create a config module that validates and exports everything.

// src/config/app.config.js

require('dotenv').config();

const REQUIRED = ['DB_HOST', 'DB_PASSWORD', 'JWT_SECRET'];

const missing = REQUIRED.filter(key => !process.env[key]);

if (missing.length > 0) throw new Error(`Missing env vars: ${missing.join(', ')}`);

module.exports = {

app: { env: process.env.NODE_ENV || 'development', port: parseInt(process.env.PORT)||3000 },

database: { host: process.env.DB_HOST, password: process.env.DB_PASSWORD },

jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN||'7d' },

};

🚨	SECURITY RULE: Run `grep -r 'process.env' src/` monthly. Any direct access outside config/ is a code smell and must be refactored immediately.
5	Reducing Hardcoding - Constants Files
Every magic number and string must live in a named constant. Hardcoded values make changes dangerous and intent invisible.

5.1 What Counts as Hardcoding?
if (user.role === 'admin') {} // ❌ magic string

if (items.length > 100) {} // ❌ magic number

setTimeout(callback, 86400000) // ❌ what is 86400000??

if (status === 3) {} // ❌ what does 3 mean?

5.2 The Fix - Freeze Constants
const USER_ROLES = Object.freeze({ ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' });

const USER_STATUS = Object.freeze({ ACTIVE: 1, INACTIVE: 2, BANNED: 3 });

const TIME_MS = Object.freeze({ ONE_HOUR: 3_600_000, ONE_DAY: 86_400_000 });

const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 10, MAX_LIMIT: 100 });

// Usage:

if (user.role === USER_ROLES.ADMIN) {} // ✅ clear

setTimeout(fn, TIME_MS.ONE_DAY) // ✅ readable

🔒	PRO TIP: Always use Object.freeze() on constants objects. It prevents accidental mutation anywhere in the codebase and makes intent explicit.
6	Naming Conventions
If you have to read the function body to understand what it does, the name has failed.

Category	Convention	Example
Variables	camelCase	userName, isLoggedIn, totalPrice
Functions	camelCase + verb	getUserById(), sendEmail(), validateInput()
Classes	PascalCase	UserService, OrderRepository
Constants	SCREAMING_SNAKE	MAX_RETRIES, JWT_SECRET, BASE_URL
Files	kebab-case	user.service.js, order-detail.component.jsx
DB Tables	snake_case plural	user_profiles, order_items
API Routes	kebab-case	/api/user-profiles, /api/order-items
Booleans	is/has/can prefix	isActive, hasPermission, canEdit
Event Handlers	handle prefix	handleSubmit, handleClick
6.1 File Naming Pattern
Pattern: <entity>.<layer>.<extension>

user.controller.js ← HTTP layer

user.service.js ← Business logic

user.repository.js ← DB access

user.model.js ← Schema

user.validator.js ← Input validation

user.test.js ← Unit tests

user.constants.js ← Domain constants

✅	BENEFIT: Searching 'user.' instantly surfaces ALL user-related files in any IDE.
7	Documentation in Every File
Level	What	When
File Header	Purpose, module description, dependencies	Every file
Function/Method	What it does, params, return, throws, example	Every public function
Inline Comment	WHY something is done (not WHAT)	Complex or non-obvious logic only
7.1 Function JSDoc Template
/**

* Creates a new user account with hashed password.

*

* @param {Object} userData

* @param {string} userData.email - Must be unique

* @param {string} userData.password - Plain text (will be hashed)

*

* @returns {Promise<User>} Created user (password excluded)

* @throws {ConflictError} If email already exists

* @throws {ValidationError} If input is invalid

*/

async function createUser(userData) { ... }

7.2 Comment the WHY, Not the WHAT
// ❌ BAD - just restates the code

i++; // increment i

// ✅ GOOD - explains the WHY

// Cost factor 12 per 2024 OWASP recommendations (not default 10)

const hash = await bcrypt.hash(password, 12);

// Retry up to 3 times - payment gateway times out under high load

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) { }

📝	RULE OF THUMB: A new developer should understand every file and every function WITHOUT running the code. If they can't, add more documentation.
8	Configuration-Driven Development
Changing behavior must not require changing code. Feature flags, rate limits, upload sizes - all come from config, never scattered across logic.

8.1 Feature Flags
// src/config/features.config.js

module.exports = {

features: {

newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',

betaCheckout: process.env.FEATURE_BETA_CHECKOUT === 'true',

darkMode: true, // rolled out

aiRecommend: false, // still in testing

}

};

// Usage:

if (features.newDashboard) return renderNewDashboard();

8.2 Domain Config Example
module.exports = {

upload: { maxFileSizeMB: 10, allowedMimeTypes: ['image/jpeg','image/png'] },

email: { from: 'noreply@app.com', maxRetries: 3, retryDelayMs: 2000 },

rateLimit: { windowMs: 15 * 60 * 1000, maxReqs: 100 },

pagination:{ defaultLimit: 10, maxLimit: 100 },

};

🔧	KEY BENEFIT: When business says 'increase max upload from 10MB to 25MB', you change one number in one file. Zero code review needed.
9	Separation of Concerns (SoC)
Concern	Owner
HTTP / Request handling	Controller
Business rules	Service
Database access	Repository
Data shape / schema	Model
Input validation	Validator / Middleware
Authentication	Auth Middleware
Logging	Logger Middleware / Service
Error handling	Error Middleware + Custom Error Classes
Configuration	Config files
URL routing	Route files
9.1 The 10-Line Controller Test
// ✅ A correct controller - 7 lines, no business logic

async function register(req, res, next) {

try {

const user = await userService.register(req.body);

res.status(201).json(user);

} catch (err) { next(err); } // errors handled centrally

}

// If your controller exceeds ~10 lines, extract the excess into a service.

📏	THE 10-LINE TEST: If any controller function exceeds ~10 lines, it is doing too much. Extract the excess into a service immediately.
10	Scalability & Future-Modification Design
Scalable code means future modifications are cheap. If adding one feature requires touching 20 files, the architecture is broken.

10.1 Anti-Patterns That Kill Scalability
God Files - one 2,000-line file that does everything
Circular Dependencies - moduleA imports moduleB which imports moduleA
Global Mutable State - variables that any module can modify
Tight Coupling - modules directly instantiating their own dependencies
Premature Abstraction - abstracting before you need to (YAGNI)
10.2 API Versioning
app.use('/api/v1', v1Router); // existing clients unaffected

app.use('/api/v2', v2Router); // new version built alongside

// Never remove v1 routes without a documented deprecation period

10.3 Dependency Injection Container
// src/container.js - wire up the entire dependency graph here

const userRepo = new UserRepository();

const emailService = new EmailService();

const userService = new UserService(userRepo, emailService);

const userController = new UserController(userService);

module.exports = { userController, userService, userRepo };

11	Error Handling & Logging
Proper error handling separates a production-ready application from a hobby project. Unhandled errors leak stack traces, crash servers, and confuse users.

11.1 Custom Error Classes
class AppError extends Error {

constructor(message, statusCode, code) {

super(message);

this.statusCode = statusCode;

this.code = code;

this.isOperational = true; // expected vs unexpected errors

}

}

class NotFoundError extends AppError { constructor(r){ super(`${r} not found`,404,'NOT_FOUND'); }}

class ValidationError extends AppError { constructor(m){ super(m, 400, 'VALIDATION_ERROR'); }}

class UnauthorizedError extends AppError { constructor(){ super('Unauthorized',401,'UNAUTHORIZED'); }}

class ConflictError extends AppError { constructor(m){ super(m, 409, 'CONFLICT'); }}

11.2 Centralized Error Middleware
function errorHandler(err, req, res, next) {

if (err.isOperational) {

// Known error - safe to expose message to client

return res.status(err.statusCode).json({ success:false, code:err.code, message:err.message });

}

// Unknown error - log everything, expose nothing

logger.error('UNHANDLED ERROR', { error: err.message, stack: err.stack });

res.status(500).json({ success:false, message:'Something went wrong.' });

}

🛡️	SECURITY RULE: Never send a stack trace to the client. Log it on the server. Stack traces reveal your folder structure, package versions, and code logic to attackers.
12	Dependency Management & Versioning
12.1 Dependency Rules
Pin exact versions in production ("express": "4.18.2" not "^4.18.2")
Always commit lock files (package-lock.json / yarn.lock / poetry.lock)
Run npm audit or pip-audit weekly - fix HIGH severity within 48 hours
Keep dev dependencies separate from production dependencies
Never import a package without understanding its maintenance status
12.2 Git Commit Convention (Conventional Commits)
# FORMAT: <type>(<scope>): <short description>

feat(auth): add JWT refresh token support

fix(user): handle null email in registration

refactor(db): extract query builder into repository

docs(readme): update local setup instructions

test(order): add unit tests for OrderService

chore(deps): upgrade express 4.18.1 → 4.18.2

perf(search): add index on users.email

# Types: feat | fix | refactor | docs | test | chore | perf | style

12.3 Pre-Flight Checklist - Every Pull Request
Every PR must pass ALL of the following before merge:

✅	All new functions have JSDoc documentation
✅	No raw process.env access outside config/
✅	No magic numbers - use named constants
✅	No SQL or ORM calls outside repositories
✅	No business logic in controllers
✅	New features have unit tests
✅	Errors use custom error classes (not raw Error())
✅	No console.log in code (use logger utility)
✅	.env.example updated with any new variables
✅	Commit message follows Conventional Commits format
These rules exist to serve the team, not to restrict it.

When in doubt: write it so clearly that a new graduate can understand it without asking questions.

