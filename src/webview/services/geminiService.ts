declare const webviewApi: { postMessage: (message: any) => Promise<any> };

export const suggestTags = async (noteContent: string, _apiKey: string): Promise<string[]> => {
  if (!noteContent.trim()) return [];

  const res = await webviewApi.postMessage({ name: 'suggestTags', noteContent });
  if (res?.error) throw new Error(res.error);
  return Array.isArray(res?.tags) ? res.tags : [];
};
