export type DataType =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "text"
  | "uuid"
  | "json";

export const DATA_TYPES: DataType[] = [
  "string",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "text",
  "uuid",
  "json",
];

export interface Sensitivity {
  personal: boolean;
  business: boolean;
}

export interface Attribute {
  id: string;
  name: string;
  /** primitive data type, mutually exclusive with refEntityId */
  dataType: DataType | null;
  /** if set, this attribute is a relationship/reference to another entity */
  refEntityId: string | null;
  primaryKey?: boolean;
  foreignKey?: boolean;
  required?: boolean;
  multiple?: boolean;
  stateful?: boolean;
  sensitivity?: Sensitivity;
}

export type EntityStatus = "published" | "draft";
export type EntityKind = "termSet" | "valueList";

export interface EntityNode {
  id: string;
  name: string;
  kind: EntityKind;
  color: string;
  status: EntityStatus;
  version: string;
  x: number;
  y: number;
  collapsed: boolean;
  attributes: Attribute[];
  /** only meaningful when kind === "valueList" */
  values?: string[];
  description?: string;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  /** optional markdown-ish table rendered under the text */
  table?: { headers: string[]; rows: string[][] };
}

export type ViewMode = "canvas" | "table";
export type Theme = "light" | "dark";
export type LeftPanelMode = "file" | "assist" | null;

export interface Collaborator {
  id: string;
  initials: string;
  color: string;
}

export type SchemaStatus = "draft" | "published";

export interface SchemaFile {
  id: string;
  name: string;
  version: string;
  status: SchemaStatus;
  createdAt: string;
  updatedAt: string;
  entities: EntityNode[];
}
