// Schema exports
export * from "./schema";

// Connection
export { createDatabaseClient, checkDatabaseHealth } from "./connection";
export type { DatabaseClient } from "./connection";

// Ownership helpers
export {
  verifyChildOwnership,
  verifySessionOwnership,
  verifyLessonOwnership,
  verifyAlertOwnership,
  OwnershipError,
} from "./ownership";
