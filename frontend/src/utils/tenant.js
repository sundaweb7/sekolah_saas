export function getTenantHeader(schoolSlug) {
  if (schoolSlug) return schoolSlug;
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();
  const first = hostname.split('.')[0];
  const mainHosts = new Set([
    'localhost', '127', 'paudku', 'koola', 'www', 'pusdatin',
  ]);

  return mainHosts.has(first) ? null : first;
}

export function tenantHeaders(schoolSlug) {
  const tenant = getTenantHeader(schoolSlug);
  return tenant ? { 'X-School-ID': tenant } : {};
}
