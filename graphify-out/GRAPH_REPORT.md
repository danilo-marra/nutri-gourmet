# Graph Report - . (2026-05-28)

## Corpus Check

- 70 files · ~25,904 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 375 nodes · 418 edges · 73 communities (27 shown, 46 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Authorization & RBAC|Authorization & RBAC]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Core API Handlers|Core API Handlers]]
- [[_COMMUNITY_User & Student API|User & Student API]]
- [[_COMMUNITY_User Activation Flow|User Activation Flow]]
- [[_COMMUNITY_User Management|User Management]]
- [[_COMMUNITY_Request Middleware|Request Middleware]]
- [[_COMMUNITY_Product Domain|Product Domain]]
- [[_COMMUNITY_Session API|Session API]]
- [[_COMMUNITY_Password Reset|Password Reset]]
- [[_COMMUNITY_Reports Domain|Reports Domain]]
- [[_COMMUNITY_Sale Domain|Sale Domain]]
- [[_COMMUNITY_Student Domain|Student Domain]]
- [[_COMMUNITY_Credit Token Flow|Credit Token Flow]]
- [[_COMMUNITY_Credit Transactions|Credit Transactions]]
- [[_COMMUNITY_Migrator|Migrator]]
- [[_COMMUNITY_Product API Handlers|Product API Handlers]]
- [[_COMMUNITY_Product Detail API|Product Detail API]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Sale API|Sale API]]
- [[_COMMUNITY_Cash Close Domain|Cash Close Domain]]
- [[_COMMUNITY_Credit API|Credit API]]
- [[_COMMUNITY_Report Balances API|Report Balances API]]
- [[_COMMUNITY_Report Cash-Closes API|Report Cash-Closes API]]
- [[_COMMUNITY_Report Credits API|Report Credits API]]
- [[_COMMUNITY_Report Packages API|Report Packages API]]
- [[_COMMUNITY_Report Sales API|Report Sales API]]
- [[_COMMUNITY_Sale Routes|Sale Routes]]
- [[_COMMUNITY_Student CRUD API|Student CRUD API]]
- [[_COMMUNITY_Wait-for-Postgres|Wait-for-Postgres]]
- [[_COMMUNITY_Session Routes|Session Routes]]
- [[_COMMUNITY_Activation API|Activation API]]
- [[_COMMUNITY_Password Recovery API|Password Recovery API]]
- [[_COMMUNITY_Student List API|Student List API]]
- [[_COMMUNITY_Status API|Status API]]
- [[_COMMUNITY_Webserver|Webserver]]
- [[_COMMUNITY_Authentication|Authentication]]
- [[_COMMUNITY_Student Packages API|Student Packages API]]
- [[_COMMUNITY_Password Reset Routes|Password Reset Routes]]
- [[_COMMUNITY_User Profile API|User Profile API]]
- [[_COMMUNITY_User List API|User List API]]
- [[_COMMUNITY_Student Credits API|Student Credits API]]
- [[_COMMUNITY_Report Routes|Report Routes]]
- [[_COMMUNITY_Cash Close Routes|Cash Close Routes]]
- [[_COMMUNITY_Migration Routes|Migration Routes]]
- [[_COMMUNITY_Session Routes Alt|Session Routes Alt]]
- [[_COMMUNITY_Student Routes|Student Routes]]
- [[_COMMUNITY_Sessions Table|Sessions Table]]
- [[_COMMUNITY_User Creation|User Creation]]
- [[_COMMUNITY_Database Module|Database Module]]
- [[_COMMUNITY_Email Module|Email Module]]
- [[_COMMUNITY_Wait-for-Postgres Script|Wait-for-Postgres Script]]
- [[_COMMUNITY_Home Page View|Home Page View]]
- [[_COMMUNITY_Password Reset API|Password Reset API]]
- [[_COMMUNITY_Product Detail API|Product Detail API]]
- [[_COMMUNITY_Report Packages API|Report Packages API]]
- [[_COMMUNITY_Status API|Status API]]
- [[_COMMUNITY_Wiki Log|Wiki Log]]

## God Nodes (most connected - your core abstractions)

1. `Wiki Index — Table of Contents` - 15 edges
2. `Operador — Day-to-Day Operations Persona` - 14 edges
3. `PRD Summary — Sistema Integrado de Gestão de Cantina` - 11 edges
4. `Administrador — Full Access Persona` - 11 edges
5. `Supervisor — Intermediate Supervisory Persona` - 11 edges
6. `Segurança — RBAC Permission Table` - 11 edges
7. `Venda — Sale Transaction Entity` - 10 edges
8. `Crédito — Student Balance` - 9 edges
9. `Activation Model` - 8 edges
10. `Aluno — Student Entity` - 8 edges

## Surprising Connections (you probably didn't know these)

- `injectAnonymousOrUser` --semantically_similar_to--> `Authorization Model` [INFERRED] [semantically similar]
  infra/controller.js → models/authorization.js
- `GET /students/:id/packages Handler` --references--> `Aluno — Student Entity` [INFERRED]
  pages/api/v1/students/[id]/packages/index.js → wiki/domain/aluno.md
- `Crédito — Student Balance` --conceptually_related_to--> `GET /students/:id/packages Handler` [INFERRED]
  wiki/domain/credito.md → pages/api/v1/students/[id]/packages/index.js
- `GET /students/:id/packages Handler` --references--> `Pacote — Full-Time Student Credit Package` [INFERRED]
  pages/api/v1/students/[id]/packages/index.js → wiki/domain/pacote.md
- `GET /user Handler (current session user)` --references--> `Operador — Day-to-Day Operations Persona` [INFERRED]
  pages/api/v1/user/index.js → wiki/domain/operador.md

## Hyperedges (group relationships)

- **Session Auth Cookie Flow** — controller_setSessionCookie, controller_clearSessionCookie, controller_injectAuthenticatedUser, db_schema_sessions [INFERRED 0.90]
- **RBAC Feature Gate Pattern** — models_authorization, controller_canRequest, authorization_rbac_role_features, authorization_filterOutput_pattern [EXTRACTED 0.95]
- **Domain Model → Database Layer** — models_cashClose, models_credit, models_product, models_report, database_query [EXTRACTED 0.95]
- **Sale Creation Atomic Flow: create + resolveItems + runCreateTransaction + student balance debit** — model_sale_create, model_sale_resolveItems, model_sale_runCreateTransaction, model_student [EXTRACTED 0.95]
- **Session Authentication Lifecycle: sessions API + session model + authentication model** — api_sessions, model_session_create, model_session_findonevalidbytoken, model_session_expirebyid [EXTRACTED 0.95]
- **Financial Reports Cluster: balances, credits, sales reports all guarded by read:report:financial** — api_reports_balances, api_reports_credits, api_reports_sales [EXTRACTED 0.95]
- **RBAC Persona-Permission System: Operador / Supervisor / Administrador** — wiki_operador, wiki_supervisor, wiki_administrador, wiki_seguranca [EXTRACTED 0.95]
- **User Account Management: create, list, patch via /users and /users/:username** — api_users_index, api_users_username, wiki_supervisor, wiki_operador [EXTRACTED 0.95]
- **Unified Credit Balance Pool: manual credits + packages share student balance** — wiki_credito, wiki_pacote, wiki_aluno [EXTRACTED 0.95]

## Communities (73 total, 46 thin omitted)

### Community 0 - "Authorization & RBAC"

Cohesion: 0.09
Nodes (39): filterOutput Output Sanitization Pattern, RBAC Role-Feature Map, canRequest Middleware Factory, clearSessionCookie, onErrorHandler, database.getNewClient, database.query, DB Table: cash_closes (+31 more)

### Community 1 - "Database Layer"

Cohesion: 0.07
Nodes (14): database, getConnectionConfig(), getNewClient(), getSSLValues(), pool, email, transporter, ForbiddenError (+6 more)

### Community 2 - "Core API Handlers"

Cohesion: 0.07
Nodes (29): API: GET/POST /api/v1/cash_closes, API: GET/POST /api/v1/migrations, API: GET/POST /api/v1/products, API: GET /api/v1/reports/balances, API: GET /api/v1/reports/cash-closes, API: GET /api/v1/reports/credits, API: GET /api/v1/reports/sales, API: GET/POST /api/v1/sales (+21 more)

### Community 3 - "User & Student API"

Cohesion: 0.21
Nodes (29): GET /students/:id/packages Handler, GET /user Handler (current session user), GET/POST /users Handler, GET/PATCH /users/:username Handler, Docker Compose — Dev Services, Anti-Enumeration: POST /password/recovery always returns 200, Atomic Token Consumption (TOCTOU-safe) for Password Reset, Price Snapshot on Sale (unit_price) — Prevents Retroactive Price Change (+21 more)

### Community 4 - "User Activation Flow"

Cohesion: 0.14
Nodes (13): activation, ADMIN_FEATURES, authorization, availableFeatures, can(), filterOutput(), getEffectiveFeatures(), OPERADOR_FEATURES (+5 more)

### Community 5 - "User Management"

Cohesion: 0.22
Nodes (7): create(), findOneByUsername(), hashPasswordInObject(), update(), user, validateUniqueEmail(), validateUniqueUsername()

### Community 6 - "Request Middleware"

Cohesion: 0.27
Nodes (6): clearSessionCookie(), controller, injectAnonymousOrUser(), injectAnonymousUser(), injectAuthenticatedUser(), onErrorHandler()

### Community 7 - "Product Domain"

Cohesion: 0.32
Nodes (5): deactivate(), findOneById(), product, update(), VALID_CATEGORIES

### Community 8 - "Session API"

Cohesion: 0.29
Nodes (5): API: POST/DELETE /api/v1/sessions, session.create(), session.findOneValidByToken(), Session expiration is 30 days; token is 48 random bytes hex-encoded, findOneValidByToken validates expires_at > NOW() in SQL to reject stale sessions

### Community 11 - "Sale Domain"

Cohesion: 0.33
Nodes (4): create(), findOneById(), PAYMENT_METHODS, sale

### Community 12 - "Student Domain"

Cohesion: 0.38
Nodes (4): findOneById(), remove(), student, update()

### Community 18 - "Auth Middleware"

Cohesion: 0.50
Nodes (4): Controller Middleware, injectAnonymousOrUser, injectAuthenticatedUser, setSessionCookie

## Knowledge Gaps

- **72 isolated node(s):** `controller`, `pool`, `database`, `transporter`, `email` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `Operador — Day-to-Day Operations Persona` (e.g. with `GET /user Handler (current session user)` and `GET/POST /users Handler`) actually correct?**
  _`Operador — Day-to-Day Operations Persona` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `controller`, `pool`, `database` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authorization & RBAC` be split into smaller, more focused modules?**
  _Cohesion score 0.09041835357624832 - nodes in this community are weakly interconnected._
- **Should `Database Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `Core API Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06881720430107527 - nodes in this community are weakly interconnected._
- **Should `User Activation Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
