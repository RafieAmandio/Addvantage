export type NotificationKind = "alert" | "plan" | "consult" | "education" | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  ts: string;
  href: string;
}
