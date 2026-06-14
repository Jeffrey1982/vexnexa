export interface ApiErrorPayload {
  code?: string
  error?: string
  limit?: number
  current?: number
  retryAfter?: number
  limitAfterCancellation?: number
}

type ErrorTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string

const ERROR_KEYS: Record<string, string> = {
  ALREADY_ACTIVE: "alreadyActive",
  ALREADY_EXISTS: "alreadyExists",
  CAPACITY_IN_USE: "capacityInUse",
  CONFLICT: "alreadyExists",
  DATABASE_ERROR: "generic",
  EXTERNAL_SERVICE_ERROR: "serviceUnavailable",
  FORBIDDEN: "forbidden",
  FREE_LIMIT_REACHED: "pageLimitReached",
  INTERNAL_ERROR: "generic",
  INVALID_INPUT: "invalidInput",
  INVALID_TOKEN: "sessionExpired",
  LIMIT_REACHED: "pageLimitReached",
  NO_PAYMENT_METHOD: "noPaymentMethod",
  NOT_FOUND: "notFound",
  PAYMENT_METHOD_EXPIRED: "paymentExpired",
  PLAN_LIMIT_EXCEEDED: "planLimitReached",
  RATE_LIMIT_EXCEEDED: "rateLimit",
  SITE_LIMIT_REACHED: "siteLimitReached",
  SUBSCRIPTION_INACTIVE: "subscriptionInactive",
  UNAUTHORIZED: "unauthorized",
  UPGRADE_REQUIRED: "upgradeRequired",
  VALIDATION_ERROR: "invalidInput",
}

export function localizeApiError(
  t: ErrorTranslator,
  payload?: ApiErrorPayload | null,
  fallbackKey = "generic",
): string {
  const key = payload?.code ? ERROR_KEYS[payload.code] : undefined

  return t(key ?? fallbackKey, {
    limit: payload?.limit ?? 0,
    current: payload?.current ?? 0,
    retryAfter: payload?.retryAfter ?? 0,
    limitAfterCancellation: payload?.limitAfterCancellation ?? 0,
  })
}
