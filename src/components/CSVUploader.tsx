import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { parseCSV } from '../lib/csvParser';
import { useDashboardStore } from '../store/dashboardStore';

export default function CSVUploader() {
  const { setRecords, setLoading } = useDashboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skipCount, setSkipCount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

      if (result.missingColumns && result.missingColumns.length > 0) {
        setErrorMessage(
          `필수 컬럼이 누락되었습니다: ${result.missingColumns.join(', ')}`
        );
        setLoading(false);
        return;
      }

      setRecords(result.records);
      setFileName(file.name);

      if (result.errorCount > 0) {
        setSkipCount(result.errorCount);
      }
    } finally {
      setLoading(false);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div className="w-full space-y-2">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="CSV 파일 업로드 영역"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
        ].join(' ')}
      >
        {/* Upload icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          CSV 파일을 드래그하거나{' '}
          <span className="text-blue-600 dark:text-blue-400 underline">
            클릭하여 선택
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          .csv 파일만 지원합니다
        </p>

        {fileName && (
          <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
            ✓ {fileName}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onChange}
          aria-hidden="true"
        />
      </div>

      {/* Missing columns / parse error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Skip count warning banner */}
      {skipCount > 0 && !errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{skipCount}건의 행을 건너뛰었습니다</span>
        </div>
      )}
    </div>
  );
}
