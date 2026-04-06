<!-- File: docs/instructions/domain-api.instructions.md -->

# Domain and API instructions for `inventory-service`

## Purpose

This file defines domain rules and public API behavior for `inventory-service`.

It complements:
- `copilot-instructions.md`
- `architecture.instructions.md`

This file does **not** replace repository-wide or path-based architectural rules.
Use it to make domain modeling and API generation consistent across modules, DTOs, use cases, controllers, repositories, tests, and documentation.

When generating code, Copilot must treat this file as the authoritative source for:
- domain vocabulary
- resource semantics
- API contract intent
- product identity rules
- warehouse rules
- inventory and FIFO rules
- soft-delete behavior
- filtering behavior
- transport-level expectations tied to domain meaning

If any generated code conflicts with this file, adjust the code to match this file.

---

# 1) Generation priority and interpretation rules

When generating code or documentation for this repository, follow this precedence order:

1. `copilot-instructions.md`
2. `architecture.instructions.md`
3. `domain-api.instructions.md`
4. prompt-specific instructions

If a prompt is more generic than this file, prefer this file.
If a prompt suggests CRUD behavior that contradicts domain semantics defined here, prefer the domain semantics defined here.

Always choose the safest, clearest, and most maintainable interpretation.

---

# 2) Core domain contexts

The service is organized around these business capabilities:

- `products`
- `warehouses`
- `inventory`

These capabilities must remain conceptually separate even when they collaborate.

## Context ownership

### Products
Responsible for:
- product identity
- core product data
- external product identifiers
- product status
- product image references

Not responsible for:
- warehouse processing time
- stock quantity as a flat mutable field
- FIFO valuation logic

### Warehouses
Responsible for:
- warehouse identity
- warehouse name
- warehouse operational status
- warehouse processing time

Not responsible for:
- product identity
- product image references
- FIFO stock depletion rules

### Inventory
Responsible for:
- inventory entries
- inventory exits
- inventory adjustments
- inventory lots/layers
- movement traceability
- FIFO stock consumption
- warehouse-level availability

Not responsible for:
- defining product identity
- storing product as a persistence shortcut copy unless explicitly justified for read-model purposes

---

# 3) Ubiquitous language

Use the following domain language consistently in code, tests, DTOs, docs, and prompts.

## Product
A business entity identified by an internal unique `productId`.

## External Identifier
A provider or marketplace-specific identifier associated with a product, such as:
- `asin`
- `ean`
- `upc`
- `gtin`

These identifiers support lookup and integration, but they do **not** replace the internal product identity.

## Warehouse
A physical or operational storage location identified by an internal unique `warehouseId`.

## Processing Time
A warehouse-owned value representing internal preparation time before shipment readiness.
Use `processingTimeDays`.

## Inventory Lot
A FIFO inventory layer created when stock enters the system with a quantity, cost, and timestamp.

## Inventory Movement
An auditable domain event representing stock entry, exit, or adjustment.

## Available Quantity
The remaining quantity in an inventory lot that is still eligible for consumption.

## Depleted Lot
A lot whose `availableQuantity` reached zero and remains stored for auditability.

---

# 4) Product domain rules

## 4.1 Product identity

- Every product must have a system-generated internal unique identifier named `productId`.
- `productId` is the only canonical identity of the product inside the service.
- External identifiers must never replace `productId`.
- API routes must use `productId` as the path identifier for product operations.

## 4.2 External identifiers

Products may contain zero or more external identifiers.

External identifiers must be modeled as an explicit structured collection, for example:
- `externalIdentifiers`

Each external identifier must support at least:
- `type`
- `value`

It may also support, when the integration requires it:
- `provider`
- `marketplaceId`

Copilot must treat external identifiers as:
- searchable fields
- integration-support fields
- non-canonical identity fields

Copilot must **not**:
- use `ean`, `asin`, `upc`, or `gtin` as the main product ID
- flatten all external identifiers into unrelated top-level product fields when a collection is more consistent
- assume one identifier type is always present

## 4.3 Product status

Products must support lifecycle status.

Minimum expected statuses:
- `active`
- `inactive`

Behavior rules:
- `active` products are available for normal operations
- `inactive` products are logically deleted or disabled
- product deletion in the public API must be implemented as soft delete through status change
- physical deletion must not be the default behavior

## 4.4 Product images

Product images are integration-driven references.

Persist only stable reference data such as:
- object key
- storage path
- file reference
- image metadata when relevant

Do **not** persist signed temporary URLs as canonical image state.

If an external service provides image references indirectly:
- normalize the payload
- store stable references
- generate signed URLs only in read or integration flows when required

## 4.5 Flexible product attributes

Because product shape can evolve over time, the persistence model may store external or flexible product attributes in a controlled extensible structure.

However:
- core invariants must remain explicit
- core fields must not be buried inside an untyped blob
- flexible attributes must not weaken product identity or product lifecycle rules

Copilot must preserve a clear distinction between:
- core product fields
- external identifiers
- flexible provider-originated attributes

---

# 5) Warehouse domain rules

## 5.1 Warehouse identity

- Every warehouse must have a system-generated internal unique identifier named `warehouseId`.
- `warehouseId` is the canonical warehouse identity used by the API and domain.

## 5.2 Warehouse fields

A warehouse must support at least:
- `warehouseId`
- `name`
- `processingTimeDays`
- `status`

## 5.3 Processing time

- `processingTimeDays` must be an integer greater than or equal to zero.
- It represents warehouse processing time before shipment readiness.
- It belongs to the warehouse, not to the product.

Copilot must not:
- duplicate `processingTimeDays` as a core product field
- treat it as inventory-lot data unless there is a justified derived read model

## 5.4 Warehouse status and deletion

Warehouses must support lifecycle status.

Minimum expected statuses:
- `active`
- `inactive`

Behavior rules:
- delete operations must behave as soft delete through status change
- physical deletion must not be the default behavior
- historical inventory traceability must remain possible even if a warehouse becomes inactive

---

# 6) Inventory domain rules

This is the most important domain area for consistency.

## 6.1 Inventory modeling

Inventory must be modeled using:
- inventory lots/layers
- inventory movements

Do **not** model inventory only as a flat mutable quantity per product.

Do **not** generate simplistic CRUD inventory code that loses FIFO traceability.

## 6.2 Inventory lots

Each inventory entry creates a lot or FIFO layer.

A lot must preserve at least:
- `lotId`
- `productId`
- `warehouseId`
- `originalQuantity`
- `availableQuantity`
- `unitCost`
- `sourceReference`
- `createdAt`
- `status`

Optional fields may include:
- `currency`
- `notes`
- `createdBy`
- `reasonCode`

## 6.3 FIFO behavior

FIFO consumption is mandatory.

Rules:
- when inventory exits occur, the system must consume the oldest eligible lot first
- only lots with available quantity greater than zero are eligible
- the algorithm must be deterministic and auditable
- historical cost layers must never be overwritten

Copilot must not:
- recalculate stock from a single latest-price field
- overwrite historical layers
- remove traceability of consumption order

## 6.4 Inventory exits

Inventory exits must be modeled as explicit domain operations.

Do **not** implement stock depletion as a generic arbitrary `PUT /inventory/{id}` update.

Instead, treat exits as a business action with explicit intent, such as:
- reserve stock
- consume stock
- register stock exit

The initial public API contract for this repository will use:
- `POST /api/v1/inventory/exits`

This operation must:
- validate product existence
- validate warehouse rules when applicable
- locate eligible lots
- consume stock in FIFO order
- preserve auditability of all affected lots and movements

## 6.5 Inventory adjustments

Inventory discrepancies must be handled through explicit adjustment operations, not hidden updates.

Use:
- `POST /api/v1/inventory/adjustments`

Adjustments must be auditable and explicit.

## 6.6 Depleted lots

When a lot reaches zero available quantity:
- do not physically delete it
- preserve it for traceability
- mark it as depleted through state and/or `availableQuantity = 0`

## 6.7 Inventory deletion

Do **not** create normal public delete behavior for inventory lots or inventory movements as if they were ordinary CRUD resources.

If a wrong entry must be corrected:
- prefer a compensating movement
- or a controlled cancellation use case if business rules allow it

Copilot must avoid generating:
- `DELETE /inventory/{id}` as the standard inventory API contract
- raw hard-delete logic for lots participating in history

---

# 7) Public API versioning and route rules

## 7.1 Versioning

All public routes must be versioned from the beginning.

Use:
- `/api/v1/...`

Do not generate unversioned public routes.

## 7.2 Route naming

Use plural resources when the API is resource-oriented:
- `/products`
- `/warehouses`

Use explicit action-oriented paths when the domain requires business-operation semantics:
- `/inventory/entries`
- `/inventory/exits`
- `/inventory/adjustments`

Do not force artificial CRUD if the domain needs explicit commands.

---

# 8) Product API contract rules

## 8.1 Supported endpoints

The product API must support:

- `GET /api/v1/products/{productId}`
- `GET /api/v1/products`
- `POST /api/v1/products`
- `PUT /api/v1/products/{productId}`
- `PUT /api/v1/products/{productId}/images`
- `DELETE /api/v1/products/{productId}`

## 8.2 Product listing filters

`GET /api/v1/products` may support filters such as:
- `title`
- `brand`
- `status`
- `identifierType`
- `identifierValue`

Copilot should generate query DTOs and validation accordingly when listing/filter endpoints are implemented.

## 8.3 Product creation and update payload rules

For `POST /products` and `PUT /products/{productId}`:
- external identifiers must be sent inside the product payload
- they must not be modeled as unrelated transport fragments outside the product contract
- request DTOs must be mapped to application commands
- application commands must be mapped to domain structures

Copilot must not:
- pass request DTOs directly into domain entities
- expose persistence documents directly in responses

## 8.4 Product deletion behavior

`DELETE /api/v1/products/{productId}` must perform soft delete behavior by changing product status to inactive or equivalent lifecycle state.

Do not generate physical delete as the default behavior.

---

# 9) Warehouse API contract rules

## 9.1 Supported endpoints

The warehouse API must support:

- `GET /api/v1/warehouses/{warehouseId}`
- `GET /api/v1/warehouses`
- `POST /api/v1/warehouses`
- `PUT /api/v1/warehouses/{warehouseId}`
- `DELETE /api/v1/warehouses/{warehouseId}`

## 9.2 Warehouse create/update payload rules

Warehouse payloads must support:
- `name`
- `processingTimeDays`
- lifecycle fields when needed by the use case

Validation expectations:
- `name` must be explicit and non-empty
- `processingTimeDays` must be a valid integer and must not be negative

## 9.3 Warehouse deletion behavior

`DELETE /api/v1/warehouses/{warehouseId}` must behave as soft delete through status change.

Do not generate physical delete as the standard behavior.

---

# 10) Inventory API contract rules

## 10.1 Supported endpoints

The inventory API must support:

- `GET /api/v1/inventory/lots/{lotId}`
- `GET /api/v1/inventory/products/{productId}`
- `GET /api/v1/inventory/products/{productId}/availability`
- `GET /api/v1/inventory/movements`
- `POST /api/v1/inventory/entries`
- `POST /api/v1/inventory/exits`
- `POST /api/v1/inventory/adjustments`

## 10.2 Inventory entry behavior

`POST /api/v1/inventory/entries` must:
- register new inventory stock
- create a new lot
- preserve quantity, cost, timestamps, and source reference
- never merge away traceability that would weaken FIFO behavior

## 10.3 Inventory exit behavior

`POST /api/v1/inventory/exits` must:
- consume stock using FIFO
- preserve movement history
- update affected lots deterministically
- fail explicitly if stock is insufficient

## 10.4 Inventory adjustments

`POST /api/v1/inventory/adjustments` must:
- represent corrective stock changes
- preserve auditability
- require an explicit reason or adjustment intent when the use case requires it

## 10.5 Product inventory queries

`GET /api/v1/inventory/products/{productId}` must return the product inventory lots ordered from oldest to newest by default when FIFO visibility is relevant.

`GET /api/v1/inventory/products/{productId}/availability` must support warehouse-aware stock visibility when needed.

---

# 11) HTTP status and error mapping rules

Use consistent transport behavior.

## Successful responses
- `POST` create: `201 Created`
- `GET`: `200 OK`
- `PUT`: `200 OK`
- soft delete may use:
  - `200 OK`, or
  - `204 No Content`

Choose one style and keep it consistent across the API.

## Error responses
- validation errors: `400 Bad Request`
- resource not found: `404 Not Found`
- business conflicts: `409 Conflict`

Examples of business conflicts:
- duplicate product identity rule violation when applicable
- invalid lifecycle transition
- insufficient stock for a requested exit

Do not expose infrastructure internals in API responses.

Use machine-readable error codes when possible.

---

# 12) DTO and mapping rules tied to this domain

Copilot must preserve transport-to-application-to-domain separation.

## Required mapping flow
- request DTO
- application command/query
- domain input structure
- domain result
- response DTO

Do not collapse these layers casually in non-trivial flows.

## Product DTO rules
Product DTOs must distinguish clearly between:
- core product fields
- external identifiers
- image references
- status

## Warehouse DTO rules
Warehouse DTOs must distinguish clearly between:
- identity
- operational fields
- lifecycle state

## Inventory DTO rules
Inventory DTOs must distinguish clearly between:
- inventory entry intent
- inventory exit intent
- adjustment intent
- read-model response shape
- lot details
- movement details

Do not reuse one generic DTO for unrelated inventory actions.

---

# 13) Persistence guidance tied to the domain

This file does not define persistence technology details, but it does define domain-safe persistence expectations.

## Products
Persistence may support flexible attributes, but:
- core identity must remain explicit
- external identifiers must remain queryable
- status must remain explicit
- image references must remain stable references, not temporary URLs

## Warehouses
Persistence must preserve:
- warehouse identity
- warehouse name
- processing time
- status

## Inventory
Persistence must preserve:
- lot history
- movement history
- available quantity
- unit cost traceability
- FIFO ordering data

Do not generate persistence logic that destroys auditability.

---

# 14) Search and lookup rules

## Product lookup
Primary lookup:
- `productId`

Secondary lookup:
- external identifiers
- title-based search
- brand-based search

External identifier search must support explicit query parameters such as:
- `identifierType`
- `identifierValue`

Do not treat free-text search as a substitute for structured identifier search.

## Warehouse lookup
Primary lookup:
- `warehouseId`

## Inventory lookup
Use explicit routes and query intent:
- by `lotId`
- by `productId`
- by warehouse scope when required
- by movement history filters when relevant

---

# 15) What Copilot must prefer for this domain

Prefer:
- explicit use cases
- explicit commands for inventory entry, exit, and adjustment
- explicit mappers
- value objects for IDs, quantities, money, and statuses when justified
- repository/query ports with precise names
- thin controllers
- domain-safe response DTOs
- test cases for FIFO, lifecycle transitions, and identifier filtering

---

# 16) What Copilot must avoid for this domain

Do not:
- generate flat inventory CRUD that weakens FIFO
- generate `DELETE /inventory/{id}` as standard inventory API
- use external identifiers as canonical product identity
- store signed image URLs as canonical product image data
- bypass soft delete rules for products or warehouses
- pass controller DTOs directly into domain entities
- expose raw NoSQL documents in responses
- merge unrelated inventory actions into one generic endpoint
- hide business rules in controllers, DTOs, schemas, or decorators

---

# 17) Required high-value tests derived from this file

When generating tests for this domain, prioritize:

## Products
- should create a product with multiple external identifiers
- should filter products by identifier type and identifier value
- should soft delete a product by changing its lifecycle status
- should reject invalid product payloads

## Warehouses
- should create a warehouse with valid processing time
- should reject negative processing time
- should soft delete a warehouse without losing historical relationships

## Inventory
- should create a FIFO lot on inventory entry
- should consume the oldest eligible lot first on inventory exit
- should preserve depleted lots for auditability
- should reject inventory exit when stock is insufficient
- should return lots ordered from oldest to newest for product inventory queries
- should register explicit inventory adjustments with traceability

---

# 18) Documentation expectations derived from this file

When generating documentation for these APIs:
- explain domain meaning, not only endpoint shape
- document soft delete behavior explicitly
- document external identifier semantics explicitly
- document FIFO rules explicitly
- document that inventory is modeled as lots and movements, not as flat mutable stock only

All documentation in this repository must remain in Spanish, even if instruction files are written in English for Copilot readability, unless a specific artifact explicitly requires another language.

---

# 19) Prompt derivation rule

Future reusable prompts for:
- use cases
- module slices
- DTO generation
- repository adapters
- unit tests
- e2e tests
- ADRs

must assume the rules in this file are already established.

Prompts must reference this file instead of re-defining these domain and API rules repeatedly.

This file should be treated as the stable base for prompt derivation.