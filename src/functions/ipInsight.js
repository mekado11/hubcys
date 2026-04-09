/**
 * ipInsight — IP geolocation and threat intelligence.
 *
 * Uses the free ipapi.co API (no API key required) for geolocation,
 * then enriches with threat classification heuristics.
 *
 * @param {object} params
 * @param {string} params.ip  IPv4 or IPv6 address to look up
 * @returns {{ data: object }}  Geo, ISP, org type, threat risk, infra flags
 */

const IPAPI_TIMEOUT_MS = 10_000;

function classifyOrgTypes(orgName = '', ispName = '') {
  const combined = (orgName + ' ' + ispName).toLowerCase();
  return {
    is_gov:      /\b(gov(ernment)?|ministry|federal|state\b|agency|department)\b/.test(combined),
    is_edu:      /\b(university|college|edu(cation)?|school|academic|polytechnic)\b/.test(combined),
    is_business: /\b(inc\.?|ltd\.?|llc|corp\.?|gmbh|s\.?a\.?|plc|limited|holdings)\b/.test(combined),
    is_consumer: /\b(telecom|broadband|internet|residential|mobile|wireless)\b/.test(combined),
  };
}

function classifyInfraFlags(orgName = '', ispName = '') {
  const combined = (orgName + ' ' + ispName).toLowerCase();
  return {
    is_hosting: /\b(cloud|hosting|server|datacenter|data center|vps|vds|aws|azure|gcp|linode|digitalocean|vultr|ovh|hetzner)\b/.test(combined),
    is_proxy:   /\b(vpn|proxy|tor|anonymi|privacy|tunnel)\b/.test(combined),
    is_crawler: /\b(crawl|spider|bot|search engine|index)\b/.test(combined),
  };
}

function calcThreatRisk(infraFlags, asnType) {
  let score = 1;
  if (infraFlags.is_hosting) score += 3;
  if (infraFlags.is_proxy)   score += 4;
  if (infraFlags.is_crawler) score += 2;
  if (asnType === 'hosting') score += 2;
  return Math.min(10, score);
}

export const ipInsight = async ({ ip }) => {
  if (!ip) throw new Error('ipInsight: ip is required');

  // Basic IP validation (IPv4 + IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  const trimmed = ip.trim();
  if (!ipv4Regex.test(trimmed) && !ipv6Regex.test(trimmed)) {
    throw new Error('Invalid IP address format');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPAPI_TIMEOUT_MS);

  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(trimmed)}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`ipapi.co returned ${res.status}`);

    const raw = await res.json();

    if (raw.error) throw new Error(raw.reason || 'IP lookup failed');

    const org = raw.org || '';
    const isp = raw.org || raw.asn || '';

    const infraFlags = classifyInfraFlags(org, isp);
    const orgTypes   = classifyOrgTypes(org, isp);
    const threatRisk = calcThreatRisk(infraFlags, raw.asn_type);

    const data = {
      ip: raw.ip,
      geo: {
        city_name:    raw.city       || null,
        country_name: raw.country_name || null,
        region:       raw.region     || null,
        latitude:     raw.latitude   || null,
        longitude:    raw.longitude  || null,
        time_zone:    raw.timezone   || null,
        postal_code:  raw.postal     || null,
      },
      isp_name:   raw.org || null,
      asn:        raw.asn || null,
      org_types:  orgTypes,
      threat_risk: threatRisk,
      infra_flags: infraFlags,
      is_bogon:   raw.bogon || false,
    };

    return { data };
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`IP lookup failed: ${err.message}`);
  }
};
