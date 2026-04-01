# copilot-instructions.md

## Project overview
This repository contains `inventory-service`, a backend service built with **NestJS + TypeScript** using **Clean Architecture** principles.

Its responsibilities include:
- Receiving product data from `sp-amz-backend`.
- Persisting product data in a **NoSQL** database because product structures may evolve over time.
- Managing products with a **globally unique identifier**.
- Receiving image reference updates from an **orchestrator service** (never directly from `r2-service`).
- Managing inventory movements with:
  - quantity
  - cost per unit
  - FIFO valuation
- Supporting multiple warehouses per product, each with its own delivery time.
- Remaining extensible for future integrations with additional external services.

## Core engineering principles
- Always prioritize **clarity, maintainability, testability, and explicitness** over clever or overly compact code.
- Follow **Clean Architecture** and **SOLID** principles.
- Enforce **single responsibility** at file, class, and function level.
- Prefer **composition over inheritance**.
- Keep the **domain layer pure** and independent from NestJS, persistence, HTTP, and infrastructure frameworks.
- Business rules must live in the **domain** or **application** layers, never inside controllers or persistence adapters.
- Every change must be easy to test in isolation.
- Avoid hidden coupling, temporal coupling, and magic behavior.

## Mandatory architectural boundaries
Use the following logical structure:

- `src/domain`
  - Enterprise business rules.
  - Entities, value objects, domain services, domain errors, repository contracts.
  - No NestJS decorators.
  - No HTTP concerns.
  - No database-specific logic.
  - No direct dependency on infrastructure.

- `src/application`
  - Use cases, command/query handlers, application services, DTOs internal to use cases, ports, mappers/orchestrators.
  - Coordinates domain behavior.
  - Can depend on `domain`.
  - Must not depend on concrete infrastructure implementations.

- `src/infrastructure`
  - Database adapters, persistence schemas/models, external clients, config, logging implementations, message/event adapters.
  - Can depend on `application` and `domain`.
  - Contains framework-specific and provider-specific code.

- `src/interfaces`
  - HTTP controllers, request/response DTOs, validation pipes, presenters, exception filters.
  - Translates inbound/outbound transport concerns.
  - Must remain thin.

- `src/shared`
  - Only truly cross-cutting reusable primitives.
  - Do not turn `shared` into a dumping ground.

## Expected project conventions
Prefer a modular structure by business capability, while preserving clean architecture boundaries. Example:

- `src/modules/products/domain/...`
- `src/modules/products/application/...`
- `src/modules/products/infrastructure/...`
- `src/modules/products/interfaces/...`
- `src/modules/inventory/...`
- `src/modules/warehouses/...`

If a module grows too much, split by sub-capability without breaking boundaries.

## Naming conventions
- Use English for code, identifiers, folder names, classes, and commit-related technical artifacts.
- Use explicit names. Avoid vague names like `data`, `info`, `manager`, `helper`, `util`, `common`, `process`.
- Class names:
  - `CreateProductUseCase`
  - `UpdateProductImagesUseCase`
  - `RegisterInventoryEntryUseCase`
  - `GetSellableStockUseCase`
  - `ProductRepository`
  - `MongoProductRepository`
  - `ProductController`
- DTO names:
  - request DTOs: `CreateProductRequestDto`
  - response DTOs: `ProductResponseDto`
  - application contracts: `CreateProductCommand`
- Entity names must represent domain concepts, not persistence models.
- Value objects must end with meaningful names such as `ProductId`, `WarehouseId`, `Money`, `DeliveryTime`.
- Persistence models must clearly indicate persistence concern, for example `ProductDocument`, `InventoryMovementDocument`.

## TypeScript standards
- Use `strict` TypeScript.
- Never use `any` unless there is a documented and justified boundary case.
- Prefer `unknown` over `any` when parsing external data.
- Prefer union types and discriminated unions for variant behavior.
- Use `readonly` wherever mutation is not intended.
- Prefer immutable transformations.
- Explicitly type public method signatures.
- Avoid type assertions unless unavoidable and justified.
- Keep functions small and deterministic.

## NestJS standards
- Use NestJS only in interface/infrastructure entry points.
- Keep controllers extremely thin.
- Controllers should:
  - validate input
  - call a use case
  - map result to response DTO
  - return HTTP response
- Controllers must not contain business logic.
- Providers must be registered through modules with explicit dependency wiring.
- Use custom providers and injection tokens for ports/repositories.
- Do not inject concrete infrastructure repositories directly into domain/application logic.
- Prefer feature modules over a monolithic app module.

## API design standards
- Design APIs with stable, explicit contracts.
- Version public APIs from the beginning.
- Use consistent route naming and plural resources when applicable.
- Prefer idempotent operations where the domain allows it.
- Always return typed response DTOs.
- Never expose raw database documents directly.
- Document endpoints for Scalar/OpenAPI from day one.
- Provide request and response examples whenever possible.

## DTO standards
- Separate transport DTOs from domain entities.
- Validate all inbound DTO fields explicitly.
- Use `class-validator` and `class-transformer` only at transport boundaries.
- Never pass controller DTOs directly into the domain.
- Map request DTOs to application commands.
- Map domain/application results to response DTOs.
- DTOs must not contain business logic.

## Entity and domain model standards
- Entities must protect invariants through constructors/factories/behavior methods.
- Do not create anemic domain models when domain behavior clearly belongs to the entity/value object.
- Use value objects for:
  - IDs
  - money/prices
  - quantities
  - delivery times
  - statuses when relevant
- Validate invariants as close to the domain as possible.
- Throw domain-specific errors, not generic `Error`, when a business rule is violated.

## Persistence standards
- The system uses a NoSQL database. Persistence schema design must accommodate evolving product attributes without weakening core invariants.
- Separate domain entities from persistence documents.
- Repositories are interfaces in `domain` or `application`, implementations in `infrastructure`.
- Persistence logic must not leak into use cases.
- Store flexible external product attributes in a controlled structure designed for schema evolution.
- Preserve product unique identity independently of external provider payload shape.
- Model inventory entries in a way that supports FIFO cost resolution correctly and auditable stock history.

## Inventory and FIFO rules
- Inventory must be modeled as movements or lots, not only as a flat quantity.
- FIFO must be deterministic and traceable.
- Never overwrite historical cost layers.
- Stock depletion must consume the oldest available eligible inventory first.
- Each inventory entry must preserve:
  - product ID
  - warehouse ID
  - quantity
  - available quantity
  - unit cost
  - source/reference
  - timestamps
- Warehouse-specific stock must be queryable independently and aggregatable globally when needed.
- Delivery time belongs to warehouse-related data, not product core identity.
- Business logic related to stock valuation and allocation must live outside controllers and persistence models.

## External integration rules
- Treat incoming data from external services as untrusted.
- Validate and normalize all external payloads.
- Do not couple internal domain models directly to `sp-amz-backend`, orchestrator contracts, or future providers.
- Use anti-corruption mapping layers for every external integration.
- The service must never call `r2-service` directly if the architecture says references come through an orchestrator.
- Integration failures must be explicit, observable, and recoverable where appropriate.

## Error handling standards
- Use domain errors, application errors, and transport-level exception mapping consistently.
- Never swallow exceptions silently.
- Never return ambiguous `null` or boolean error signals for exceptional flows.
- Include meaningful machine-readable error codes when appropriate.
- Do not leak infrastructure internals in API responses.
- Log operational context safely without exposing secrets.

## Logging and observability
- Use structured logging.
- Include correlation identifiers / request IDs when available.
- Log important business events and integration failures.
- Never log secrets, credentials, tokens, or sensitive raw payloads unless explicitly redacted.
- Make logs useful for Railway runtime troubleshooting.

## Testing standards
Every meaningful change should include or update tests.

Preferred testing layers:
- **Unit tests**
  - domain entities
  - value objects
  - domain services
  - use cases
- **Integration tests**
  - repository implementations
  - database adapters
  - external client adapters
- **E2E tests**
  - critical HTTP flows

Testing rules:
- Test behavior, not implementation details.
- Prioritize business rules and edge cases.
- Add explicit tests for FIFO behavior.
- Add tests for warehouse-specific inventory scenarios.
- Add tests for product updates from orchestrated image references.
- Avoid brittle mocks when a lightweight fake is sufficient.
- Keep test fixtures readable and intentional.

## CI/CD standards
Assume the project will use automated CI/CD and Railway deployment.

When suggesting workflows or automation:
- include linting
- include unit/integration/e2e test stages when appropriate
- include build verification
- include semantic versioning automation
- include changelog generation
- prefer reproducible pipelines
- fail fast on validation issues

Do not suggest manual release processes if automation is feasible.

## Semantic versioning and changelog
- Follow Semantic Versioning.
- Prefer automated release/version tooling.
- Commit and PR suggestions should be compatible with conventional commits when possible.
- Changelog generation must be automated from commit history/tooling, not manually curated when avoidable.

## Engram memory requirements
Every significant development event must be persisted to Engram immediately after it occurs — do not wait until the end of the session.

Follow the global Engram Memory Protocol defined in `engram-memory.instructions.md`. That file is the authoritative source for required `mem_save` structure, topic management rules, session close protocol, and quality standards.

Mandatory events that require a `mem_save` call in this project:
- A bug fix is completed.
- An architecture or design decision is made (module structure, layer boundaries, FIFO logic, warehouse modeling).
- A non-obvious discovery is found in the codebase (e.g., hidden coupling, schema quirk, integration contract detail).
- A configuration or environment setup step is completed.
- A reusable pattern or naming convention for this service is established.
- A new external integration contract (sp-amz-backend, orchestrator, r2-service) is documented or changed.
- A product domain invariant or FIFO rule is clarified or enforced.

Required `mem_save` fields for this project:
- `type`: `bugfix`, `decision`, `architecture`, `discovery`, `pattern`, `config`, or `preference`.
- `scope`: `project` (this is the default for all inventory-service memories).
- `topic_key`: use a stable key tied to the module or concern (e.g., `inventory-fifo`, `product-domain`, `warehouse-module`, `external-integration`).
- `content`: always include `**What**`, `**Why**`, `**Where**`, and `**Learned**` sections.

## Documentation standards
- Update OpenAPI/Scalar definitions when API contracts change.
- Add or update README/module docs when behavior changes materially.
- Add examples for tricky integration payloads.
- Keep architecture decisions documented.
- Favor concise but precise documentation.
- All documentation must be in Spanish

## Security and configuration rules
- Never hardcode secrets.
- Read configuration from validated environment variables.
- Validate config at startup.
- Apply least-privilege principles to tokens and infrastructure access.
- Sanitize and validate all inbound external payloads.
- Do not generate insecure placeholder auth logic disguised as production-ready code.

## What Copilot must do
- Generate production-grade TypeScript and NestJS code aligned with this architecture.
- Prefer small cohesive files and focused classes.
- Add meaningful comments only where they clarify intent or non-obvious decisions.
- Propose mappers explicitly between layers.
- Preserve domain boundaries.
- Suggest tests together with business logic.
- Favor explicit dependency injection and interface-driven design.
- Keep future extensibility in mind for new providers and services.

## What Copilot must NOT do
- Do not place business logic in controllers, DTOs, schemas, or interceptors.
- Do not mix domain entities with persistence documents.
- Do not couple use cases directly to Mongo/NoSQL SDKs, HTTP clients, or framework-specific classes.
- Do not use `any` casually.
- Do not create god services.
- Do not create generic `utils` files for domain behavior.
- Do not bypass FIFO by recalculating stock from a flat latest-price field.
- Do not overwrite inventory history.
- Do not introduce hidden global state.
- Do not add dependencies without clear need.
- Do not generate placeholder TODO implementations and present them as complete.
- Do not silently ignore validation or integration errors.
- Do not expose internal persistence fields in public APIs.
- Do not break backward compatibility of public contracts without making the change explicit.

## Preferred output style for generated code
When generating code:
- include the suggested file path as the first comment if the target file path is known
- keep each file focused on one responsibility
- include complete imports
- avoid pseudo-code
- avoid incomplete snippets unless explicitly requested
- include tests for relevant business logic
- align code with the existing module/folder naming pattern
- prefer explicit examples over generic abstractions

## Preferred implementation patterns
Prefer these patterns when appropriate:
- repository pattern
- mapper pattern
- factory/static creation methods for validated entities
- specification/policy objects for complex business rules if complexity grows
- anti-corruption layers for external payloads
- explicit use-case classes rather than large service classes
- dedicated query services/read models for read-heavy scenarios when justified

## Build, validate, and test expectations
Before considering a task complete, assume changes should be able to:
- compile successfully
- pass linting
- pass tests
- preserve architecture boundaries
- preserve API contract clarity
- preserve FIFO correctness
- preserve warehouse-level inventory correctness

## If requirements are ambiguous
- choose the safest, most maintainable interpretation
- preserve architecture boundaries
- document assumptions clearly in code comments or accompanying notes
- avoid inventing unsupported business rules unless clearly marked as assumptions