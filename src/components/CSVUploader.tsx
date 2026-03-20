import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { parseCSV, parseCSVString } from '../lib/csvParser';
import { useDashboardStore } from '../store/dashboardStore';

/** 구글 시트 공유 URL → CSV export URL로 변환 */
function toCSVExportUrl(input: string): string | null {
  // 이미 export URL인 경우
  if (input.includes('/export?')) return input;

  // 일반 시트 URL: /spreadsheets/d/{ID}/edit 또는 /spreadsheets/d/{ID}
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;

  const sheetId = match[1];
  // gid 파라미터 추출 (없으면 기본 시트 0)
  const gidMatch = input.match(/[?&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export default function CSVUploader() {
  const { setRecords, setLoading } = useDashboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skipCount, setSkipCount] = useState<number>(0);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleResult(records: ReturnType<typeof parseCSVString>['records'], errorCount: number, missingColumns?: string[], name?: string) {
    if (missingColumns && missingColumns.length > 0) {
      setErrorMessage(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
      return;
    }
    setRecords(records);
    setSourceName(name ?? null);
    setSkipCount(errorCount);
    setErrorMessage(null);
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('CSV 파일만 업로드할 수 있습니다.');
      return;
    }
    setErrorMessage(null);
    setSkipCount(0);
    setLoading(true);
    try {
      const result = await parseCSV(file);
      handleResult(result.records, result.errorCount, result.missingColumns, file.name);
    } finally {
      setLoading(false);
    }
  }

  async function handleSheetLoad() {
    const exportUrl = toCSVExportUrl(sheetUrl.trim());
    if (!exportUrl) {
      setErrorMessage('올바른 구글 스프레드시트 URL을 입력해주세요.');
      return;
    }
    setErrorMessage(null);
    setSkipCount(0);
    setIsFetching(true);
    setLoading(true);
    try {
      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const { parseCSVString } = await import('../lib/csvParser');
      const result = parseCSVString(text);
      handleResult(result.records, result.errorCount, result.missingColumns, '구글 스프레드시트');
    } catch (e) {
      setErrorMessage(`데이터를 불러오지 못했습니다. 시트가 "웹에 게시"되어 있는지 확인해주세요. (${e instanceof Error ? e.message : e})`);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(false); }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div className="w-full space-y-3">
      {/* Google Sheets URL 입력 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
          <span>📊</span> 구글 스프레드시트 연동
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          시트를 <strong>파일 → 공유 → 웹에 게시 → CSV</strong>로 게시한 후 URL을 붙여넣으세요.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400"
          />
          <button
            onClick={handleSheetLoad}
            disabled={isFetching || !sheetUrl.trim()}
            className="px-3 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
          >
            {isFetching ? '불러오는 중...' : '불러오기'}
          </button>
        </div>
      </div>

      {/* CSV 파일 업로드 드롭존 */}
      <div
        role="button" tabIndex={0} aria-label="CSV 파일 업로드 영역"
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
        ].join(' ')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          CSV 파일을 드래그하거나{' '}
          <span className="text-blue-600 dark:text-blue-400 underline">클릭하여 선택</span>
        </p>
        {sourceName && (
          <p className="text-xs font-medium text-green-600 dark:text-green-400">✓ {sourceName}</p>
        )}
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onChange} aria-hidden="true" />
      </div>

      {/* 에러 배너 */}
      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <span>⚠️</span><span>{errorMessage}</span>
        </div>
      )}

      {/* 스킵 경고 */}
      {skipCount > 0 && !errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
          <span>⚠️</span><span>{skipCount}건의 행을 건너뛰었습니다</span>
        </div>
      )}
    </div>
  );
}
