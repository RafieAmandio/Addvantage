import type {
  BulletinTimeframe,
  MarketStructure,
  BulletinStatus,
} from "@tradevantage/shared/schema";

export interface BulletinLevel {
  id: string;
  timeframe: BulletinTimeframe;
  marketStructure: MarketStructure;
  bosLevel: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bulletin {
  id: string;
  symbol: string;
  status: BulletinStatus;
  bias: MarketStructure;
  whatToWatch: string | null;
  entry: string | null;
  exit: string | null;
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  levels: BulletinLevel[];
}
