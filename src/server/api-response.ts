import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiPagination = {
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
  page: number;
};

export type ApiEnvelope<T> = {
  data?: T;
  error?: ApiError;
  pagination?: ApiPagination;
  success: boolean;
};

export class ApiErrorResponse extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function ok<T>(data: T, init?: ResponseInit & { pagination?: ApiPagination }) {
  return NextResponse.json<ApiEnvelope<T>>(
    {
      success: true,
      data,
      pagination: init?.pagination,
    },
    init,
  );
}

export function fail(code: string, message: string, status = 400, init?: ResponseInit) {
  return NextResponse.json<ApiEnvelope<never>>(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    {
      ...init,
      status,
    },
  );
}

export function normalizeError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      code: "validation_error",
      message: error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; "),
      status: 422,
    };
  }

  if (error instanceof Error) {
    if (error instanceof ApiErrorResponse) {
      return {
        code: error.code,
        message: error.message,
        status: error.status,
      };
    }

    if (error.message.startsWith("Missing required environment variable")) {
      return {
        code: "server_misconfigured",
        message: error.message,
        status: 500,
      };
    }

    return {
      code: "server_error",
      message: "Unexpected server error.",
      status: 500,
    };
  }

  return {
    code: "server_error",
    message: "Unexpected server error.",
    status: 500,
  };
}

export function handleApiError(error: unknown) {
  const normalized = normalizeError(error);

  return fail(normalized.code, normalized.message, normalized.status);
}
