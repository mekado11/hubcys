import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth (user-scoped)
    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { ip } = await req.json();
    if (!ip || typeof ip !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid ip parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = `https://ip-geolocation-threat-risk-api.p.rapidapi.com/v1/ipsight/${encodeURIComponent(ip)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
        'X-RapidAPI-Host': 'ip-geolocation-threat-risk-api.p.rapidapi.com'
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: 'RapidAPI error', details: text }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    const result = data?.result || null;

    if (!result) {
      return new Response(JSON.stringify({ error: 'No result from IP intelligence API', raw: data }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normalize shape a bit while returning original as well
    const normalized = {
      ip: ip,
      isp_name: result.isp_name,
      org_types: {
        is_gov: !!result.is_gov,
        is_edu: !!result.is_edu,
        is_business: !!result.is_business,
        is_consumer: !!result.is_consumer
      },
      infra_flags: {
        is_proxy: !!result.is_proxy,
        is_hosting: !!result.is_hosting,
        is_crawler: !!result.is_crawler
      },
      geo: {
        country_name: result.country_name,
        city_name: result.city_name,
        latitude: result.latitude,
        longitude: result.longitude,
        time_zone: result.time_zone
      },
      threat_risk: typeof result.threat_risk === 'number' ? result.threat_risk : null,
      raw: result
    };

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});