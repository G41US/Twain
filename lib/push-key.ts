// Public half of the VAPID key pair (safe to ship); the private half is the VAPID_PRIVATE_KEY env var.
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BNOqmwwUx3fm7yU8AQiaLqj0ZMFu4APFJve5Mhy5ttpOwj-QcMM72x7oWzi7Py25HOE2YHKUmzojQpc9lCIczs0";
