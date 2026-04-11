import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export type HttpRequestWithRequestId = Request & {
  requestId?: string;
};

export function createRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function ensureRequestId(request: Request): string {
  const httpRequest = request as HttpRequestWithRequestId;

  if (typeof httpRequest.requestId === 'string' && httpRequest.requestId.length > 0) {
    return httpRequest.requestId;
  }

  const requestIdHeader = request.header('x-request-id')?.trim();
  const requestId = requestIdHeader && requestIdHeader.length > 0
    ? requestIdHeader
    : createRequestId();

  httpRequest.requestId = requestId;

  return requestId;
}

export function createTimestamp(): string {
  return new Date().toISOString();
}
