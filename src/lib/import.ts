import { DATA_TYPES, type Attribute, type DataType } from "../types";

export interface ImportRow {
  name: string;
  dataType: DataType | null;
  required: boolean;
  multiple: boolean;
}

export interface ImportIssue {
  name: string;
  status: string;
  existing?: { dataType: DataType | null; required: boolean; multiple: boolean };
  incoming?: ImportRow;
}

export interface ImportPreview {
  targetEntityId: string | null;
  fileName: string;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  ready: ImportRow[];
}

function parseCsvLine(line: string): string[] {
  // minimal CSV split: handles simple quoted fields, good enough for a name/type/required/multiple sheet
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const truthy = (v: string | undefined) => !!v && ["true", "yes", "y", "1"].includes(v.trim().toLowerCase());

export function parseCsvForImport(text: string, existingAttributes: Attribute[]): ImportPreview {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const ready: ImportRow[] = [];

  if (lines.length === 0) {
    return { targetEntityId: null, fileName: "", errors: [], warnings: [], ready: [] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf("name");
  const typeIdx = header.indexOf("type") >= 0 ? header.indexOf("type") : header.indexOf("data type");
  const requiredIdx = header.indexOf("required");
  const multipleIdx = header.indexOf("multiple");

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
    const rawType = (typeIdx >= 0 ? cols[typeIdx] : cols[1] ?? "").toLowerCase();

    if (!name) continue;

    if (!rawType || !DATA_TYPES.includes(rawType as DataType)) {
      errors.push({ name, status: rawType ? "Unsupported type" : "Syntax error" });
      continue;
    }

    const incoming: ImportRow = {
      name,
      dataType: rawType as DataType,
      required: requiredIdx >= 0 ? truthy(cols[requiredIdx]) : false,
      multiple: multipleIdx >= 0 ? truthy(cols[multipleIdx]) : false,
    };

    const existingAttr = existingAttributes.find((a) => a.name.toLowerCase() === name.toLowerCase());
    if (existingAttr) {
      const existing = {
        dataType: existingAttr.dataType,
        required: !!existingAttr.required,
        multiple: !!existingAttr.multiple,
      };
      const identical =
        existing.dataType === incoming.dataType &&
        existing.required === incoming.required &&
        existing.multiple === incoming.multiple;
      if (identical) {
        ready.push(incoming);
      } else {
        warnings.push({ name, status: "Review Conflict", existing, incoming });
      }
    } else {
      ready.push(incoming);
    }
  }

  return { targetEntityId: null, fileName: "", errors, warnings, ready };
}
