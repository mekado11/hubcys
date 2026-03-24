
import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

// Helper function to map vulnerability severity
function mapVulnerabilitySeverity(score) {
  if (!score) return 'info';
  
  if (typeof score === 'string') {
    const lowerScore = score.toLowerCase();
    if (lowerScore.includes('critical')) return 'critical';
    if (lowerScore.includes('high')) return 'high';
    if (lowerScore.includes('medium') || lowerScore.includes('moderate')) return 'medium';
    if (lowerScore.includes('low')) return 'low';
    return 'info';
  }
  
  if (typeof score === 'number') {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    if (score >= 0.1) return 'low';
    return 'info';
  }
  
  return 'info';
}

// Helper function to determine port severity
function getPortSeverity(port) {
  const criticalPorts = [23, 135, 139, 445, 1433, 1521, 3389]; // Telnet, RPC, NetBIOS, SMB, MSSQL, Oracle, RDP
  const highPorts = [21, 22, 3306, 5432, 6379]; // FTP, SSH, MySQL, PostgreSQL, Redis
  const mediumPorts = [25, 53, 110, 143, 993, 995]; // SMTP, DNS, POP3, IMAP
  
  if (criticalPorts.includes(port)) return 'high';
  if (highPorts.includes(port)) return 'medium';
  if (mediumPorts.includes(port)) return 'medium';
  return 'low';
}

// Helper function to get service name for common ports
function getServiceName(port) {
  const services = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP',
    443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S',
    1433: 'MSSQL', 1521: 'Oracle', 3306: 'MySQL', 3389: 'RDP',
    5432: 'PostgreSQL', 6379: 'Redis'
  };
  return services[port] || `Port ${port}`;
}

// Function to parse NVD CVE object into our common shape
function parseNvdCve(nvdCve) {
  if (!nvdCve) return null;

  // Description
  const desc =
    nvdCve.descriptions?.find(d => d.lang === 'en')?.value ||
    nvdCve.descriptions?.[0]?.value ||
    '';

  // CVSS metrics (prefer v3.1 -> v3.0 -> v2)
  const m31 = nvdCve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const m30 = nvdCve.metrics?.cvssMetricV30?.[0]?.cvssData;
  const m2 = nvdCve.metrics?.cvssMetricV2?.[0]?.cvssData;

  const cvssData = m31 || m30 || m2 || null;
  const baseScore = cvssData?.baseScore;
  const vectorString = cvssData?.vectorString;

  // References
  const references = (nvdCve.references || []).map(r => r.url);

  // CWE
  const cwe = (nvdCve.weaknesses || [])
    .flatMap(w => (w.description || []).map(d => d.value))
    .filter(Boolean);

  return {
    id: nvdCve.id,
    summary: desc ? (desc.length > 160 ? `${desc.slice(0, 157)}...` : desc) : nvdCve.id,
    description: desc || 'No description available.',
    cvss: { baseScore, vectorString },
    publishedDate: nvdCve.published,
    lastModifiedDate: nvdCve.lastModified,
    references,
    cwe_ids: cwe,
    solution: null // NVD typically doesn't provide explicit remediation text
  };
}

// Function to fetch CVE details (prefers NVD when API key is present)
async function fetchCVEDetails(cveId) {
  const nvdKey = Deno.env.get('NVD_API_KEY');

  if (nvdKey) {
    try {
      const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
      url.searchParams.set('cveId', cveId);
      url.searchParams.set('apiKey', nvdKey);

      const resp = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Fortigap-App/1.0 (+https://base44.app)',
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        const nvdCve = data?.vulnerabilities?.[0]?.cve;
        if (nvdCve) {
          return parseNvdCve(nvdCve);
        }
      } else {
        console.warn(`NVD fetch failed for ${cveId}: ${resp.status} ${resp.statusText}`);
      }
    } catch (err) {
      console.warn(`Error calling NVD for ${cveId}:`, err);
      // Fall through to RapidAPI
    }
  }

  // Fallback: RapidAPI CVE details
  try {
    const cveUrl = `https://vulnerability-scanner2.p.rapidapi.com/cve/${cveId}`;
    const response = await fetch(cveUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
        'X-RapidAPI-Host': 'vulnerability-scanner2.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.warn(`RapidAPI CVE fetch failed for ${cveId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const cveData = await response.json();
    return cveData;
  } catch (error) {
    console.warn(`Error fetching CVE ${cveId} via RapidAPI:`, error);
    return null;
  }
}

// Function to extract CVE IDs from various sources
function extractCVEIds(scanResults) {
  const cveIds = new Set();
  
  // Extract from vulns array
  if (scanResults.vulns && Array.isArray(scanResults.vulns)) {
    scanResults.vulns.forEach(vuln => {
      if (vuln.cve) {
        cveIds.add(vuln.cve);
      }
      // Check if CVE is mentioned in description or other fields
      const text = JSON.stringify(vuln).toUpperCase();
      const cveMatches = text.match(/CVE-\d{4}-\d{4,}/g);
      if (cveMatches) {
        cveMatches.forEach(cve => cveIds.add(cve));
      }
    });
  }
  
  // Extract CVEs from CPEs if they contain vulnerability references
  if (scanResults.cpes && Array.isArray(scanResults.cpes)) {
    scanResults.cpes.forEach(cpe => {
      const text = JSON.stringify(cpe).toUpperCase();
      const cveMatches = text.match(/CVE-\d{4}-\d{4,}/g);
      if (cveMatches) {
        cveMatches.forEach(cve => cveIds.add(cve));
      }
    });
  }
  
  return Array.from(cveIds);
}

// Add helper to fetch IP insight
async function fetchIpInsight(ip) {
  try {
    const url = `https://ip-geolocation-threat-risk-api.p.rapidapi.com/v1/ipsight/${encodeURIComponent(ip)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
        'X-RapidAPI-Host': 'ip-geolocation-threat-risk-api.p.rapidapi.com'
      }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.result || null;
  } catch {
    return null;
  }
}

// Helper to fetch TLS info for a hostname
async function fetchTlsInfo(host) {
  const candidates = [
    `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?domain=${encodeURIComponent(host)}`,
    `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?host=${encodeURIComponent(host)}`,
    `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?url=${encodeURIComponent(host)}`
  ];
  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
          'X-RapidAPI-Host': 'tls-certificate-fingerprint-scanner.p.rapidapi.com'
        }
      });
      if (!resp.ok) continue;
      const data = await resp.json();

      const notBefore = data.valid_from || data.not_before || data.validity_start;
      const notAfter = data.valid_to || data.not_after || data.validity_end;
      const end = notAfter ? new Date(notAfter) : null;
      const daysToExpiry = end ? Math.floor((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

      return {
        subject: data.subject || data.subject_name || data.common_name || null,
        common_name: data.common_name || data.subjectCN || null,
        issuer: data.issuer || data.issuer_name || null,
        valid_from: notBefore || null,
        valid_to: notAfter || null,
        days_to_expiry: daysToExpiry,
        is_expired: end ? end.getTime() < Date.now() : null,
        fingerprint_sha256: data.fingerprint_sha256 || data.sha256 || data['SHA-256'] || null,
        fingerprint_sha1: data.fingerprint_sha1 || data.sha1 || data['SHA-1'] || null,
        san: Array.isArray(data.san) ? data.san : (typeof data.san === 'string' ? data.san.split(',').map(s => s.trim()).filter(Boolean) : (data.subject_alternative_names || null)),
        signature_algorithm: data.signature_algorithm || data.sig_alg || null,
        protocol: data.tls_version || data.protocol || null,
        raw: data
      };
    } catch {
      // try next candidate
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    const user = await base44.auth.me();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { target } = await req.json();

    if (!target) {
      return new Response(JSON.stringify({ 
        error: 'Target URL is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clean and prepare target
    let cleanTarget = target.trim();
    
    // Remove protocol if present for hostname resolution
    let hostname = cleanTarget;
    if (hostname.startsWith('http://')) {
      hostname = hostname.substring(7);
    } else if (hostname.startsWith('https://')) {
      hostname = hostname.substring(8);
    }
    
    // Remove path if present
    if (hostname.includes('/')) {
      hostname = hostname.split('/')[0];
    }

    // Check if target is already an IP address
    const isIpAddress = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostname)
      || /^[0-9a-fA-F:]+$/.test(hostname); // basic IPv6 check
    
    let targetIp = isIpAddress ? hostname : null;
    let dnsWarning = null;

    if (!isIpAddress) {
      // Robust DNS resolution: try A, then AAAA, then follow CNAME once
      try {
        const aRecords = await Deno.resolveDns(hostname, "A");
        if (Array.isArray(aRecords) && aRecords.length > 0) {
          targetIp = aRecords[0];
          console.log(`Resolved ${hostname} to IPv4: ${targetIp}`);
        } else {
          // Try AAAA
          try {
            const aaaaRecords = await Deno.resolveDns(hostname, "AAAA");
            if (Array.isArray(aaaaRecords) && aaaaRecords.length > 0) {
              targetIp = aaaaRecords[0];
              console.log(`Resolved ${hostname} to IPv6: ${targetIp}`);
            } else {
              // Try CNAME then resolve A
              try {
                const cnameRecords = await Deno.resolveDns(hostname, "CNAME");
                if (Array.isArray(cnameRecords) && cnameRecords.length > 0) {
                  let canonical = cnameRecords[0];
                  if (canonical.endsWith('.')) canonical = canonical.slice(0, -1);
                  console.log(`Resolved ${hostname} CNAME to ${canonical}`);
                  const aAfterCname = await Deno.resolveDns(canonical, "A");
                  if (Array.isArray(aAfterCname) && aAfterCname.length > 0) {
                    targetIp = aAfterCname[0];
                    console.log(`Resolved CNAME ${canonical} to IPv4: ${targetIp}`);
                  } else {
                    dnsWarning = `No A/AAAA records for ${hostname} (CNAME: ${canonical}).`;
                    console.warn(`DNS resolution warning: ${dnsWarning}`);
                  }
                } else {
                  dnsWarning = `No A/AAAA/CNAME records for ${hostname}.`;
                  console.warn(`DNS resolution warning: ${dnsWarning}`);
                }
              } catch (cnameErr) {
                dnsWarning = `No A/AAAA records and CNAME lookup failed for ${hostname}: ${cnameErr.message || 'unknown error'}.`;
                console.warn(`DNS resolution warning: ${dnsWarning}`);
              }
            }
          } catch (aaaaErr) {
            // AAAA lookup failed, try CNAME if not already handled
            try {
              const cnameRecords = await Deno.resolveDns(hostname, "CNAME");
              if (Array.isArray(cnameRecords) && cnameRecords.length > 0) {
                let canonical = cnameRecords[0];
                if (canonical.endsWith('.')) canonical = canonical.slice(0, -1);
                console.log(`Resolved ${hostname} CNAME to ${canonical}`);
                const aAfterCname = await Deno.resolveDns(canonical, "A");
                if (Array.isArray(aAfterCname) && aAfterCname.length > 0) {
                  targetIp = aAfterCname[0];
                  console.log(`Resolved CNAME ${canonical} to IPv4: ${targetIp}`);
                } else {
                  dnsWarning = `CNAME (${canonical}) has no A records.`;
                  console.warn(`DNS resolution warning: ${dnsWarning}`);
                }
              } else {
                dnsWarning = `No A/AAAA/CNAME records for ${hostname}.`;
                console.warn(`DNS resolution warning: ${dnsWarning}`);
              }
            } catch (finalDnsErr) {
              dnsWarning = `DNS resolution failed for ${hostname}: ${finalDnsErr.message || 'unknown error'}.`;
              console.warn(`DNS resolution warning: ${dnsWarning}`);
            }
          }
        }
      } catch (dnsError) {
        // Initial A lookup failed hard — record warning
        dnsWarning = `DNS resolution failed for ${hostname}: ${dnsError.message || 'unknown error'}`;
        console.warn(`DNS resolution warning: ${dnsWarning}`);
      }
    }

    // Always attempt TLS info by hostname
    console.log(`Attempting to fetch TLS info for hostname: ${hostname}`);
    const tlsInfo = await fetchTlsInfo(hostname);
    if (tlsInfo) {
      console.log('Successfully fetched TLS info.');
    } else {
      console.log('Failed to fetch TLS info.');
    }

    // Attempt IP intelligence only if we have an IP
    let ipIntelligence = null;
    if (targetIp) {
      console.log(`Attempting to fetch IP intelligence for: ${targetIp}`);
      ipIntelligence = await fetchIpInsight(targetIp);
      if (ipIntelligence) {
        console.log('Successfully fetched IP intelligence.');
      } else {
        console.log('Failed to fetch IP intelligence.');
      }
    } else {
      console.log('No target IP available for IP intelligence lookup.');
    }

    // Attempt vulnerability scan only if we have an IP
    let scanResults = null;
    let scannerError = null;
    if (targetIp) {
      const apiUrl = `https://vulnerability-scanner2.p.rapidapi.com/${encodeURIComponent(targetIp)}`;
      console.log(`Calling vulnerability scanner API: ${apiUrl}`);
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
            'X-RapidAPI-Host': 'vulnerability-scanner2.p.rapidapi.com'
          }
        });
        if (response.ok) {
          scanResults = await response.json();
          console.log('Vulnerability scanner API response received.');
        } else {
          scannerError = `Scan failed: ${response.status} ${response.statusText}`;
          // Try to capture body text for context (non-fatal)
          try { 
            const errorBody = await response.text();
            scannerError += ` | ${errorBody}`; 
            console.error('RapidAPI Error Body:', errorBody);
          } catch {}
          console.error(`Vulnerability scanner error: ${scannerError}`);
        }
      } catch (e) {
        scannerError = `Scan request error: ${e.message || 'unknown error'}`;
        console.error(`Vulnerability scanner fetch error: ${scannerError}`);
      }
    } else {
      scannerError = 'Vulnerability scan skipped: No target IP resolved.';
      console.warn(scannerError);
    }

    // Step 2: Extract CVE IDs if we have scan results
    const cveIds = scanResults ? extractCVEIds(scanResults) : [];
    console.log(`Found ${cveIds.length} CVE IDs to enrich: ${cveIds.join(', ')}`);
    const cveEnrichmentPromises = cveIds.map(cveId => fetchCVEDetails(cveId));
    const cveDetails = await Promise.allSettled(cveEnrichmentPromises);
    
    // Process CVE enrichment results
    const enrichedCVEs = {};
    cveDetails.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        enrichedCVEs[cveIds[index]] = result.value;
      }
    });

    console.log(`Successfully enriched ${Object.keys(enrichedCVEs).length} CVEs`);

    // Build processed results (partial if scanner missing/fails)
    const processedResults = {
      target: cleanTarget,
      target_ip: targetIp || null,
      scan_timestamp: new Date().toISOString(),
      status: scanResults ? 'completed' : 'partial',
      errors: {},
      summary: {
        total_vulnerabilities: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      findings: [],
      raw_data: scanResults || null,
      cve_enrichment: enrichedCVEs,
      smart_analysis: null // Will be populated by Smart Analysis
    };

    if (dnsWarning) {
      processedResults.errors.dns_resolution = dnsWarning;
    }
    if (scannerError) {
      processedResults.errors.scanner = scannerError;
    }

    // Attach normalized IP intelligence if present
    if (ipIntelligence) {
      processedResults.ip_intelligence = {
        isp_name: ipIntelligence.isp_name,
        org_types: {
          is_gov: !!ipIntelligence.is_gov,
          is_edu: !!ipIntelligence.is_edu,
          is_business: !!ipIntelligence.is_business,
          is_consumer: !!ipIntelligence.is_consumer
        },
        infra_flags: {
          is_proxy: !!ipIntelligence.is_proxy,
          is_hosting: !!ipIntelligence.is_hosting,
          is_crawler: !!ipIntelligence.is_crawler
        },
        geo: {
          country_name: ipIntelligence.country_name,
          city_name: ipIntelligence.city_name,
          latitude: ipIntelligence.latitude,
          longitude: ipIntelligence.longitude,
          time_zone: ipIntelligence.time_zone
        },
        threat_risk: typeof ipIntelligence.threat_risk === 'number' ? ipIntelligence.threat_risk : null
      };
    }

    // Attach TLS info
    if (tlsInfo) {
      processedResults.tls_info = tlsInfo;
    }

    // If we have scanResults, process findings
    if (scanResults) {
      const findings = [];

      // Process vulnerabilities with CVE enrichment (highest priority)
      if (scanResults.vulns && Array.isArray(scanResults.vulns)) {
        scanResults.vulns.forEach(vuln => {
          const cveId = vuln.cve || extractCVEIds({vulns: [vuln]})[0];
          const enrichedCVE = cveId ? enrichedCVEs[cveId] : null;
          
          findings.push({
            id: cveId || vuln.id || Math.random().toString(36).substring(2, 10),
            title: enrichedCVE?.summary || vuln.title || vuln.name || `Vulnerability: ${cveId || 'Unknown'}`,
            severity: mapVulnerabilitySeverity(
              enrichedCVE?.cvss?.baseScore || 
              vuln.cvss || 
              vuln.severity || 
              vuln.score
            ),
            description: enrichedCVE?.description || vuln.description || vuln.summary || 'Vulnerability detected on target system',
            solution: enrichedCVE?.solution || vuln.solution || vuln.fix || 'Apply security patches and updates',
            threat_type: 'vulnerability',
            cve: cveId,
            cvss_score: enrichedCVE?.cvss?.baseScore || vuln.cvss,
            cvss_vector: enrichedCVE?.cvss?.vectorString,
            published_date: enrichedCVE?.publishedDate,
            last_modified: enrichedCVE?.lastModifiedDate,
            references: enrichedCVE?.references || vuln.references,
            enriched: !!enrichedCVE
          });
        });
      }

      // Process open ports
      if (scanResults.ports && Array.isArray(scanResults.ports)) {
        scanResults.ports.forEach(port => {
          const portNum = typeof port === 'object' ? port.port || port.number : port;
          const serviceName = getServiceName(portNum);
          const severity = getPortSeverity(portNum);
          
          findings.push({
            id: `port-${portNum}`,
            title: `Open Port: ${serviceName} (${portNum})`,
            severity: severity,
            description: `Port ${portNum} (${serviceName}) is open and accessible from the internet. This could be a potential entry point for attackers.`,
            solution: severity === 'high' ? 
              'Consider closing this port if not needed or implementing access controls and monitoring.' :
              'Monitor this service for unusual activity and ensure it is properly secured.',
            threat_type: 'open_port',
            port: portNum,
            service: serviceName
          });
        });
      }

      // Process hostnames/domains
      if (scanResults.hostnames && Array.isArray(scanResults.hostnames)) {
        scanResults.hostnames.forEach(h => {
          findings.push({
            id: `hostname-${h}`,
            title: `Associated Hostname: ${h}`,
            severity: 'info',
            description: `The target IP is associated with the hostname: ${h}`,
            solution: 'No action required - informational finding',
            threat_type: 'hostname',
            hostname: h
          });
        });
      }

      // Process software/CPEs (Common Platform Enumerations)
      if (scanResults.cpes && Array.isArray(scanResults.cpes)) {
        scanResults.cpes.forEach(cpe => {
          findings.push({
            id: `cpe-${Math.random().toString(36).substring(2, 10)}`,
            title: `Detected Software: ${cpe}`,
            severity: 'info',
            description: `Software/system component detected: ${cpe}. This information can help identify potential vulnerabilities.`,
            solution: 'Keep software updated and monitor for security advisories',
            threat_type: 'software_detection',
            cpe: cpe
          });
        });
      }

      // Process tags
      if (scanResults.tags && Array.isArray(scanResults.tags)) {
        scanResults.tags.forEach(tag => {
          findings.push({
            id: `tag-${tag}`,
            title: `System Tag: ${tag}`,
            severity: 'info',
            description: `System tagged as: ${tag}`,
            solution: 'No action required - informational finding',
            threat_type: 'system_tag',
            tag: tag
          });
        });
      }

      // Update findings in processed results
      processedResults.findings = findings;

      // Calculate summary statistics
      findings.forEach(finding => {
        processedResults.summary.total_vulnerabilities++;
        processedResults.summary[finding.severity]++;
      });
      console.log(`Scan completed. Found ${processedResults.summary.total_vulnerabilities} findings (${processedResults.summary.critical} critical, ${processedResults.summary.high} high, ${processedResults.summary.medium} medium, ${processedResults.summary.low} low, ${processedResults.summary.info} info)`);

    } else {
      console.log('No scan results available to process findings.');
    }

    // Remove automatic Smart Analysis generation - will be done on user request
    processedResults.smart_analysis = null; // No automatic analysis

    return new Response(JSON.stringify(processedResults), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Web scanner top-level error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Scan failed',
      details: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
