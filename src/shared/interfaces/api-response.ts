export type Link = string | { href: string; meta?: Record<string, unknown> };

export interface TopLevelLinks {
  self?: Link;
  first?: Link | null;
  last?: Link | null;
  prev?: Link | null;
  next?: Link | null;
  related?: Link;
}

export interface BaseMeta {
  [k: string]: unknown;
}

// Paginación OFFSET
export interface OffsetPaginationMeta extends BaseMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
export interface OffsetPaginationLinks extends TopLevelLinks {}

// Paginación CURSOR
export interface CursorPaginationMeta extends BaseMeta {
  pageSize: number;
  startCursor?: string;
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
export interface CursorPaginationLinks extends TopLevelLinks {}

/** -------------------------------
 *  RFC 9457 Problem Details
 *  ------------------------------- */
/**
 * Problem Details (RFC 9457).
 * Campos opcionales; si "type" no está, se asume "about:blank".
 * Usa Content-Type: application/problem+json.
 */
export interface ProblemDetails {
  /** URI que identifica el tipo de problema; por defecto "about:blank". */
  type?: string; // URI reference
  /** Resumen corto del tipo de problema (estable por tipo). */
  title?: string;
  /** Código HTTP usado por el servidor para esta ocurrencia. */
  status?: number; // 100..599
  /** Explicación específica de esta ocurrencia (orientada a corregir). */
  detail?: string;
  /** URI de la ocurrencia específica (puede ser no dereferenciable). */
  instance?: string; // URI reference
  /** Extensiones libres por tipo (p.ej., "errors", "traceId", etc.). */
  [ext: string]: unknown;
}

/** Extensión de validación (ejemplo recomendado por RFC 9457) */
export interface ValidationErrorItem {
  /** Mensaje de la regla fallida (p.ej., "must be a positive integer"). */
  detail: string;
  /** JSON Pointer al campo en el body, p.ej. "#/age" o "#/profile/color". */
  pointer?: string;
}

/** Problema de validación tipado (puedes fijar tu propia URI de tipo). */
export type ValidationProblem = ProblemDetails & {
  type: string; // ej: "https://api.tu-dominio.com/problems/validation-error"
  errors: ValidationErrorItem[];
};

/** -------------------------------
 *  Envelopes
 *  ------------------------------- */
export interface ApiSuccess<
  T,
  M extends BaseMeta = BaseMeta,
  L extends TopLevelLinks = TopLevelLinks,
> {
  status: 'success';
  data: T;
  meta?: M;
  links?: L;
  requestId?: string;
  warnings?: Array<{ code: string; title: string; detail?: string }>;
}

/** "Fail" de negocio/validación (no excepción). */
export interface ApiFail {
  status: 'fail';
  data: Record<string, unknown> | ValidationErrorItem[];
  requestId?: string;
}

/** Error técnico/operacional serializado con RFC 9457. */
export interface ApiError {
  status: 'error';
  error: ProblemDetails; // admite extensiones como { errors: [...] }
  requestId?: string;
}

/** Unión estándar */
export type ApiResponse<T, M extends BaseMeta = BaseMeta, L extends TopLevelLinks = TopLevelLinks> =
  ApiSuccess<T, M, L> | ApiFail | ApiError;

/** Helpers */
export const isSuccess = <T, M extends BaseMeta, L extends TopLevelLinks>(
  r: ApiResponse<T, M, L>,
): r is ApiSuccess<T, M, L> => r.status === 'success';

export const isFail = <T, M extends BaseMeta, L extends TopLevelLinks>(
  r: ApiResponse<T, M, L>,
): r is ApiFail => r.status === 'fail';

export const isError = <T, M extends BaseMeta, L extends TopLevelLinks>(
  r: ApiResponse<T, M, L>,
): r is ApiError => r.status === 'error';
