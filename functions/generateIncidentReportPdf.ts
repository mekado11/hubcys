import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

function getIncidentReportHtml(incident) {
  const {
    title,
    incident_id,
    description,
    status,
    priority,
    category,
    detection_timestamp,
    detection_source,
    reporter_name,
    reporter_email,
    affected_systems,
    affected_users,
    business_impact,
    containment_actions,
    containment_timestamp,
    containment_effective,
    stakeholders_notified,
    root_cause,
    eradication_actions,
    eradication_timestamp,
    tools_used,
    iocs_identified,
    patches_applied,
    systems_restored,
    recovery_timestamp,
    verification_steps,
    monitoring_enabled,
    return_to_service,
    lessons_learned,
    action_items_generated,
    assigned_to,
    closed_timestamp,
    mttr_minutes,
    mttd_minutes
  } = incident;

  const formatDate = (date) => date ? new Date(date).toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : 'N/A';
  
  const getPriorityColor = (level) => {
    switch (level) {
      case 'Critical': return '#DC3545';
      case 'High': return '#FD7E14';
      case 'Medium': return '#FFC107';
      default: return '#007BFF';
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Detected': return '#DC3545';
      case 'Triaged': return '#FD7E14';
      case 'Contained': return '#007BFF';
      case 'Eradicated': return '#7C3AED';
      case 'Recovering': return '#F59E0B';
      case 'Closed': return '#28A745';
      case 'Under_Review': return '#6C757D';
      default: return '#6c757d';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Incident Report: ${incident_id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: 'Inter', sans-serif; 
              background-color: #ffffff; 
              color: #343a49; 
              line-height: 1.6; 
              margin: 0; 
            }
            .report-container { 
              max-width: 850px; 
              margin: auto; 
              padding: 40px; 
            }
            .card { 
              border: 1px solid #dee2e6; 
              border-radius: 8px; 
              padding: 24px; 
              margin-bottom: 24px; 
              page-break-inside: avoid; 
            }
            .report-header { 
              text-align: center; 
              margin-bottom: 40px; 
            }
            .report-header h1 { 
              font-size: 2em; 
              color: #212529; 
              margin-bottom: 0.2em; 
            }
            .report-header p { 
              font-size: 1em; 
              color: #6c757d; 
            }
            .section-title { 
              font-size: 1.5em; 
              color: #212529; 
              font-weight: 700; 
              border-bottom: 2px solid #007BFF; 
              padding-bottom: 8px; 
              margin-bottom: 16px; 
            }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 16px; 
            }
            .info-box { 
              background-color: #f8f9fa; 
              padding: 12px; 
              border-radius: 4px; 
            }
            .info-box h4 { 
              margin: 0 0 4px; 
              font-size: 0.9em; 
              color: #6c757d; 
              text-transform: uppercase; 
            }
            .info-box p { 
              margin: 0; 
              font-size: 1.1em; 
              font-weight: 500; 
            }
            .badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 16px; 
              font-weight: 500; 
              color: #fff; 
            }
            ul { 
              padding-left: 20px; 
              margin-top: 0; 
            }
            li { 
              margin-bottom: 8px; 
            }
            .phase-section {
              margin-bottom: 32px;
            }
            .phase-title {
              font-size: 1.3em;
              color: #495057;
              font-weight: 600;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
            }
            .phase-icon {
              width: 20px;
              height: 20px;
              margin-right: 8px;
              border-radius: 50%;
            }
            .content-block {
              background-color: #f8f9fa;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
            }
            .content-block h4 {
              margin: 0 0 8px 0;
              font-size: 1em;
              color: #495057;
              font-weight: 600;
            }
            .content-block p {
              margin: 0;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              color: #6c757d;
              font-size: 0.9em;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 12px;
              margin-top: 16px;
            }
            .metric-item {
              background: #e9f4ff;
              padding: 12px;
              border-radius: 4px;
              text-align: center;
            }
            .metric-value {
              font-size: 1.5em;
              font-weight: 700;
              color: #0066cc;
              display: block;
            }
            .metric-label {
              font-size: 0.8em;
              color: #666;
              text-transform: uppercase;
              margin-top: 4px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="report-header">
                <h1>Incident Report</h1>
                <p><strong>${incident_id}:</strong> ${title || 'Untitled Incident'}</p>
            </div>

            <!-- Incident Overview -->
            <div class="card">
                <h2 class="section-title">Incident Overview</h2>
                <div class="grid">
                    <div class="info-box">
                        <h4>Status</h4>
                        <p><span class="badge" style="background-color: ${getStatusColor(status)}">${status || 'Unknown'}</span></p>
                    </div>
                    <div class="info-box">
                        <h4>Priority</h4>
                        <p><span class="badge" style="background-color: ${getPriorityColor(priority)}">${priority || 'Medium'}</span></p>
                    </div>
                    <div class="info-box">
                        <h4>Category</h4>
                        <p>${category?.replace('_', ' ') || 'Not specified'}</p>
                    </div>
                    <div class="info-box">
                        <h4>Detected On</h4>
                        <p>${formatDate(detection_timestamp)}</p>
                    </div>
                </div>
                
                ${assigned_to ? `
                <div style="margin-top: 16px;">
                    <div class="info-box">
                        <h4>Assigned To</h4>
                        <p>${assigned_to}</p>
                    </div>
                </div>` : ''}
            </div>

            <!-- Detection & Reporting -->
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #DC3545;"></div>
                        Detection & Reporting
                    </div>
                    
                    ${description ? `
                    <div class="content-block">
                        <h4>Description</h4>
                        <p>${description}</p>
                    </div>` : ''}
                    
                    <div class="grid">
                        ${detection_source ? `
                        <div class="info-box">
                            <h4>Detection Source</h4>
                            <p>${detection_source}</p>
                        </div>` : ''}
                        
                        ${reporter_name ? `
                        <div class="info-box">
                            <h4>Reported By</h4>
                            <p>${reporter_name}${reporter_email ? ` (${reporter_email})` : ''}</p>
                        </div>` : ''}
                    </div>
                </div>
            </div>

            <!-- Triage & Classification -->
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #FD7E14;"></div>
                        Triage & Classification
                    </div>
                    
                    <div class="grid">
                        <div class="info-box">
                            <h4>Category</h4>
                            <p>${category?.replace('_', ' ') || 'Not specified'}</p>
                        </div>
                        <div class="info-box">
                            <h4>Priority</h4>
                            <p><span class="badge" style="background-color: ${getPriorityColor(priority)}">${priority || 'Medium'}</span></p>
                        </div>
                        <div class="info-box">
                            <h4>Status</h4>
                            <p><span class="badge" style="background-color: ${getStatusColor(status)}">${status || 'Unknown'}</span></p>
                        </div>
                    </div>
                    
                    ${affected_systems ? `
                    <div class="content-block">
                        <h4>Affected Systems</h4>
                        <p>${affected_systems}</p>
                    </div>` : ''}
                    
                    ${affected_users ? `
                    <div class="content-block">
                        <h4>Affected Users</h4>
                        <p>${affected_users}</p>
                    </div>` : ''}
                    
                    ${business_impact ? `
                    <div class="content-block">
                        <h4>Business Impact Assessment</h4>
                        <p>${business_impact}</p>
                    </div>` : ''}
                </div>
            </div>

            <!-- Containment -->
            ${containment_actions || containment_timestamp ? `
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #007BFF;"></div>
                        Containment Actions
                    </div>
                    
                    ${containment_timestamp ? `
                    <div class="info-box" style="margin-bottom: 16px;">
                        <h4>Containment Achieved</h4>
                        <p>${formatDate(containment_timestamp)}</p>
                    </div>` : ''}
                    
                    ${containment_actions ? `
                    <div class="content-block">
                        <h4>Actions Taken</h4>
                        <p>${containment_actions}</p>
                    </div>` : ''}
                    
                    ${containment_effective !== null && containment_effective !== undefined ? `
                    <div class="info-box">
                        <h4>Containment Effective</h4>
                        <p><span class="badge" style="background-color: ${containment_effective ? '#28A745' : '#DC3545'}">${containment_effective ? 'Yes' : 'No'}</span></p>
                    </div>` : ''}
                    
                    ${stakeholders_notified ? `
                    <div class="content-block">
                        <h4>Stakeholders Notified</h4>
                        <p>${stakeholders_notified}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- Eradication -->
            ${eradication_actions || root_cause ? `
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #7C3AED;"></div>
                        Eradication & Root Cause Analysis
                    </div>
                    
                    ${eradication_timestamp ? `
                    <div class="info-box" style="margin-bottom: 16px;">
                        <h4>Eradication Completed</h4>
                        <p>${formatDate(eradication_timestamp)}</p>
                    </div>` : ''}
                    
                    ${root_cause ? `
                    <div class="content-block">
                        <h4>Root Cause Analysis</h4>
                        <p>${root_cause}</p>
                    </div>` : ''}
                    
                    ${eradication_actions ? `
                    <div class="content-block">
                        <h4>Eradication Actions</h4>
                        <p>${eradication_actions}</p>
                    </div>` : ''}
                    
                    ${tools_used ? `
                    <div class="content-block">
                        <h4>Tools & Commands Used</h4>
                        <p>${tools_used}</p>
                    </div>` : ''}
                    
                    ${iocs_identified ? `
                    <div class="content-block">
                        <h4>Indicators of Compromise (IOCs)</h4>
                        <p>${iocs_identified}</p>
                    </div>` : ''}
                    
                    ${patches_applied ? `
                    <div class="content-block">
                        <h4>Patches & Configuration Changes</h4>
                        <p>${patches_applied}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- Recovery -->
            ${systems_restored || recovery_timestamp ? `
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #F59E0B;"></div>
                        Recovery & System Restoration
                    </div>
                    
                    <div class="grid">
                        ${recovery_timestamp ? `
                        <div class="info-box">
                            <h4>Recovery Completed</h4>
                            <p>${formatDate(recovery_timestamp)}</p>
                        </div>` : ''}
                        
                        ${return_to_service ? `
                        <div class="info-box">
                            <h4>Return to Service</h4>
                            <p>${formatDate(return_to_service)}</p>
                        </div>` : ''}
                    </div>
                    
                    ${systems_restored ? `
                    <div class="content-block">
                        <h4>Systems Restored</h4>
                        <p>${systems_restored}</p>
                    </div>` : ''}
                    
                    ${verification_steps ? `
                    <div class="content-block">
                        <h4>Verification Steps</h4>
                        <p>${verification_steps}</p>
                    </div>` : ''}
                    
                    ${monitoring_enabled ? `
                    <div class="content-block">
                        <h4>Enhanced Monitoring Enabled</h4>
                        <p>${monitoring_enabled}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- Lessons Learned -->
            ${lessons_learned || action_items_generated ? `
            <div class="card">
                <div class="phase-section">
                    <div class="phase-title">
                        <div class="phase-icon" style="background-color: #28A745;"></div>
                        Lessons Learned & Documentation
                    </div>
                    
                    ${lessons_learned ? `
                    <div class="content-block">
                        <h4>Lessons Learned</h4>
                        <p>${lessons_learned}</p>
                    </div>` : ''}
                    
                    ${action_items_generated ? `
                    <div class="content-block">
                        <h4>Action Items Generated</h4>
                        <p>${action_items_generated}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- Performance Metrics -->
            ${(mttr_minutes || mttd_minutes || closed_timestamp) ? `
            <div class="card">
                <h2 class="section-title">Performance Metrics</h2>
                <div class="metrics-grid">
                    ${mttr_minutes ? `
                    <div class="metric-item">
                        <span class="metric-value">${Math.round(mttr_minutes / 60)}h ${mttr_minutes % 60}m</span>
                        <div class="metric-label">MTTR</div>
                    </div>` : ''}
                    
                    ${mttd_minutes ? `
                    <div class="metric-item">
                        <span class="metric-value">${Math.round(mttd_minutes / 60)}h ${mttd_minutes % 60}m</span>
                        <div class="metric-label">MTTD</div>
                    </div>` : ''}
                    
                    ${closed_timestamp ? `
                    <div class="metric-item">
                        <span class="metric-value">${formatDate(closed_timestamp)}</span>
                        <div class="metric-label">Closed</div>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <div class="footer">
                <p>This report was generated by <strong>FortiGap</strong> - Professional Cybersecurity Assessment Platform</p>
                <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });
    
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    await base44.auth.me();

    const { incidentId } = await req.json();
    if (!incidentId) {
      return new Response(JSON.stringify({ error: 'incidentId is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const incident = await base44.entities.Incident.get(incidentId);
    if (!incident) {
      return new Response(JSON.stringify({ error: 'Incident not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const htmlContent = getIncidentReportHtml(incident);
      
    return new Response(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate report', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});