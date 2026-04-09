/**
 * cveSearch — queries the NIST NVD API v2 for CVE records.
 * Free, no key required for basic usage (rate limit: 5 req/30s without key).
 * params: { keyword, cveId, limit = 10 }
 * Returns { data: [...cves] }
 */
export const cveSearch = async ({ keyword, cveId, limit = 10 } = {}) => {
  const params = new URLSearchParams({ resultsPerPage: limit, startIndex: 0 });
  if (cveId)   params.set('cveId', cveId.toUpperCase());
  if (keyword) params.set('keywordSearch', keyword);

  const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`);
  if (!res.ok) throw new Error(`NVD CVE search failed: ${res.status}`);
  const json = await res.json();

  const cves = (json.vulnerabilities || []).map(({ cve }) => {
    const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
    const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData
               ?? cve.metrics?.cvssMetricV30?.[0]?.cvssData
               ?? cve.metrics?.cvssMetricV2?.[0]?.cvssData;
    return {
      id: cve.id,
      description: desc,
      severity: cvss?.baseSeverity?.toLowerCase() || 'unknown',
      score: cvss?.baseScore ?? null,
      published: cve.published,
      url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    };
  });

  return { data: cves, total: json.totalResults };
};
