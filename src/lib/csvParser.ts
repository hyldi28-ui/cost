import Papa from 'papaparse';
import type { CostRecord, ParseResult, ParseError } from '../types';

const REQUIRED_COLUMNS = ['date', 'account', 'platform', 'category', 'amount'] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateColumns(headers: string[]): string[] {
  return REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
}

function processRows(
  rows: Record<string, string>[],
  headers: string[]
): { records: CostRecord[]; errors: ParseError[] } {
  const records: CostRecord[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawStr = headers.map((h) => row[h] ?? '').join(',');

    const date = (row['date'] ?? '').trim();
    if (!DATE_REGEX.test(date)) {
      errors.push({ row: i + 2, reason: 'invalid_date', raw: rawStr });
      continue;
    }

    const amountRaw = (row['amount'] ?? '').trim();
    const amount = Number(amountRaw);
    if (!isFinite(amount) || amountRaw === '') {
      errors.push({ row: i + 2, reason: 'invalid_amount', raw: rawStr });
      continue;
    }

    records.push({
      date,
      account: (row['account'] ?? '').trim(),
      platform: (row['platform'] ?? '').trim(),
      category: (row['category'] ?? '').trim(),
      amount,
    });
  }

  return { records, errors };
}

/** 문자열 CSV 파싱 (테스트·round-trip용) */
export function parseCSVString(csv: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const headers: string[] = result.meta.fields ?? [];
  const missingColumns = validateColumns(headers);

  if (missingColumns.length > 0) {
    return {
      records: [],
      errorCount: 0,
      errors: [],
      missingColumns,
    };
  }

  const { records, errors } = processRows(result.data, headers);

  return {
    records,
    errorCount: errors.length,
    errors,
  };
}

/** File 객체 CSV 파싱 — EUC-KR(CP949) 자동 감지 후 재시도 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const doParse = (text: string) => {
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      const headers: string[] = result.meta.fields ?? [];
      const missingColumns = validateColumns(headers);

      if (missingColumns.length > 0) {
        resolve({ records: [], errorCount: 0, errors: [], missingColumns });
        return;
      }

      const { records, errors } = processRows(result.data, headers);
      resolve({ records, errorCount: errors.length, errors });
    };

    // UTF-8로 먼저 읽고, 깨진 문자가 감지되면 EUC-KR로 재시도
    const utfReader = new FileReader();
    utfReader.onload = (e) => {
      const text = e.target?.result as string;
      const isGarbled = /\uFFFD/.test(text);
      if (isGarbled) {
        const euckrReader = new FileReader();
        euckrReader.onload = (e2) => doParse(e2.target?.result as string);
        euckrReader.readAsText(file, 'EUC-KR');
      } else {
        doParse(text);
      }
    };
    utfReader.readAsText(file, 'UTF-8');
  });
}

/** CostRecord[] → CSV 직렬화 */
export function serializeToCSV(records: CostRecord[]): string {
  return Papa.unparse(
    records.map((r) => ({
      date: r.date,
      account: r.account,
      platform: r.platform,
      category: r.category,
      amount: r.amount,
    }))
  );
}
