/**
 * fetchNcscKev — fetches UK NCSC cyber security advisories via RSS.
 * Uses a public CORS proxy since the NCSC feed doesn't send CORS headers.
 * Returns { data: [...advisories] }
 */
export const fetchNcscKev = async () => {
  // rss2json is a free public service — no key needed for low-volume usage
  const feedUrl = encodeURIComponent('https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml');
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=20`);
  if (!res.ok) throw new Error(`NCSC feed fetch failed: ${res.status}`);
  const json = await res.json();

  if (json.status !== 'ok') throw new Error('NCSC RSS parse error');

  const advisories = (json.items || []).map(item => ({
    title: item.title,
    severity: /critical/i.test(item.title) ? 'critical' : /high/i.test(item.title) ? 'high' : 'medium',
    dateAdded: item.pubDate,
    url: item.link,
    description: item.description?.replace(/<[^>]+>/g, '').slice(0, 200),
  }));

  return { data: advisories };
};
