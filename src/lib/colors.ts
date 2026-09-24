export interface ColorToken {
  id: string;
  stripe: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  dot: string;
  line: string;
}

// Palette cycled across entities, matching the mockup's per-entity accent colors.
export const PALETTE: ColorToken[] = [
  {
    id: "blue",
    stripe: "#4f7cff",
    text: "#3b62e0",
    badgeBg: "rgba(79,124,255,0.14)",
    badgeText: "#3b62e0",
    dot: "#4f7cff",
    line: "#4f7cff",
  },
  {
    id: "green",
    stripe: "#2fd48f",
    text: "#0f9d63",
    badgeBg: "rgba(47,212,143,0.16)",
    badgeText: "#0f9d63",
    dot: "#2fd48f",
    line: "#2fd48f",
  },
  {
    id: "yellow",
    stripe: "#d7dc3a",
    text: "#8d9111",
    badgeBg: "rgba(215,220,58,0.22)",
    badgeText: "#8d9111",
    dot: "#c8cd2e",
    line: "#c8cd2e",
  },
  {
    id: "pink",
    stripe: "#f36ba7",
    text: "#d43e82",
    badgeBg: "rgba(243,107,167,0.16)",
    badgeText: "#d43e82",
    dot: "#f36ba7",
    line: "#f36ba7",
  },
  {
    id: "purple",
    stripe: "#a06bf0",
    text: "#7c3fd8",
    badgeBg: "rgba(160,107,240,0.16)",
    badgeText: "#7c3fd8",
    dot: "#a06bf0",
    line: "#a06bf0",
  },
  {
    id: "orange",
    stripe: "#f4924b",
    text: "#d2691e",
    badgeBg: "rgba(244,146,75,0.18)",
    badgeText: "#c46a1f",
    dot: "#f4924b",
    line: "#f4924b",
  },
  {
    id: "cyan",
    stripe: "#3fc4e0",
    text: "#0f8fac",
    badgeBg: "rgba(63,196,224,0.16)",
    badgeText: "#0f8fac",
    dot: "#3fc4e0",
    line: "#3fc4e0",
  },
];

export function colorForIndex(i: number): ColorToken {
  return PALETTE[i % PALETTE.length];
}

export function colorById(id: string): ColorToken {
  return PALETTE.find((p) => p.id === id) ?? PALETTE[0];
}
