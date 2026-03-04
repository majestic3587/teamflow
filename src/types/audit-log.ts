/** DB の public.entity_type enum に対応 */
export type EntityType = "task" | "project" | "workspace" | "comment";

/** DB の public.event_type enum に対応 */
export type EventType =
  | "CREATED"
  | "UPDATED"
  | "APPROVED"
  | "REJECTED"
  | "DELETED"
  | "DUE_DATE_CHANGED";

export type AuditLogMetadata = {
  entity_name?: string;
  [key: string]: unknown;
};

export type AuditLog = {
  id: string;
  workspace_id: string;
  entity_type: EntityType;
  entity_id: string;
  event_type: EventType;
  actor_id: string | null;
  metadata: AuditLogMetadata | null;
  created_at: string;
};

export type AuditLogWithActor = AuditLog & {
  actor_display_name: string | null;
};
