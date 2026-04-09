/**
 * fetchCisaKev — fetches the CISA Known Exploited Vulnerabilities catalogue.
 * Public API, no key required. Returns { data: [...vulnerabilities] }
 */
export const fetchCisaKev = async () => {
  const res = await fetch(
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
  );
  if (!res.ok) throw new Error(`CISA KEV fetch failed: ${res.status}`);
  const json = await res.json();

  const vulns = (json.vulnerabilities || []).slice(0, 50).map(v => ({
    title: `${v.cveID}: ${v.vulnerabilityName}`,
    severity: v.knownRansomwareCampaignUse === 'Known' ? 'critical' : 'high',
    dateAdded: v.dateAdded,
    url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
    vendor: v.vendorProject,
    product: v.product,
    description: v.shortDescription,
  }));

  return { data: vulns };
};
