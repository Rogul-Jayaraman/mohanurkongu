import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../common/middleware/requestLogger.js';

function createMocks() {
  const headers: Record<string, string> = {};
  const req = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    method: 'GET',
    originalUrl: '/test?foo=bar',
    url: '/test?foo=bar',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    body: { name: 'test', password: 'secret123' },
    headers,
    account: undefined as { sub: string } | undefined,
  } as unknown as Request;

  const writeSpy = vi.fn();
  const originalStdoutWrite = process.stdout.write;
  process.stdout.write = writeSpy as unknown as typeof process.stdout.write;

  let jsonBody: unknown = null;
  let statusCode = 200;
  const res = {
    statusCode,
    status(code: number) { statusCode = code; return this as unknown as Response; },
    json(body: unknown) { jsonBody = body; return this as unknown as Response; },
    send(body?: unknown) { jsonBody = body; return this as unknown as Response; },
    getHeader(name: string) { return headers[name] ?? undefined; },
    on: vi.fn((_event: string, _cb: () => void) => this),
    writableFinished: false,
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next, writeSpy, originalStdoutWrite };
}

describe('requestLogger', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  afterEach(() => {
    process.stdout.write = mocks.originalStdoutWrite;
  });

  it('should call next()', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.next).toHaveBeenCalled();
  });

  it('should log request header for GET', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('REQUEST');
    expect(output).toContain('GET');
    expect(output).toContain('/test');
  });

  it('should log request header for POST', () => {
    mocks.req.method = 'POST';
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('POST');
  });

  it('should log request header for DELETE with correct spelling', () => {
    mocks.req.method = 'DELETE';
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('DELETE');
    expect(output).not.toContain('DELTE');
  });

  it('should log query parameters', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('foo');
    expect(output).toContain('bar');
  });

  it('should mask sensitive fields in request body', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('name');
    expect(output).toContain('test');
    expect(output).not.toContain('secret123');
    expect(output).toContain('password');
  });

  it('should log response on finish event', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log response on close event', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.res.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('should capture res.json() body and log it on finish', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);

    mocks.res.json({ success: true, data: { id: 1 } });

    const finishCb = (mocks.res.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: [string]) => c[0] === 'finish',
    )?.[1];
    if (finishCb) finishCb();

    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('success');
    expect(output).toContain('id');
  });

  it('should capture res.send() body and log it on finish', () => {
    requestLogger(mocks.req, mocks.res, mocks.next);

    mocks.res.send('plain text response');

    const finishCb = (mocks.res.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: [string]) => c[0] === 'finish',
    )?.[1];
    if (finishCb) finishCb();

    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    const capturedBodyLines = output.split('\n').filter(l => l.includes('plain'));
    expect(capturedBodyLines.length).toBeGreaterThanOrEqual(1);
  });

  it('should show user tag in response log when req.account is set', () => {
    mocks.req.account = { sub: 'user_abc123' };
    requestLogger(mocks.req, mocks.res, mocks.next);

    const finishCb = (mocks.res.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: [string]) => c[0] === 'finish',
    )?.[1];
    if (finishCb) finishCb();

    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('user_abc');
  });

  it('should handle missing req.id gracefully', () => {
    mocks.req.id = undefined as unknown as string;
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.next).toHaveBeenCalled();
  });

  it('should handle empty request body', () => {
    mocks.req.body = {};
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.next).toHaveBeenCalled();
  });

  it('should handle null request body', () => {
    mocks.req.body = null;
    requestLogger(mocks.req, mocks.res, mocks.next);
    expect(mocks.next).toHaveBeenCalled();
  });

  it('should handle missing originalUrl', () => {
    mocks.req.originalUrl = undefined as unknown as string;
    mocks.req.url = '/fallback';
    requestLogger(mocks.req, mocks.res, mocks.next);
    const output = mocks.writeSpy.mock.calls.map((c: [string]) => c[0]).join('');
    expect(output).toContain('/fallback');
  });
});
