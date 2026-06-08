import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const candidateColumns = ["message", "text", "content", "headline", "body", "article"];

export function parseCsv(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

export function detectTextColumn(records, providedColumn = "") {
  if (!records.length) {
    return "";
  }

  const columns = Object.keys(records[0]);
  const exact = columns.find((column) => column === providedColumn);
  if (exact) {
    return exact;
  }

  const providedLower = providedColumn.toLowerCase();
  const caseMatch = columns.find((column) => column.toLowerCase() === providedLower);
  if (caseMatch) {
    return caseMatch;
  }

  const common = candidateColumns
    .map((candidate) => columns.find((column) => column.toLowerCase() === candidate))
    .find(Boolean);
  if (common) {
    return common;
  }

  return (
    columns.find((column) =>
      records.some((record) => typeof record[column] === "string" && record[column].trim().length > 0)
    ) || ""
  );
}

export function toCsv(records) {
  return stringify(records, {
    header: true
  });
}

export function previewRows(records, limit = 8) {
  return records.slice(0, limit).map((record) => {
    const preview = {};
    for (const [key, value] of Object.entries(record)) {
      const text = value == null ? "" : String(value);
      preview[key] = text.length > 180 ? `${text.slice(0, 177)}...` : text;
    }
    return preview;
  });
}
