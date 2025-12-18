import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/* ========== MITRE Technique Names Mapping ========== */
const MITRE_NAMES = {
  'T1071.001': 'Web Protocols (C2)',
  'T1041': 'Exfiltration Over C2 Channel',
  'T1204': 'User Execution',
  'T1021.002': 'SMB/Windows Admin Shares',
  'T1098': 'Account Manipulation',
  'T1078': 'Valid Accounts',
  'T1110.001': 'Password Guessing',
  'T1550.004': 'Web Session Cookie',
  'T1567': 'Exfiltration Over Web Service',
  'T1098.003': 'Additional Cloud Roles',
  'T1053.005': 'Scheduled Task',
  'T1569.002': 'Service Execution'
};

/* ========== Basic helpers (pure JS) ========== */
function textToLines(text) {
  return String(text).split(/\r?\n/).filter((l) => l && l.trim().length > 0);
}

function detectFormatByContent(text, url) {
  const ext = (url || '').split('.').pop()?.toLowerCase() || '';
  const trimmed = (text || '').trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || ext === 'json') return 'json';
  if (trimmed.includes(',') || ext === 'csv') return 'csv';
  if (ext === 'xml' || trimmed.startsWith('<')) return 'xml';
  return 'syslog';
}

function parseCSV(text) {
  const lines = textToLines(text);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = (parts[j] || '').trim();
    }
    rows.push(obj);
  }
  return rows;
}

const ipRegex = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\b/g;
const urlRegex = /\bhttps?:\/\/[^\s"']+\b/gi;
const domainRegex = /(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}/g;
const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;
const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
const md5Regex = /\b[a-fA-F0-9]{32}\b/g;

function uniq(arr) {
  return Array.from(new Set(arr));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function verdictFromScore(score, thresholds) {
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/* ========== Traversal and metadata helpers ========== */
function gatherValues(node, acc) {
  acc = acc || [];
  if (node == null) return acc;
  const t = typeof node;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    acc.push(String(node));
    return acc;
  }
  if (Array.isArray(node)) {
    for (const v of node) gatherValues(v, acc);
    return acc;
  }
  if (t === 'object') {
    for (const k of Object.keys(node)) {
      gatherValues(node[k], acc);
    }
  }
  return acc;
}

function flattenObject(node, prefix, out) {
  prefix = prefix || '';
  out = out || {};
  if (node == null) return out;
  if (typeof node !== 'object' || Array.isArray(node)) {
    out[prefix || 'value'] = node;
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, next, out);
    } else if (Array.isArray(v)) {
      out[next] = v;
      for (let i = 0; i < v.length; i++) {
        flattenObject(v[i], `${next}[${i}]`, out);
      }
    } else {
      out[next] = v;
    }
  }
  return out;
}

function detectSource(flat) {
  const keysJoined = Object.keys(flat || {}).join(' ').toLowerCase();
  if (/cloudtrail|aws|iam|s3|getobject|assumerole/.test(keysJoined)) return 'cloud';
  if (/eventid|winlog|4625|rdp|security\-audit/.test(keysJoined)) return 'windows';
  if (/process|cmdline|edr|endpoint|sensor/.test(keysJoined)) return 'edr';
  if (/firewall|deny|rule|src|dst|zone|utm|threat/.test(keysJoined)) return 'firewall';
  if (/proxy|http|url|user\-agent|uri/.test(keysJoined)) return 'proxy';
  if (/dns|resolver|query_name|qname/.test(keysJoined)) return 'dns';
  return 'unknown';
}

function extractEventContext(flat) {
  const ctx = {};
  const src = detectSource(flat);
  ctx.source = src;

  // Common fields
  ctx.timestamp = flat.timestamp || flat.eventTime || flat['@timestamp'] || flat.time || null;
  ctx.user = flat.user || flat.userIdentity?.userName || flat.username || flat['user.name'] || null;
  ctx.src_ip = flat.sourceIPAddress || flat.src_ip || flat['source.ip'] || flat.clientIP || null;
  ctx.action = flat.action || flat.eventName || flat.activity || null;
  ctx.outcome = flat.outcome || flat.status || flat.result || null;

  // Windows-specific
  if (src === 'windows') {
    ctx.event_id = flat.EventID || flat['event.id'] || flat.event_id || null;
    ctx.process_name = flat.Image || flat['process.name'] || flat.processName || null;
    ctx.share_name = flat.ShareName || flat['file.share'] || null;
    ctx.access_mask = flat.AccessMask || flat['file.access_mask'] || null;
  }

  // Cloud-specific
  if (src === 'cloud') {
    ctx.event_name = flat.eventName || null;
    ctx.user_agent = flat.userAgent || null;
    ctx.resource_name = flat['requestParameters.bucketName'] || flat['requestParameters.functionName'] || null;
  }

  return ctx;
}

/* ========== Shodan enrichment ========== */
async function enrichIpWithShodan(ip) {
  const apiKey = Deno.env.get('SHODAN_API_KEY');
  if (!apiKey) return null;
  try {
    const resp = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      country_name: data.country_name || null,
      org: data.org || null,
      isp: data.isp || null,
      asn: data.asn || null,
      ports: (data.ports || []).slice(0, 10),
      hostnames: (data.hostnames || []).slice(0, 5),
      tags: data.tags || [],
      vulns: data.vulns || [],
      threat_risk: (data.tags || []).some((t) => /malicious|bot|scanner|exploit/.test(t)) ? 80 : 0,
    };
  } catch (e) {
    console.warn(`Shodan enrichment failed for ${ip}:`, e?.message || e);
    return null;
  }
}

/* ========== ThreatFox enrichment ========== */
async function enrichWithThreatFox(iocValue, iocType) {
  const authKey = Deno.env.get('THREATFOX_AUTH_KEY');
  if (!authKey) return null;

  try {
    const resp = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: {
        'Auth-Key': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'search_ioc',
        search_ioc: String(iocValue)
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      console.warn('ThreatFox API error', resp.status, txt?.slice(0, 250));
      return null;
    }

    const data = await resp.json().catch(() => null);
    if (!data || data.query_status !== 'ok' || !Array.isArray(data.data) || data.data.length === 0) {
      return null;
    }

    const best = data.data.reduce((acc, cur) => {
      const c1 = Number(acc?.confidence || 0);
      const c2 = Number(cur?.confidence || 0);
      if (c2 !== c1) return c2 > c1 ? cur : acc;
      const t1 = new Date(acc?.first_seen || 0).getTime();
      const t2 = new Date(cur?.first_seen || 0).getTime();
      return t2 > t1 ? cur : acc;
    });

    const confidence = Number(best?.confidence || 0);
    const normalized = {
      confidence: Math.max(0, Math.min(100, Math.round(confidence))),
      ioc: best?.ioc || iocValue,
      ioc_type: best?.ioc_type || iocType,
      malware: best?.malware || null,
      threat_type: best?.threat_type || best?.threat_type_desc || null,
      first_seen: best?.first_seen || null,
      last_seen: best?.last_seen || null,
      reference: best?.reference || null,
      tags: Array.isArray(best?.tags) ? best.tags : [],
      raw: data
    };

    return normalized;
  } catch (e) {
    console.warn('ThreatFox enrichment failed for', iocValue, e?.message || e);
    return null;
  }
}

/* ========== Behavioral Detections (cyber) ========== */
function detectImpossibleTravel(events) {
  const findings = [];
  const byUser = {};
  for (const ev of events) {
    const flat = flattenObject(ev);
    const user = flat.user || flat.userIdentity?.userName || flat.username || null;
    const country = flat.sourceIPAddress ? (flat.country_name || 'Unknown') : null;
    const ts = flat.timestamp || flat.eventTime || flat['@timestamp'] || new Date().toISOString();
    if (!user || !country) continue;
    if (!byUser[user]) byUser[user] = [];
    byUser[user].push({ country, ts, ip: flat.sourceIPAddress || null });
  }

  for (const [user, logins] of Object.entries(byUser)) {
    if (logins.length < 2) continue;
    logins.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    for (let i = 1; i < logins.length; i++) {
      const prev = logins[i - 1];
      const curr = logins[i];
      if (prev.country !== curr.country) {
        const timeDiffMs = new Date(curr.ts).getTime() - new Date(prev.ts).getTime();
        const hours = timeDiffMs / (1000 * 60 * 60);
        if (hours < 2 && hours >= 0) {
          findings.push({
            type: 'impossible_travel',
            user,
            from_country: prev.country,
            to_country: curr.country,
            time_diff_hours: hours.toFixed(1),
            from_ip: prev.ip,
            to_ip: curr.ip,
            narrative: `User ${user} logged in from ${prev.country} then ${curr.country} within ${hours.toFixed(1)}h (impossible travel)`,
            severity: 'high',
            mitre_techniques: ['T1078'],
            iocs: [prev.ip, curr.ip].filter(Boolean)
          });
        }
      }
    }
  }
  return findings;
}

function detectPrivilegeEscalation(events) {
  const findings = [];
  const privilegeKeywords = ['createpolicy', 'attachuserpolicy', 'attachrolepolicy', 'iam:', 'assumerole', 'setsecuritygroups'];
  for (const ev of events) {
    const flat = flattenObject(ev);
    const eventName = (flat.eventName || flat.action || '').toLowerCase();
    if (privilegeKeywords.some((kw) => eventName.includes(kw))) {
      const user = flat.user || flat.userIdentity?.userName || 'unknown';
      const srcIp = flat.sourceIPAddress || flat.src_ip || null;
      findings.push({
        type: 'privilege_escalation',
        user,
        action: eventName,
        narrative: `Privilege escalation detected: ${user} performed ${eventName}`,
        severity: 'high',
        mitre_techniques: ['T1098', 'T1098.003'],
        iocs: [srcIp].filter(Boolean)
      });
    }
  }
  return findings;
}

function detectC2Beaconing(events) {
  const findings = [];
  const ipCounts = {};
  for (const ev of events) {
    const flat = flattenObject(ev);
    const ip = flat.sourceIPAddress || flat.src_ip || flat.dst_ip || null;
    if (ip && !isPrivateIp(ip)) {
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  }
  for (const [ip, count] of Object.entries(ipCounts)) {
    if (count >= 5) {
      findings.push({
        type: 'c2_beaconing',
        ip,
        count,
        narrative: `Regular periodic connections to ${ip} (beacon-like timing)`,
        severity: 'high',
        mitre_techniques: ['T1071.001'],
        iocs: [ip]
      });
    }
  }
  return findings;
}

function detectDataExfiltration(events) {
  const findings = [];
  for (const ev of events) {
    const flat = flattenObject(ev);
    const eventName = (flat.eventName || '').toLowerCase();
    const bytes = parseInt(flat.bytesTransferred || flat['network.bytes'] || 0, 10);
    if ((eventName.includes('getobject') || eventName.includes('download')) && bytes > 100000000) {
      const srcIp = flat.sourceIPAddress || flat.src_ip || null;
      findings.push({
        type: 'data_exfiltration',
        user: flat.user || 'unknown',
        bytes,
        narrative: `Large data transfer detected (${(bytes / 1024 / 1024).toFixed(1)}MB)`,
        severity: 'medium',
        mitre_techniques: ['T1041', 'T1567'],
        iocs: [srcIp].filter(Boolean)
      });
    }
  }
  return findings;
}

function detectOffHoursActivity(events) {
  const findings = [];
  for (const ev of events) {
    const flat = flattenObject(ev);
    const ts = flat.timestamp || flat.eventTime || flat['@timestamp'];
    if (!ts) continue;
    const hour = new Date(ts).getUTCHours();
    if (hour >= 0 && hour < 6) {
      const user = flat.user || flat.userIdentity?.userName || 'unknown';
      const srcIp = flat.sourceIPAddress || flat.src_ip || null;
      findings.push({
        type: 'off_hours_activity',
        user,
        hour,
        narrative: `Off-hours activity detected: ${user} active at ${hour}:00 UTC`,
        severity: 'medium',
        mitre_techniques: ['T1078'],
        iocs: [srcIp].filter(Boolean)
      });
    }
  }
  return findings;
}

/* ========== Physical Access Log Analysis ========== */
function processPhysicalAccessLogs(physicalEvents, config) {
  const iocs = [];
  const perEmployee = {};
  const highRiskAccessPoints = ['server room', 'data center', 'network closet', 'mdf room', 'security ops center', 'vault'];

  for (const event of physicalEvents) {
    const ts = event.timestamp ? new Date(event.timestamp) : null;
    const employeeId = (event.employee_id || event.EmployeeID || event.user || event.User || event.ID || '').toString() || 'unknown';
    const accessPoint = (event.access_point || event.AccessPoint || event.Location || event.Door || '').toString() || 'unknown';
    const eventType = (event.event_type || event.EventType || event.Type || 'Entry').toString();
    const status = (event.status || event.Status || 'Granted').toString();

    const ioc = {
      type: 'physical_access',
      value: `${employeeId} at ${accessPoint}`,
      score: 0,
      rationale: [],
      samples: [event],
      mitre: [],
      owasp_categories: [],
      nist_category: null,
      recommended_actions: [],
      enrichment: {},
      event_context: {
        timestamp: ts ? ts.toISOString() : null,
        employee_id: employeeId,
        access_point: accessPoint,
        event_type: eventType,
        status
      }
    };

    if (status.toLowerCase() === 'denied') {
      ioc.score += 30;
      ioc.rationale.push(`Access denied for ${employeeId} at ${accessPoint}.`);
      ioc.recommended_actions.push('investigate_denied_access');
    }

    if (ts) {
      const hour = ts.getUTCHours();
      if (hour < 6 || hour > 20) {
        ioc.score += 25;
        ioc.rationale.push(`Access outside normal working hours (${hour}:00 UTC).`);
        ioc.recommended_actions.push('review_out_of_hours_access');
      }
    }

    if (accessPoint && highRiskAccessPoints.some(hr => accessPoint.toLowerCase().includes(hr))) {
      ioc.score += 40;
      ioc.rationale.push(`Access to high-risk area: ${accessPoint}.`);
      ioc.recommended_actions.push('verify_critical_area_access');
    }

    if (!perEmployee[employeeId]) perEmployee[employeeId] = [];
    perEmployee[employeeId].push({ ts, status });

    if (status.toLowerCase() === 'denied' && ts) {
      const recentDenied = perEmployee[employeeId].filter(
        e => e.status.toLowerCase() === 'denied' && e.ts && (ts.getTime() - e.ts.getTime() <= 5 * 60 * 1000)
      ).length;
      if (recentDenied >= 3) {
        ioc.score += 50;
        ioc.rationale.push(`Multiple denied access attempts by ${employeeId} within a short timeframe.`);
        ioc.recommended_actions.push('alert_security_team');
      }
    }

    ioc.score = clamp(ioc.score, 0, 100);
    ioc.verdict = verdictFromScore(ioc.score, config.thresholds);

    if (ioc.score > 0) {
      iocs.push(ioc);
    }
  }

  return iocs;
}

/* ========== Main Handler ========== */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const file_url = body?.file_url || null;
    const enable_ai_mapping = body?.enable_ai_mapping !== false;
    const log_type = body?.log_type || 'cyber';

    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    // Fetch file content
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) {
      return Response.json({ error: 'Failed to fetch file' }, { status: 500 });
    }
    const fileText = await fileResp.text();
    const format = detectFormatByContent(fileText, file_url);

    // Load config
    const cfgRows = await base44.entities.IOCAnalyzerConfig.filter({ company_id: user.company_id }, '-updated_date', 1);
    const config = cfgRows?.[0] || {
      thresholds: { high: 75, medium: 50 },
      weights: { w_hash: 0.25, w_ip: 0.2, w_behavior: 0.35, w_geo: 0.1, w_ctx: 0.1 },
      whitelist_patterns: [],
      blacklist_values: [],
      enable_ai_mapping: false,
      enable_shodan_enrichment: true,
    };

    // Parse based on log type
    let events = [];
    let physicalEvents = [];

    if (log_type === 'physical_access') {
      if (format !== 'csv') {
        return Response.json({ error: 'Only CSV format is supported for physical access logs' }, { status: 400 });
      }
      physicalEvents = parseCSV(fileText);
      if (!Array.isArray(physicalEvents) || physicalEvents.length === 0) {
        return Response.json({ error: 'No events found in physical access log file' }, { status: 400 });
      }
    } else { // cyber logs
      if (format === 'json') {
        try {
          const parsed = JSON.parse(fileText);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 });
        }
      } else if (format === 'csv') {
        events = parseCSV(fileText);
      } else {
        events = textToLines(fileText).map((line) => ({ raw: line }));
      }
      if (!Array.isArray(events) || events.length === 0) {
        return Response.json({ error: 'No events found' }, { status: 400 });
      }
    }

    if (log_type === 'physical_access') {
      const physicalIocs = processPhysicalAccessLogs(physicalEvents, config);
      const summary = {
        total_events: physicalEvents.length,
        total_iocs: physicalIocs.length,
        high: physicalIocs.filter(i => i.verdict === 'high').length,
        medium: physicalIocs.filter(i => i.verdict === 'medium').length,
        low: physicalIocs.filter(i => i.verdict === 'low').length,
      };
      return Response.json({
        summary,
        results: physicalIocs,
        event_groups: [],
        used_config: {
          thresholds: config.thresholds,
          ai: false,
          shodan: false,
          threatfox: false
        }
      });
    }

    // ========== Existing cyber log processing flow ==========
    const iocMap = {};
    for (const ev of events) {
      const allText = gatherValues(ev).join(' ');
      const flat = flattenObject(ev);
      const eventContext = extractEventContext(flat);

      const ips = uniq((allText.match(ipRegex) || []).filter((ip) => !isPrivateIp(ip)));
      for (const ip of ips) {
        const key = `ip:${ip}`;
        if (!iocMap[key]) {
          iocMap[key] = {
            type: 'ip',
            value: ip,
            score: 10,
            rationale: [],
            samples: [],
            mitre: [],
            owasp_categories: [],
            nist_category: null,
            recommended_actions: ['watchlist_ip', 'auto_enrich_ip'],
            enrichment: {},
            event_context: eventContext,
          };
        }
        iocMap[key].samples.push(ev);
      }

      const domains = uniq((allText.match(domainRegex) || []).filter((d) => !isPrivateIp(d) && d.includes('.')));
      for (const domain of domains) {
        const key = `domain:${domain}`;
        if (!iocMap[key]) {
          iocMap[key] = {
            type: 'domain',
            value: domain,
            score: 5,
            rationale: [],
            samples: [],
            mitre: [],
            owasp_categories: [],
            nist_category: null,
            recommended_actions: ['watchlist_domain', 'auto_enrich_domain'],
            enrichment: {},
            event_context: eventContext,
          };
        }
        iocMap[key].samples.push(ev);
      }

      const sha256s = uniq(allText.match(sha256Regex) || []);
      const sha1s = uniq(allText.match(sha1Regex) || []);
      const md5s = uniq(allText.match(md5Regex) || []);
      for (const hash of [...sha256s, ...sha1s, ...md5s]) {
        const key = `hash:${hash}`;
        if (!iocMap[key]) {
          iocMap[key] = {
            type: 'hash',
            value: hash,
            score: 15,
            rationale: [],
            samples: [],
            mitre: ['T1204'],
            owasp_categories: ['A03:2021 – Injection'],
            nist_category: 'PR.DS',
            recommended_actions: ['quarantine_artifact', 'block_hash_edr', 'watchlist_hash'],
            enrichment: {},
            event_context: eventContext,
          };
        }
        iocMap[key].samples.push(ev);
      }
    }

    const behavioralFindings = [
      ...detectImpossibleTravel(events),
      ...detectPrivilegeEscalation(events),
      ...detectC2Beaconing(events),
      ...detectDataExfiltration(events),
      ...detectOffHoursActivity(events),
    ];

    for (const finding of behavioralFindings) {
      for (const iocValue of finding.iocs || []) {
        const key = `ip:${iocValue}`;
        if (iocMap[key]) {
          iocMap[key].score += 40;
          iocMap[key].rationale.push(finding.narrative);
          iocMap[key].mitre = uniq([...iocMap[key].mitre, ...(finding.mitre_techniques || [])]);
        }
      }
    }

    const iocList = Object.values(iocMap);
    for (const ioc of iocList) {
      if (ioc.type === 'ip' && config.enable_shodan_enrichment) {
        const shodanData = await enrichIpWithShodan(ioc.value);
        if (shodanData) {
          ioc.enrichment = { ...ioc.enrichment, ...shodanData };
          if (typeof shodanData.threat_risk === 'number' && shodanData.threat_risk > 50) {
            ioc.score += 30;
            ioc.rationale.push(`Shodan threat risk: ${shodanData.threat_risk}`);
          }
        }
      }

      if (['ip', 'domain', 'url', 'hash'].includes(ioc.type)) {
        const tf = await enrichWithThreatFox(ioc.value, ioc.type);
        if (tf) {
          ioc.enrichment = { ...ioc.enrichment, threatfox: tf };
          const currentRisk = typeof ioc.enrichment?.threat_risk === 'number' ? ioc.enrichment.threat_risk : 0;
          ioc.enrichment.threat_risk = Math.max(currentRisk, tf.confidence);

          if (tf.confidence >= 80) {
            ioc.score += 40;
            ioc.rationale.push(`ThreatFox: high confidence (${tf.confidence})${tf.malware ? `, malware: ${tf.malware}` : ''}`);
          } else if (tf.confidence >= 60) {
            ioc.score += 25;
            ioc.rationale.push(`ThreatFox: elevated confidence (${tf.confidence})${tf.malware ? `, malware: ${tf.malware}` : ''}`);
          } else if (tf.confidence >= 40) {
            ioc.score += 10;
            ioc.rationale.push(`ThreatFox: moderate confidence (${tf.confidence})`);
          }

          if (tf.threat_type) {
            ioc.rationale.push(`ThreatFox threat type: ${tf.threat_type}`);
          }
          if (Array.isArray(tf.tags) && tf.tags.length) {
            ioc.rationale.push(`ThreatFox tags: ${tf.tags.slice(0, 5).join(', ')}`);
          }
        }
      }

      ioc.samples = ioc.samples.slice(0, 5);
      ioc.score = clamp(ioc.score, 0, 100);
      ioc.verdict = verdictFromScore(ioc.score, config.thresholds);
    }

    let filteredIocs = iocList.filter((ioc) => {
      if (config.blacklist_values.includes(ioc.value)) {
        ioc.verdict = 'high';
        ioc.score = 100;
        return true;
      }
      for (const pattern of config.whitelist_patterns) {
        if (pattern.startsWith('*') && ioc.value.endsWith(pattern.slice(1))) return false;
        if (pattern.endsWith('*') && ioc.value.startsWith(pattern.slice(0, -1))) return false;
        if (pattern === ioc.value) return false;
      }
      return true;
    });

    if (enable_ai_mapping && config.enable_ai_mapping) {
      for (const ioc of filteredIocs.slice(0, 10)) {
        try {
          const prompt = `IOC: ${ioc.type} ${ioc.value}. Context: ${JSON.stringify(ioc.event_context)}. Map to MITRE ATT&CK, OWASP, NIST.`;
          const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                mitre: { type: 'array', items: { type: 'string' } },
                owasp: { type: 'array', items: { type: 'string' } },
                nist: { type: 'string' },
              },
            },
          });
          if (aiRes?.mitre) ioc.mitre = uniq([...ioc.mitre, ...aiRes.mitre]);
          if (aiRes?.owasp) ioc.owasp_categories = uniq([...ioc.owasp_categories, ...aiRes.owasp]);
          if (aiRes?.nist) ioc.nist_category = aiRes.nist;
        } catch (aiError) {
          console.warn(`AI mapping failed for IOC ${ioc.value}:`, aiError?.message || aiError);
        }
      }
    }

    for (const ioc of filteredIocs) {
      ioc.mitre_with_names = (ioc.mitre || []).map((id) => ({
        id,
        name: MITRE_NAMES[id] || 'Unknown Technique',
      }));
    }

    const event_groups = behavioralFindings.map((f) => ({
      group_type: f.type,
      severity: f.severity,
      narrative: f.narrative,
      mitre_techniques: f.mitre_techniques,
      iocs: f.iocs,
    }));

    for (const group of event_groups) {
      if (group.severity === 'high' || group.severity === 'critical') {
        for (const iocValue of group.iocs || []) {
          for (const ioc of filteredIocs) {
            if (ioc.value === iocValue) {
              ioc.verdict = 'high';
              ioc.score = Math.max(ioc.score, config.thresholds.high);
              if (!ioc.rationale.some((r) => r.includes('Part of HIGH severity event'))) {
                ioc.rationale.push(`Part of HIGH severity event: ${group.narrative}`);
              }
            }
          }
        }
      } else if (group.severity === 'medium') {
        for (const iocValue of group.iocs || []) {
          for (const ioc of filteredIocs) {
            if (ioc.value === iocValue && ioc.verdict === 'low') {
              ioc.verdict = 'medium';
              ioc.score = Math.max(ioc.score, config.thresholds.medium);
              if (!ioc.rationale.some((r) => r.includes('Part of MEDIUM severity event'))) {
                ioc.rationale.push(`Part of MEDIUM severity event: ${group.narrative}`);
              }
            }
          }
        }
      }
    }

    const summary = {
      total_events: events.length,
      total_iocs: filteredIocs.length,
      high: filteredIocs.filter((ioc) => ioc.verdict === 'high').length,
      medium: filteredIocs.filter((ioc) => ioc.verdict === 'medium').length,
      low: filteredIocs.filter((ioc) => ioc.verdict === 'low').length,
    };

    return Response.json({
      summary,
      results: filteredIocs,
      event_groups,
      used_config: {
        thresholds: config.thresholds,
        ai: enable_ai_mapping && config.enable_ai_mapping,
        shodan: config.enable_shodan_enrichment,
        threatfox: Boolean(Deno.env.get('THREATFOX_AUTH_KEY'))
      },
    });
  } catch (error) {
    console.error('IOC Analysis error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});