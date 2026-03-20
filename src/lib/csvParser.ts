import Papa from 'papaparse';
import type { CostRecord, ParseResult, ParseError } from '../types';

const REQUIRED_COLUMNS = ['date', 'account', 'platform', 'category', 'amount'] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MON_YEAR_REGEX = /^([A-Za-z]{3})-(\d{2})$/;   // Jan-25
const YEAR_MON_REGEX = /^(\d{2})-([A-Za-z]{3})$/;   // 25-Jan

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  // 오타 보정
  aus: '08',
};

function normalizeDate(raw: string): string | null {
  if (DATE_REGEX.test(raw)) return raw;

  // Jan-25 형식
  const m1 = raw.match(MON_YEAR_REGEX);
  if (m1) {
    const month = MONTH_MAP[m1[1].toLowerCase()];
    const year = parseInt(m1[2]) >= 50 ? '19' + m1[2] : '20' + m1[2];
    if (month) return `${year}-${month}-01`;
  }

  // 25-Jan 형식
  const m2 = raw.match(YEAR_MON_REGEX);
  if (m2) {
    const month = MONTH_MAP[m2[2].toLowerCase()];
    const year = parseInt(m2[1]) >= 50 ? '19' + m2[1] : '20' + m2[1];
    if (month) return `${year}-${month}-01`;
  }

  return null;
}

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

    const rawDate = (row['date'] ?? '').trim();
    const date = normalizeDate(rawDate);
    if (!date) {
      errors.push({ row: i + 2, reason: 'invalid_date', raw: rawStr });
      continue;
    }

    const amountRaw = (row['amount'] ?? '').trim();
    // 쉼표 제거 후 숫자 변환 (예: "1,234,567" → 1234567)
    const amount = Number(amountRaw.replace(/,/g, ''));
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
      memo: (row['적요'] ?? '').trim(),
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
