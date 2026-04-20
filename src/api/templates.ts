import { api } from './client';
import type { TemplateListItem, TemplateResponse } from '@/types/api';

export async function listTemplates(): Promise<TemplateListItem[]> {
  const { data } = await api.get<TemplateListItem[]>('/api/templates');
  return data;
}

export async function getTemplate(id: string): Promise<TemplateResponse> {
  const { data } = await api.get<TemplateResponse>(`/api/templates/${id}`);
  return data;
}

export async function createTemplate(name: string, xml: string): Promise<TemplateResponse> {
  const { data } = await api.post<TemplateResponse>('/api/templates', { name, xml });
  return data;
}

export async function updateTemplate(
  id: string,
  payload: { name?: string; xml?: string },
): Promise<TemplateResponse> {
  const { data } = await api.put<TemplateResponse>(`/api/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/api/templates/${id}`);
}
