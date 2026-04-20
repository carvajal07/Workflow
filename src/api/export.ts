import { api } from './client';
import type { ExportRequest } from '@/types/api';

/**
 * POST /api/export
 * El backend (proyectoPDF) genera el PDF con ReportLab y devuelve application/pdf.
 */
export async function exportPdf(req: ExportRequest): Promise<Blob> {
  const { data } = await api.post<Blob>('/api/export', req, { responseType: 'blob' });
  return data;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
