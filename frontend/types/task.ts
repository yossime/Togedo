// Mirrors the TaskStatus enum in the backend Prisma schema
// (backend/src/prisma/schema/schema.prisma).
export const TASK_STATUSES = ['OPEN', 'CLAIMED', 'IN_PROGRESS', 'DONE'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
