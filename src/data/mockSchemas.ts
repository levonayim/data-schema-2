import type { EntityNode } from "../types";
import type { SchemaFile } from "../types";

const nid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Lightweight placeholder schemas for the dashboard's workspace list — real
// content lives only in "Originations Term Sets" (see seed.ts); these are
// empty shells so opening them exercises the "start building" empty state.
export const MOCK_SCHEMAS: Omit<SchemaFile, "entities">[] = [
  { id: nid("sch"), name: "fin ledger core", version: "1.0.2", status: "draft", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "bank accounts retail", version: "1.0.2", status: "published", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "compliance kyc profiles", version: "7.2.2", status: "draft", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "aml transaction monitoring", version: "12.0.1", status: "published", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "credit risk scoring models", version: "12.0.1", status: "published", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "ops payment routing rules", version: "12.0.1", status: "published", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
  { id: nid("sch"), name: "sys rbac permissions", version: "5.40.2", status: "published", createdAt: ago(30 * DAY), updatedAt: ago(12 * MIN) },
];

export interface Template {
  id: string;
  name: string;
  description: string;
}

export const TEMPLATES: Template[] = [
  { id: "credit-loan", name: "Credit & Loan Origination", description: "Tracks the lifecycle of debt from application to funding." },
  { id: "collateral-asset", name: "Collateral & Asset Management", description: "Manages the physical security behind a loan." },
  { id: "core-banking", name: "Core Banking & Ledger", description: 'Maps the "source of truth" for money.' },
  { id: "payment-routing", name: "Payment & Routing", description: 'Visualizes the "plumbing" of money movement.' },
  { id: "audit-compliance", name: "Audit Trail & Compliance", description: 'Creates an immutable "paper trail" for every action.' },
  { id: "kyc-identity", name: "KYC & Identity Management", description: 'Focuses on regulatory "personhood" — links legal identities.' },
];

export const AI_SCHEMA_SUGGESTIONS = ["Loan originations", "Mortgage loans", "Risk assessments", "Compliance"];

const TEMPLATE_STARTER: Record<string, { name: string; color: string; fields: [string, string][] }> = {
  "credit-loan": { name: "loanApplication", color: "blue", fields: [["borrowerId", "string"], ["amount", "decimal"], ["status", "string"]] },
  "collateral-asset": { name: "collateralAsset", color: "orange", fields: [["assetId", "string"], ["value", "decimal"]] },
  "core-banking": { name: "ledgerEntry", color: "green", fields: [["entryId", "string"], ["amount", "decimal"], ["postedAt", "datetime"]] },
  "payment-routing": { name: "payment", color: "cyan", fields: [["paymentId", "string"], ["status", "string"]] },
  "audit-compliance": { name: "auditEvent", color: "purple", fields: [["eventId", "string"], ["occurredAt", "datetime"]] },
  "kyc-identity": { name: "identity", color: "pink", fields: [["identityId", "string"], ["verifiedAt", "datetime"]] },
};

export function templateStarterEntities(templateId: string): EntityNode[] {
  const t = TEMPLATE_STARTER[templateId];
  if (!t) return [];
  return [
    {
      id: nid("ent"),
      name: t.name,
      kind: "termSet",
      color: t.color,
      status: "draft",
      version: "v1.0.0",
      x: 0,
      y: 0,
      collapsed: false,
      attributes: t.fields.map(([name, dataType]) => ({ id: nid("attr"), name, dataType: dataType as EntityNode["attributes"][number]["dataType"], refEntityId: null })),
    },
  ];
}
