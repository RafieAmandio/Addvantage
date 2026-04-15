export interface SourceHealth {
  code: string;
  name: string;
  url: string;
  enabled: boolean;
  last_polled_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export interface IngestionRunSummary {
  id: string;
  source_code: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "ok" | "error";
  items_fetched: number;
  items_new: number;
  items_rephrased: number;
  error: string | null;
}
