import type { ConsultMessage, ConsultMessageRow } from "@/features/consult/types";

export function rowToMessage(row: ConsultMessageRow): ConsultMessage {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "admin",
    ts: row.createdAt,
    body: row.content,
    tags: [],
  };
}
