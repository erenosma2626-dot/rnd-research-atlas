import { useEffect, useRef, useState } from 'react';
import { getDocumentStatus } from '../api/client';

export type PollingStatus =
  | 'pending'
  | 'processing'
  | 'parsing'
  | 'extracting_formulas'
  | 'classifying'
  | 'indexing'
  | 'awaiting_plan_approval'
  | 'generating_report'
  | 'done'
  | 'failed'
  | 'idle';

export interface UsePollDocumentStatusResult {
  status: PollingStatus;
  errorMessage: string | null;
  loading: boolean;
  filename: string;
  refetch: () => void;
}

export function usePollDocumentStatus(
  documentId: string | null | undefined,
  intervalMs: number = 2500
): UsePollDocumentStatusResult {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');
  const timerRef = useRef<number | null>(null);

  const checkStatus = async () => {
    if (!documentId) return;

    try {
      const data = await getDocumentStatus(documentId);
      setStatus(data.processing_status as PollingStatus);
      setFilename(data.original_filename || '');

      if (data.processing_status === 'failed') {
        setErrorMessage(data.error_message || 'Doküman işlenirken beklenmeyen bir hata oluştu.');
        setLoading(false);
      } else if (data.processing_status === 'done') {
        setLoading(false);
      } else {
        setLoading(true);
        // Devam eden durumlar (pending, processing) için tekrar tetikle
        timerRef.current = window.setTimeout(checkStatus, intervalMs);
      }
    } catch (err: any) {
      // Geçici ağ hatalarında hemen vazgeçmeyip tekrar dene
      timerRef.current = window.setTimeout(checkStatus, intervalMs + 1000);
    }
  };

  useEffect(() => {
    if (!documentId) {
      setStatus('idle');
      return;
    }

    setLoading(true);
    setStatus('pending');
    setErrorMessage(null);

    checkStatus();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [documentId, intervalMs]);

  const refetch = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    setLoading(true);
    checkStatus();
  };

  return {
    status,
    errorMessage,
    loading,
    filename,
    refetch,
  };
}
