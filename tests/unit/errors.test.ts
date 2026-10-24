import { describe, expect, it } from "vitest";
import {
  BadRequestError,
  ForbiddenError,
  ModelOutputInvalidError,
  NotFoundError,
  PayloadTooLargeError,
  ProviderError,
  ProviderTimeoutError,
  RateLimitedError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnsupportedMediaTypeError,
  handleRouteError,
} from "@/lib/errors";

describe("lib/errors taxonomy and responses", () => {
  it("creates standard 400 BadRequestError with code invalid_input", async () => {
    const err = new BadRequestError("Invalid document type.");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("invalid_input");

    const res = err.toResponse();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid document type.");
    expect(body.code).toBe("invalid_input");
  });

  it("creates 401 UnauthorizedError", async () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("unauthenticated");
  });

  it("creates 403 ForbiddenError", async () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("forbidden");
  });

  it("creates 404 NotFoundError", async () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("not_found");
  });

  it("creates 413 PayloadTooLargeError", async () => {
    const err = new PayloadTooLargeError("File exceeds 4 MB.", { limit: 4194304 });
    expect(err.statusCode).toBe(413);
    expect(err.code).toBe("file_too_large");
    const res = err.toResponse();
    const body = await res.json();
    expect(body.details.limit).toBe(4194304);
  });

  it("creates 415 UnsupportedMediaTypeError", async () => {
    const err = new UnsupportedMediaTypeError("Password-protected PDF.", "encrypted_pdf");
    expect(err.statusCode).toBe(415);
    expect(err.code).toBe("encrypted_pdf");
  });

  it("creates 422 ModelOutputInvalidError", async () => {
    const err = new ModelOutputInvalidError();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("model_output_invalid");
  });

  it("creates 429 RateLimitedError with Retry-After header", async () => {
    const err = new RateLimitedError(45);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("rate_limited");
    const res = err.toResponse();
    expect(res.headers.get("Retry-After")).toBe("45");
  });

  it("creates 502 ProviderError", async () => {
    const err = new ProviderError();
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("provider_error");
  });

  it("creates 503 ServiceUnavailableError", async () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("service_unavailable");
  });

  it("creates 504 ProviderTimeoutError", async () => {
    const err = new ProviderTimeoutError();
    expect(err.statusCode).toBe(504);
    expect(err.code).toBe("provider_timeout");
  });

  it("handles unexpected errors cleanly with 500 without leaking sensitive messages", async () => {
    const unknownErr = new Error("Connection failed: secret password was xxx");
    const res = handleRouteError(unknownErr);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("internal_error");
    expect(body.error).not.toContain("secret password");
  });
});
