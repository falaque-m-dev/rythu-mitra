export type AiMode = "live" | "degraded";

export interface Diagnosis {
  crop: string;
  crop_te?: string;
  disease: string;
  disease_te?: string;
  severity: string;
  severity_te?: string;
  symptoms: string;
  symptoms_te?: string;
  organic_cure: string;
  organic_te?: string;
  chemical_cure: string;
  chemical_te?: string;
  prevention: string;
  prevention_te?: string;
}

export interface DiagnoseResult {
  success: boolean;
  diagnosis: Diagnosis;
  mode: AiMode;
}

export interface ChatResult {
  success: boolean;
  reply: string;
  mode: AiMode;
}

export interface WeatherForecastDay {
  date: string;
  code: number;
  max: number;
  min: number;
  rain_prob: number;
  wind_speed: number;
  sunrise?: string | null;
  sunset?: string | null;
}

export interface WeatherResult {
  city: string;
  temp: number;
  apparent_temp: number;
  humidity: number;
  rain_prob: number;
  wind_speed: number;
  condition_code?: number;
  is_day?: boolean;
  forecast?: WeatherForecastDay[];
  advisory: string;
  advisory_te?: string;
}

export interface MandiCommodity {
  id: string;
  name_en: string;
  name_te: string;
  variety: string;
  market_en: string;
  market_te: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  change: string;
  trend: "up" | "down";
}

export interface MandiResult {
  updated_at: string;
  commodities: MandiCommodity[];
  mode?: "live" | "curated";
  source?: string;
  live?: boolean;
  notice?: string;
}
