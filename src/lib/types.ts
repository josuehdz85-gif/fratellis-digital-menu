export const LANGS = ["en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export type I18n = Partial<Record<Lang, string>>;

/** source = the language the owner wrote in; auto = machine translated;
 *  edited = corrected by hand (locked); review = source changed after a hand edit. */
export type TrStatus = "source" | "auto" | "edited" | "review";
export interface TrMeta {
  source: Lang;
  status: Partial<Record<Lang, TrStatus>>;
}

export type Role = "owner" | "manager" | "staff";

export interface HoursRule {
  days: number[]; // 0 = Sunday
  open: string; // "10:30"
  close: string; // "22:00"
}

export interface Restaurant {
  id: number;
  name: string;
  tagline: I18n;
  logo_url: string | null;
  brand_primary: string;
  brand_accent: string;
  base_currency: string;
  default_language: Lang;
  enabled_languages: Lang[];
  enabled_currencies: string[];
  timezone: string;
  hours: HoursRule[];
  address: string;
  map_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  social: Record<string, string>;
  rate_max_age_hours: number;
  allergen_standard: "us9" | "eu14";
  glossary: string[];
  tr: TrMeta;
  updated_at?: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: I18n;
  subtitle: I18n;
  link_type: "none" | "category" | "item" | "url";
  link_ref: string;
  sort: number;
  active: boolean;
  starts_on: string | null;
  ends_on: string | null;
  tr: TrMeta;
}

export interface Category {
  id: string;
  slug: string;
  name: I18n;
  description: I18n;
  image_url: string | null;
  sort: number;
  visible: boolean;
  hours_from: string | null;
  hours_to: string | null;
  tr: TrMeta;
}

export interface SizeOption {
  id: string;
  label: I18n;
  price: number;
}
export interface ModifierOption {
  id: string;
  name: I18n;
  price: number;
}
export interface ModifierGroup {
  id: string;
  name: I18n;
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
}
export interface Addon {
  id: string;
  name: I18n;
  price: number;
}

export interface Item {
  id: string;
  slug: string;
  category_id: string;
  name: I18n;
  description: I18n;
  price: number;
  sizes: SizeOption[];
  photos: string[];
  allergens: string[];
  /** true once the owner has reviewed allergens (even if the list is empty) */
  allergens_set: boolean;
  tags: string[];
  modifiers: ModifierGroup[];
  addons: Addon[];
  sort: number;
  visible: boolean;
  sold_out: boolean;
  featured: boolean;
  tr: TrMeta;
  updated_at?: string;
}

export interface Special {
  id: string;
  item_id: string;
  days: number[];
  starts_on: string | null;
  ends_on: string | null;
  special_price: number | null;
  note: I18n;
  active: boolean;
  tr: TrMeta;
}

export interface Rate {
  currency: string;
  rate: number | null;
  manual_rate: number | null;
  updated_at: string | null;
}

export interface TableQR {
  id: string;
  label: string;
  code: string;
  scans: number;
  created_at?: string;
}

export type EventType = "view_home" | "view_category" | "view_item" | "scan" | "search";
export interface MenuEvent {
  id?: string;
  type: EventType;
  ref: string | null;
  lang: string | null;
  currency: string | null;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  role: Role;
}

export interface TableMap {
  restaurant: Restaurant;
  banners: Banner;
  categories: Category;
  items: Item;
  specials: Special;
  rates: Rate;
  tables: TableQR;
  events: MenuEvent;
  profiles: Profile;
}
export type TableName = keyof TableMap;
