---
agent: Plan
description: 'Create a complete vertical module slice following Clean Architecture, domain/API rules, and repository conventions'
tools: ['changes', 'codebase', 'editFiles', 'search']
---

Create a complete vertical module slice for this repository.

Follow these instruction sources strictly:
- [Global Copilot instructions](../copilot-instructions.md)
- [Backend architecture instructions](..\instructions\architecture.instructions.md)
- [Domain and API instructions](..\instructions\domain-api.instructions.md)

The goal is to generate a coherent, production-oriented module slice for a single business capability or use case, without breaking architecture boundaries.

## Required inputs

Business capability or module name:
${input:moduleName:Example: products, warehouses, inventory}

Business action or use case:
${input:useCaseName:Example: create-product, update-product-images, register-inventory-entry}

Requested outcome:
${input:goal:Describe the business result that the slice must support}

Primary HTTP entry point, if applicable:
${input:httpContract:Example: POST /api/v1/products}

Important domain rules that must be preserved:
${input:domainRules:Example: productId is the canonical identity; inventory exits must respect FIFO}

Scope constraints:
${input:scopeConstraints:Example: generate only the minimal files needed for this slice; do not implement unrelated endpoints}

## Your task

Generate the smallest correct vertical slice needed to support the requested business capability or use case.

The slice must follow Clean Architecture and module boundaries.

When applicable, generate only the files that are truly needed, such as:
- domain entity or value object
- domain error
- repository port
- application command
- use case
- mapper
- controller
- request DTO
- response DTO
- infrastructure repository stub or adapter contract
- Nest module wiring
- unit tests
- e2e or integration tests when justified

## Mandatory behavior

You must:
- preserve the allowed dependency direction inside the module
- keep controllers thin
- keep business rules out of controllers, DTOs, schemas, and decorators
- separate transport DTOs from application commands and domain models
- use explicit names
- return typed results
- suggest the target file path for every generated file
- generate complete code, not pseudo-code
- include tests for meaningful business behavior
- keep the implementation minimal but production-oriented
- make reasonable assumptions only when necessary and state them clearly

You must not:
- generate a giant service that mixes unrelated responsibilities
- flatten all concerns into a single file
- inject infrastructure details directly into application or domain logic
- expose raw persistence documents in responses
- invent unsupported business rules
- bypass repository or port abstractions
- generate generic utils or helper files for domain behavior

## Output format

Return the answer in this order:

1. Brief implementation summary
2. Assumptions
3. File tree
4. Generated files with complete content
5. Test strategy
6. Validation checklist

## Validation checklist requirements

The validation checklist must explicitly verify:
- architecture boundary compliance
- domain rule compliance
- API contract alignment
- naming consistency
- minimal file count with single responsibility
- test coverage for the main behavior

If the requested use case conflicts with the repository instructions or domain/API rules, do not continue with the conflicting implementation.
Instead, explain the conflict and propose the safest compliant version.