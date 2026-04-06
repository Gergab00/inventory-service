---
applyTo: "src/modules/**/*.ts,src/shared/**/*.ts,test/**/*.ts,docs/**/*.md"
---

# Architecture-specific instructions for backend areas

This file extends the repository-wide rules defined in `.github/copilot-instructions.md`.
Do not reinterpret the global rules.
Use this file only to apply stricter and more specific behavior for the backend areas covered by `applyTo`.

## Purpose of this file

Use these instructions to adapt generated output to the architectural role of the current path.
When working in any matched file:
- first infer the responsibility of the current folder
- then generate only the code or documentation that belongs to that responsibility
- prefer adding a new focused file over expanding an existing file beyond its concern
- preserve module autonomy and boundary clarity
- when in doubt, choose the most restrictive architecture-safe option

Because path-specific instructions are combined with repository-wide instructions, do not assume this file replaces global rules.
It narrows behavior for the matching paths only.

---

# 1) Instructions for `src/modules/**`

## Scope intent

Files under `src/modules/**` represent business capabilities.
Copilot must preserve vertical modularity while also respecting Clean Architecture inside each module.

Expected internal structure per module when justified by complexity:

- `src/modules/<module-name>/domain/**`
- `src/modules/<module-name>/application/**`
- `src/modules/<module-name>/infrastructure/**`
- `src/modules/<module-name>/interfaces/**`

Do not flatten all concerns into one folder when the feature is non-trivial.

## Module design rules

- Treat each module as a business capability, not as a technical bucket.
- Keep module internals cohesive and explicit.
- Prefer module-local abstractions before promoting anything to `src/shared`.
- Do not import across sibling modules casually.
- If one module needs another module’s behavior, prefer:
  - an application port
  - a published interface
  - an explicit service boundary
- Avoid direct reach-through into another module’s internal folders.

## Allowed dependency direction inside a module

- `interfaces` -> `application`
- `application` -> `domain`
- `infrastructure` -> `application` and `domain`
- `domain` -> no NestJS, no HTTP, no persistence, no framework code

Never invert this direction.

## Naming conventions inside modules

Use explicit suffixes that reveal the layer and responsibility.

Examples:
- `create-product.use-case.ts`
- `product.entity.ts`
- `product-id.value-object.ts`
- `product-repository.port.ts`
- `mongo-product.repository.ts`
- `create-product.request.dto.ts`
- `product.response.dto.ts`
- `product-persistence.mapper.ts`
- `product-controller.e2e-spec.ts`

Avoid vague names such as:
- `service.ts`
- `helper.ts`
- `utils.ts`
- `manager.ts`
- `processor.ts`
- `handler.ts` unless it is truly a command/query handler pattern

## File placement rules by responsibility

### Domain
Place in `domain/**` only:
- entities
- value objects
- domain services
- specifications/policies
- repository contracts when they are domain-owned
- domain errors
- invariants and business rules

Do not place in `domain/**`:
- DTOs
- NestJS decorators
- Mongoose schemas
- HTTP exceptions
- database query code
- `class-validator`
- logger implementations
- integration clients

### Application
Place in `application/**`:
- use cases
- commands/queries
- orchestrators
- mappers between transport/integration and domain inputs when the mapping is application-specific
- application services that coordinate domain behavior
- ports owned by use cases
- transaction coordination if needed

Use case rules:
- one use case class = one business action
- one public entry method only when possible, usually `execute`
- return explicit result objects, never ambiguous booleans
- validate application-level preconditions, then delegate business rules to domain objects

Do not place in `application/**`:
- NestJS controllers
- raw persistence schemas
- HTTP serialization details
- provider SDK logic
- infrastructure-specific retries unless abstracted

### Infrastructure
Place in `infrastructure/**`:
- repository implementations
- database schemas/documents
- external clients
- config readers
- logger adapters
- event/message adapters
- persistence mappers
- framework-specific provider wiring when it belongs to the module

Infrastructure rules:
- map external or persistence shapes into domain/application shapes explicitly
- isolate provider peculiarities here
- never leak document models upward
- never return raw SDK responses to application or interfaces

### Interfaces
Place in `interfaces/**`:
- controllers
- transport DTOs
- request validators
- presenters
- filters
- route-to-use-case mapping

Controller rules:
- a controller method should do only:
  - receive request
  - validate request DTO
  - map to command/query
  - call a use case
  - map output to response DTO
- controller methods must stay short
- never compute business decisions in controllers
- never query the database directly from controllers

## Module registration rules for NestJS

When generating Nest modules:
- register providers explicitly
- use injection tokens for ports/repositories
- keep provider arrays readable
- do not hide important bindings in magic auto-registration
- prefer one Nest module per business capability or sub-capability
- keep root module composition declarative

Example pattern:
- `PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY')`
- application depends on token
- infrastructure provides the concrete implementation

## Cross-module collaboration rules

If a use case in one module requires information from another module:
- first prefer querying through an application port
- if needed, introduce a dedicated read service or query port
- keep the consuming module independent from the other module’s persistence details
- never import another module’s `infrastructure/**` directly

Bad example:
- `inventory/application/...` importing `products/infrastructure/mongo-product.repository.ts`

Preferred example:
- `inventory/application/...` depends on `ProductLookupPort`

## Restrictions for `src/modules/**`

Copilot must NOT:
- create shared god services spanning unrelated modules
- place generic helpers in module root
- mix controller DTOs with domain entities
- inject Mongoose models into use cases
- put business rules in exception filters, pipes, or decorators
- create one giant `products.service.ts` with CRUD + stock + pricing + image sync + validation
- use barrel files if they hide architecture boundaries or encourage wrong imports
- create circular dependencies between modules
- use `export *` broadly across layers

## Specific patterns to prefer in modules

Prefer:
- explicit use-case classes
- repository ports
- anti-corruption mappers
- value objects for IDs, money, quantity, delivery time, statuses
- policy/specification objects for growing rule complexity
- dedicated read models when queries diverge from write model needs

---

# 2) Instructions for `src/shared/**`

## Scope intent

`src/shared/**` is for truly cross-cutting primitives used by multiple modules without introducing business coupling.

Before generating anything in `shared`, verify that the artifact is:
- generic
- stable
- reusable across modules
- not specific to one provider or business capability

If any of the above is false, keep it inside the owning module instead.

## What belongs in shared

Allowed examples:
- base error primitives
- shared result type abstractions
- common pagination contracts if they are transport-agnostic
- generic ID generation abstractions if architecture-approved
- clock/date ports
- correlation ID primitives
- common guard/assertion primitives with no business meaning
- generic test factories only if reused broadly and not business-specific
- shared constants only when they are truly cross-cutting and stable

## What does NOT belong in shared

Do not place in `shared`:
- product rules
- inventory calculations
- warehouse allocation logic
- Amazon-specific mapping logic
- orchestrator contract details
- business enums that only one module uses
- module-specific DTOs
- convenience wrappers with unclear ownership
- generic `utils` files containing unrelated functions

## Shared naming rules

Use names that describe the primitive precisely.

Good examples:
- `domain-error.base.ts`
- `clock.port.ts`
- `system-clock.service.ts`
- `string-normalizer.ts` only if truly generic and deterministic
- `correlation-id.provider.ts`

Bad examples:
- `common.ts`
- `helpers.ts`
- `utils.ts`
- `shared.service.ts`
- `base-manager.ts`

## Shared design constraints

- Keep shared code framework-light unless a framework binding is unavoidable.
- Prefer pure functions or small abstractions.
- Shared code must not force unrelated modules to depend on accidental concepts.
- Every shared primitive should have a clear ownership reason.
- If a shared artifact starts accumulating module-specific branches, move it back to the module that owns the behavior.

## Restrictions for `src/shared/**`

Copilot must NOT:
- move code to shared just to reduce duplication if the abstraction is premature
- create kitchen-sink helper files
- introduce business language from one module as if it were global
- centralize unrelated constants into one file
- hide side effects in utility functions
- create shared mappers for unrelated bounded contexts

---

# 3) Instructions for `test/**`

## Scope intent

Tests must reinforce architecture and business confidence.
Generate tests that verify behavior, contracts, and architectural boundaries rather than superficial coverage.

## Test folder strategy

Prefer explicit test separation:
- `test/unit/**`
- `test/integration/**`
- `test/e2e/**`
- `test/fixtures/**`
- `test/fakes/**`
- `test/builders/**`

When adding a new test, place it in the smallest valid scope.

## Unit test rules

Use unit tests for:
- entities
- value objects
- domain services
- policies/specifications
- use cases

Unit test expectations:
- test outcomes and business rules
- use deterministic inputs
- keep setup minimal
- prefer test data builders or object mothers when setup becomes noisy
- test edge cases explicitly
- assert domain invariants and error cases clearly

Do not unit test:
- private methods directly
- framework wiring
- trivial getters/setters unless they enforce rules
- implementation details that can change without affecting behavior

## Integration test rules

Use integration tests for:
- repository implementations
- database mappings
- external client adapters
- configuration bootstrap where justified
- persistence behavior required for FIFO traceability

Integration test expectations:
- test real integration behavior or a controlled close substitute
- verify mapping correctness between persistence and domain
- verify repository filtering, sorting, and traceability assumptions
- for FIFO, verify oldest eligible layer consumption and history preservation

## E2E test rules

Use e2e tests for:
- critical HTTP flows
- versioned routes
- validation behavior
- error mapping
- response contracts
- orchestration across layers

E2E expectations:
- validate request/response DTO behavior
- validate HTTP status codes and machine-readable error codes
- avoid over-asserting incidental JSON shape beyond the public contract
- focus on high-value flows, not every branch

## Test naming conventions

Use descriptive names with explicit business intent.

Examples:
- `create-product.use-case.spec.ts`
- `product.entity.spec.ts`
- `mongo-product.repository.int-spec.ts`
- `create-product.controller.e2e-spec.ts`

Test case titles should explain behavior:
- `should reject an inventory entry with non-positive quantity`
- `should consume the oldest available lot first when reserving stock`
- `should map domain error to 409 conflict response`

Avoid vague titles such as:
- `works correctly`
- `test create`
- `should pass`

## Test doubles strategy

Prefer:
- fakes when behavior matters
- builders for complex inputs
- stubs for fixed collaborator outputs
- mocks only when interaction verification is the real concern

Avoid:
- mocking everything by default
- brittle mocks coupled to internal call counts unless that interaction is the contract
- duplicating production logic inside expected values

## Mandatory high-value scenarios for this project

Whenever relevant, generate tests for:
- product identity preservation despite external payload evolution
- FIFO stock consumption
- warehouse-specific availability
- inventory history immutability
- external payload normalization
- error translation across layers
- API version stability
- orchestrated image reference updates

## Restrictions for `test/**`

Copilot must NOT:
- generate snapshot tests for business logic by default
- produce unreadable mega-fixtures inline
- assert internal framework implementation details
- skip negative cases
- create tests that only mirror the implementation line by line
- use random values without fixing determinism
- silently omit tests when generating non-trivial business logic

---

# 4) Instructions for `docs/**`

## Scope intent

Documentation under `docs/**` must explain architecture, decisions, contracts, and operational guidance for humans.
All documentation in this repository must remain in Spanish unless the target artifact is explicitly external and English is required.

## Documentation types expected in `docs/**`

Prefer documents such as:
- arquitectura general
- decisiones arquitectónicas
- estructura de módulos
- contratos de integración
- flujos de inventario y FIFO
- guías de desarrollo
- convenciones de testing
- decisiones sobre versionado de API
- troubleshooting operativo

## Documentation style rules

- Escribe en español técnico claro.
- Sé preciso, no promocional.
- Explica el porqué de las decisiones, no solo el qué.
- Usa ejemplos concretos cuando una regla pueda interpretarse mal.
- Mantén coherencia con la estructura real del repositorio.
- Si documentas un flujo, incluye entrada, proceso, salida y errores relevantes.
- Si documentas una decisión, incluye contexto, decisión, consecuencias y límites.

## Recommended document structures

### For architecture docs
Use sections like:
- objetivo
- alcance
- estructura
- límites por capa
- dependencias permitidas
- anti-patrones
- ejemplos de ubicación de archivos

### For ADR-style decisions
Use sections like:
- contexto
- decisión
- alternativas descartadas
- consecuencias
- impacto en módulos afectados

### For integration docs
Use sections like:
- origen del dato
- validaciones
- normalización
- mapeo a dominio
- errores esperados
- observabilidad
- ejemplos de payload

## Restrictions for `docs/**`

Copilot must NOT:
- generate generic documentation disconnected from this repository
- describe architecture in a way that contradicts actual folder boundaries
- document speculative features as if already implemented
- mix Spanish and English unnecessarily
- omit examples in tricky flows such as FIFO, warehouse stock, or external normalization
- treat docs as marketing copy

---

# 5) Path-aware generation behavior

When working on a matched file, always adapt output to the folder role.

## If the active file is under `src/modules/**`
Generate:
- business-capability-oriented code
- layer-correct placement suggestions
- explicit ports, mappers, DTO separation, and use cases

## If the active file is under `src/shared/**`
Generate:
- only generic cross-cutting primitives
- no business-specific behavior
- minimal, highly reusable abstractions

## If the active file is under `test/**`
Generate:
- behavior-driven tests
- readable fixtures/builders
- negative and edge cases
- architecture-aware assertions

## If the active file is under `docs/**`
Generate:
- Spanish technical documentation
- repository-specific explanations
- architecture decisions and examples grounded in the actual project

---

# 6) Output expectations for Copilot in these paths

When generating content for matched paths:
- suggest the most appropriate target file path when missing
- keep one responsibility per file
- prefer complete code over partial fragments unless explicitly asked otherwise
- include focused comments only when they clarify intent
- make mapping boundaries explicit
- preserve repository-wide conventions without restating them
- avoid convenience shortcuts that weaken architecture

If multiple valid implementations exist:
- choose the one with clearer boundaries
- prefer explicitness over brevity
- prefer extensibility over temporary convenience
- prefer module ownership over premature sharing