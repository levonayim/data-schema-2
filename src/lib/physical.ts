import type { Attribute, PhysicalMapping } from "../types";

/** how long a physical mapping stays trusted before it's flagged as possibly drifted */
export const STALE_AFTER_DAYS = 90;

export type VerificationStatus = "unmapped" | "unverified" | "stale" | "verified";

export function hasMapping(m: PhysicalMapping | undefined): boolean {
  return !!m && !!(m.system.trim() || m.table.trim() || m.column.trim());
}

export function verificationStatus(m: PhysicalMapping | undefined): VerificationStatus {
  if (!hasMapping(m)) return "unmapped";
  if (!m!.lastVerifiedAt) return "unverified";
  const ageDays = (Date.now() - m!.lastVerifiedAt) / (1000 * 60 * 60 * 24);
  return ageDays > STALE_AFTER_DAYS ? "stale" : "verified";
}

/** true if this term's source is stale/unverified, or a consumer has flagged it — i.e. it deserves attention */
export function needsAttention(attr: Pick<Attribute, "physicalMapping" | "sourceReviewRequestedAt">): boolean {
  const status = verificationStatus(attr.physicalMapping);
  return status === "stale" || status === "unverified" || !!attr.sourceReviewRequestedAt;
}

export const STATUS_STYLE: Record<VerificationStatus, { dot: string; text: string; label: string }> = {
  unmapped: { dot: "var(--border-strong)", text: "var(--text-tertiary)", label: "Not linked to a source" },
  unverified: { dot: "#f0a83a", text: "#c8811a", label: "Never verified" },
  stale: { dot: "#e0475a", text: "#c23a4b", label: "Stale — re-verify" },
  verified: { dot: "#2f9e5c", text: "#1f7a45", label: "Verified" },
};

export function formatRelativeDays(ts: number): string {
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
