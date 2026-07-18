import type {
  ConsultAttachment,
  ConsultMessage,
  ConsultMessageRow,
} from "@/features/consult/types";

function extractImage(
  metadata: ConsultMessageRow["metadata"],
): ConsultAttachment | undefined {
  if (!metadata || metadata.type !== "image") return undefined;
  const url = metadata.imageUrl;
  if (typeof url !== "string" || url.length === 0) return undefined;
  return {
    url,
    name: typeof metadata.originalName === "string" ? metadata.originalName : undefined,
    contentType: typeof metadata.contentType === "string" ? metadata.contentType : undefined,
  };
}

export function rowToMessage(row: ConsultMessageRow): ConsultMessage {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "admin",
    ts: row.createdAt,
    body: row.content,
    tags: [],
    image: extractImage(row.metadata),
  };
}
