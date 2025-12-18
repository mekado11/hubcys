import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check
    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('NVD_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'NVD API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine if this is a CVE ID or keyword search
    const isCveId = /^CVE-\d{4}-\d{4,}$/i.test(query.trim());
    
    let url;
    if (isCveId) {
      // Direct CVE ID lookup
      url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(query.trim())}`;
    } else {
      // Keyword search
      url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query.trim())}&resultsPerPage=20`;
    }

    const headers = {
      'apiKey': apiKey,
      'User-Agent': 'FortiGap-Security-Platform/1.0'
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ 
        error: 'NVD API error', 
        status: response.status,
        details: errorText 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Transform the NVD response to a more usable format
    const transformedData = {
      totalResults: data.totalResults || 0,
      resultsPerPage: data.resultsPerPage || 0,
      startIndex: data.startIndex || 0,
      vulnerabilities: (data.vulnerabilities || []).map(vuln => {
        const cve = vuln.cve || {};
        
        // Extract English description
        const description = cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description available.';

        // Extract CVSS data (prefer v3.1, then v3.0, then v2.0)
        let cvssData = null;
        if (cve.metrics?.cvssMetricV31?.[0]) {
          cvssData = cve.metrics.cvssMetricV31[0].cvssData;
        } else if (cve.metrics?.cvssMetricV30?.[0]) {
          cvssData = cve.metrics.cvssMetricV30[0].cvssData;
        } else if (cve.metrics?.cvssMetricV2?.[0]) {
          cvssData = cve.metrics.cvssMetricV2[0].cvssData;
        }

        // Determine severity based on CVSS score or explicit severity
        let severity = 'Unknown';
        if (cvssData?.baseSeverity) {
          severity = cvssData.baseSeverity; // Use baseSeverity from CVSS v3.x
        } else if (cvssData?.baseScore) {
          // Map CVSS v2 score to severity
          if (cvssData.baseScore >= 7.0) {
            severity = 'High';
          } else if (cvssData.baseScore >= 4.0) {
            severity = 'Medium';
          } else {
            severity = 'Low';
          }
        }
        
        // Ensure references are just URLs
        const references = cve.references?.map(ref => ref.url).filter(Boolean) || [];

        return {
          id: cve.id,
          description: description, // Extracted as string
          published_date: cve.published,
          last_modified_date: cve.lastModified,
          cvss_score: cvssData?.baseScore || null, // Direct baseScore
          severity: severity.toLowerCase(), // Normalize to lowercase for consistency
          references: references,
          sourceIdentifier: cve.sourceIdentifier,
          vulnStatus: cve.vulnStatus,
          weaknesses: cve.weaknesses || []
        };
      })
    };

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('CVE search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});