
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

    // Parse request body
    const body = await req.json();
    const { exposed_assets, target_domain } = body;

    // Validate parameters
    if (!exposed_assets || !Array.isArray(exposed_assets) || exposed_assets.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid exposed_assets parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!target_domain || typeof target_domain !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid target_domain parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract technologies from exposed assets
    const technologies = new Set();
    exposed_assets.forEach(asset => {
      if (asset.technologies && Array.isArray(asset.technologies)) {
        asset.technologies.forEach(tech => {
          if (tech && typeof tech === 'string') {
            technologies.add(tech.toLowerCase());
          }
        });
      }
    });

    const techArray = Array.from(technologies);
    
    // If no technologies found, return empty result
    if (techArray.length === 0) {
      return new Response(JSON.stringify({
        target_domain,
        technologies_analyzed: [],
        correlatedCVEs: [],
        summary: {
          total_cves_found: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0
        },
        scan_timestamp: new Date().toISOString(),
        data_source: 'none'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const NVD_API_KEY = Deno.env.get('NVD_API_KEY');
    let correlatedCVEs = [];
    let dataSource = 'simulated';

    // Try NVD API if available
    if (NVD_API_KEY) {
      try {
        for (const tech of techArray) {
          // Query NVD for vulnerabilities related to this technology
          const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(tech)}&resultsPerPage=20`;
          
          const nvdResponse = await fetch(nvdUrl, {
            headers: {
              'apiKey': NVD_API_KEY,
              'User-Agent': 'FortiGAP-CVE-Correlator/1.0'
            }
          });

          if (nvdResponse.ok) {
            const nvdData = await nvdResponse.json();
            dataSource = 'nvd';

            if (nvdData.vulnerabilities && nvdData.vulnerabilities.length > 0) {
              nvdData.vulnerabilities.forEach(vulnItem => {
                const cve = vulnItem.cve;
                
                // Extract CVSS score and severity
                let cvssScore = null;
                let severity = 'unknown';
                
                if (cve.metrics?.cvssMetricV31?.[0]) {
                  cvssScore = cve.metrics.cvssMetricV31[0].cvssData.baseScore;
                  severity = cve.metrics.cvssMetricV31[0].cvssData.baseSeverity?.toLowerCase() || 'unknown';
                } else if (cve.metrics?.cvssMetricV30?.[0]) {
                  cvssScore = cve.metrics.cvssMetricV30[0].cvssData.baseScore;
                  severity = cve.metrics.cvssMetricV30[0].cvssData.baseSeverity?.toLowerCase() || 'unknown';
                } else if (cve.metrics?.cvssMetricV2?.[0]) {
                  cvssScore = cve.metrics.cvssMetricV2[0].cvssData.baseScore;
                  // Convert V2 score to severity
                  if (cvssScore >= 9.0) severity = 'critical';
                  else if (cvssScore >= 7.0) severity = 'high';
                  else if (cvssScore >= 4.0) severity = 'medium';
                  else severity = 'low';
                }

                correlatedCVEs.push({
                  cve_id: cve.id,
                  description: cve.descriptions?.[0]?.value || 'No description available',
                  cvss_score: cvssScore,
                  severity: severity,
                  published_date: cve.published,
                  last_modified: cve.lastModified,
                  affected_technology: tech,
                  remediation: 'Apply security patches and updates as recommended by vendor',
                  references: cve.references?.map(ref => ref.url).slice(0, 3) || []
                });
              });
            }
          }
          
          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (nvdError) {
        console.log('NVD API failed, using simulation:', nvdError.message);
        dataSource = 'simulated';
      }
    }

    // If NVD API is not available or no results, do NOT simulate/fallback with mock data.
    if (!NVD_API_KEY || correlatedCVEs.length === 0) {
      dataSource = NVD_API_KEY ? 'nvd' : 'none';
    }

    // Sort by CVSS score (highest first)
    correlatedCVEs.sort((a, b) => (b.cvss_score || 0) - (a.cvss_score || 0));

    // Generate summary statistics
    const summary = {
      total_cves_found: correlatedCVEs.length,
      critical_count: correlatedCVEs.filter(cve => cve.severity === 'critical').length,
      high_count: correlatedCVEs.filter(cve => cve.severity === 'high').length,
      medium_count: correlatedCVEs.filter(cve => cve.severity === 'medium').length,
      low_count: correlatedCVEs.filter(cve => cve.severity === 'low').length
    };

    const result = {
      target_domain,
      technologies_analyzed: techArray,
      correlatedCVEs,
      summary,
      scan_timestamp: new Date().toISOString(),
      data_source: dataSource
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('CVE correlation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during CVE correlation',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
