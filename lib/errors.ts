import { NextResponse } from "next/server";

export type ErrorCode =
  | "invalid_input"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "file_too_large"
  | "unsupported_file"
  | "encrypted_pdf"
  | "too_many_pages"
  | "model_output_invalid"
  | "rate_limited"
  | "spend_capped"
  | "provider_error"
  | "service_unavailable"
  | "provider_timeout"
  | "internal_error";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly retryAfter?: number;
  public readonly details?: Record<string, unknown>;

  constructor(options: {
    message: string;
    statusCode: number;
    code: ErrorCode;
    retryAfter?: number;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryAfter = options.retryAfter;
    this.details = options.details;
  }

  toResponse(): NextResponse {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.retryAfter && this.retryAfter > 0) {
      headers["Retry-After"] = String(this.retryAfter);
    }

    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        ...(this.details ? { details: this.details } : {}),
      },
      { status: this.statusCode, headers }
    );
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request.", details?: Record<string, unknown>) {
    super({ message, statusCode: 400, code: "invalid_input", details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sign-in required to continue.") {
    super({ message, statusCode: 401, code: "unauthenticated" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super({ message, statusCode: 403, code: "forbidden" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource could not be found.") {
    super({ message, statusCode: 404, code: "not_found" });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "The uploaded file exceeds the 4 MB limit.", details?: Record<string, unknown>) {
    super({ message, statusCode: 413, code: "file_too_large", details });
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Only PDF, PNG, JPEG, and WebP files are supported.", code: ErrorCode = "unsupported_file") {
    super({ message, statusCode: 415, code });
  }
}

export class ModelOutputInvalidError extends AppError {
  constructor(message = "The analysis output could not be validated. Please try again.") {
    super({ message, statusCode: 422, code: "model_output_invalid" });
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfter = 60, message = "Rate limit exceeded. Please wait a moment before trying again.") {
    super({ message, statusCode: 429, code: "rate_limited", retryAfter });
  }
}

export class SpendCappedError extends AppError {
  constructor(message = "The system daily analysis spend ceiling has been reached. Please try again tomorrow.") {
    super({ message, statusCode: 429, code: "spend_capped" });
  }
}

export class ProviderError extends AppError {
  constructor(message = "The AI provider encountered a transient error. Please try again in a few minutes.") {
    super({ message, statusCode: 502, code: "provider_error" });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service is temporarily unavailable.") {
    super({ message, statusCode: 503, code: "service_unavailable" });
  }
}

export class ProviderTimeoutError extends AppError {
  constructor(message = "The analysis timed out. Try uploading a smaller or clearer document.") {
    super({ message, statusCode: 504, code: "provider_timeout" });
  }
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return error.toResponse();
  }
  return NextResponse.json(
    {
      error: "An unexpected error occurred. Please try again.",
      code: "internal_error",
    },
    { status: 500 }
  );
}
