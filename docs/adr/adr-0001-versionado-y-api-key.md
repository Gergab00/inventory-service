---
title: "ADR-0001: Versionado de API pública y autenticación técnica por api_key"
status: "Accepted"
date: "2026-04-10"
authors: "Equipo de inventory-service"
tags: ["architecture", "api", "security"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Versionado de API pública y autenticación técnica por `api_key`

## Status

**Accepted**

## Context

El servicio necesitaba exponer una API pública estable desde el inicio y, al mismo tiempo, contar con una barrera técnica mínima para impedir llamadas no autorizadas mientras la autenticación de usuarios/roles todavía no existe.

Además, los lineamientos del repositorio ya exigían que la API fuese **explícita, versionada y segura por defecto**.

## Decision

Se decidió que:

- **DEC-001**: toda la API pública se expone bajo `\`/api/v1\``.
- **DEC-002**: toda llamada a `\`/api/v1/**\`` debe incluir el header `\`api_key\``.
- **DEC-003**: el valor recibido se compara contra la variable de entorno `\`API_KEY\``.
- **DEC-004**: si la clave falta o no coincide, la solicitud se rechaza con `\`401 Unauthorized\``.
- **DEC-005**: el esquema se documenta en OpenAPI/Scalar mediante `ApiSecurity('api_key')`.

## Consequences

### Positive

- **POS-001**: la API nace versionada y preparada para evolucionar sin romper contratos.
- **POS-002**: existe una protección técnica uniforme para todos los endpoints públicos.
- **POS-003**: Swagger/Scalar comunica claramente el requisito de autenticación actual.

### Negative

- **NEG-001**: `api_key` no sustituye autenticación/autorización real por usuario o rol.
- **NEG-002**: todos los consumidores comparten la misma credencial técnica.
- **NEG-003**: será necesario evolucionar el esquema si aparecen perfiles, permisos o auditoría de actor.

## Alternatives Considered

### API sin autenticación inicial

- **ALT-001**: **Description**: exponer `\`/api/v1\`` sin ninguna protección técnica temporal.
- **ALT-002**: **Rejection Reason**: deja el servicio innecesariamente abierto mientras la seguridad completa todavía no existe.

### JWT/RBAC desde la primera entrega

- **ALT-003**: **Description**: implementar autenticación completa por usuarios y roles desde el arranque.
- **ALT-004**: **Rejection Reason**: aumenta el alcance de manera significativa y bloquea la entrega temprana del contrato de negocio.

## Implementation Notes

- **IMP-001**: la validación se implementó con `ApiKeyGuard` global usando `APP_GUARD`.
- **IMP-002**: la configuración depende de `AppConfigService` y de `API_KEY` en entorno.
- **IMP-003**: las pruebas e2e validan explícitamente los casos sin clave y con clave inválida.

## References

- **REF-001**: `src/interfaces/http/guards/api-key.guard.ts`
- **REF-002**: `src/infrastructure/config/http-application.setup.ts`
- **REF-003**: `src/infrastructure/config/api-documentation.setup.ts`
