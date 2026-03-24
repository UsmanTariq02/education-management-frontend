export function buildQueryParams<T extends object>(params?: T) {
  const searchParams = new URLSearchParams();

  if (!params) {
    return searchParams;
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams;
}
