import { api } from './client';
import type { ImageUploadResponse } from '@/types/api';

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ImageUploadResponse>('/api/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
