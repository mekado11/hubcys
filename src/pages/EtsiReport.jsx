
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EtsiAssessment } from '@/entities/EtsiAssessment'; // Updated import statement
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Printer, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Fix: Explicitly use EtsiAssessment
const EtsiEntity = EtsiAssessment;

const provisionTitles = {
    "5.1.1": "No universal default passwords", "5.1.2": "Secure password generation", "5.1.3": "Best practice crypto for auth",
    "5.1.4": "Easy change of auth value", "5.1.5": "Brute-force protection", "5.2.1": "Public vulnerability disclosure policy",
    "5.2.2": "Timely action on vulnerabilities", "5.2.3": "Continuous vulnerability monitoring", "5.3.1": "Software securely updateable",
    "5.3.2": "Secure update mechanism", "5.3.3": "Updates simple to apply", "5.3.7": "Best practice crypto for updates",
    "5.3.8": "Timely security updates", "5.3.10": "Verify update authenticity", "5.3.13": "Publish support period",
    "5.3.16": "Recognizable model designation", "5.4.1": "Securely store sensitive params", "5.4.3": "No hard-coded credentials",
    "5.4.4": "Unique credentials per device", "5.5.1": "Best practice crypto for communication", "5.5.6": "Encrypt critical params in transit",
    "5.5.7": "Protect confidentiality of critical params", "5.6.2": "Minimize unauth information disclosure", "5.7.1": "Verify software integrity (secure boot)",
    "5.7.2": "Alert on unauthorized software change", "5.8.1": "Confidentiality of personal data in transit", "5.8.2": "Confidentiality of sensitive personal data",
    "5.11.1": "Easy user data erasure from device", "5.11.2": "Easy user data deletion from services", "6.1": "Transparent info on personal data",
    "6.2": "Obtain valid consent for data processing", "6.4": "Limit personal data processing", "6.5": "Inform user on telemetry data collection"
};

const PROVISION_KEYS = Object.keys(provisionTitles).map(key => `provision_${key.replace(/\./g, '_')}`);

const COLORS = {
  compliant: '#22c55e', // green-500
  non_compliant: '#ef4444', // red-500
  not_applicable: '#6b7280', // gray-500
  not_assessed: '#374151' // gray-700
};

export default function EtsiReportPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [complianceScore, setComplianceScore] = useState(0);

    useEffect(() => {
        const assessmentId = new URLSearchParams(location.search).get('id');
        if (!assessmentId) {
            toast.error("No assessment ID provided.");
            navigate(createPageUrl("Assessment"));
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                // The 'get' method is now confidently called on EtsiAssessment
                const data = await EtsiEntity.get(assessmentId);
                setAssessment(data);

                // Calculate stats
                let compliantCount = 0;
                let nonCompliantCount = 0;
                let notApplicableCount = 0;
                let notAssessedCount = 0;
                let totalApplicable = 0;

                PROVISION_KEYS.forEach(key => {
                    const status = data[key];
                    if (status === 'compliant') {
                        compliantCount++;
                        totalApplicable++;
                    } else if (status === 'non_compliant') {
                        nonCompliantCount++;
                        totalApplicable++;
                    } else if (status === 'not_applicable') {
                        notApplicableCount++;
                    } else {
                        notAssessedCount++;
                        totalApplicable++; // Count not-assessed as applicable for score calculation
                    }
                });

                const score = totalApplicable > 0 ? Math.round((compliantCount / totalApplicable) * 100) : 0;
                setComplianceScore(score);

                setChartData([
                    { name: 'Compliant', value: compliantCount, color: COLORS.compliant },
                    { name: 'Non-Compliant', value: nonCompliantCount, color: COLORS.non_compliant },
                    { name: 'Not Applicable', value: notApplicableCount, color: COLORS.not_applicable },
                    { name: 'Not Assessed', value: notAssessedCount, color: COLORS.not_assessed }
                ].filter(d => d.value > 0));

            } catch (error) {
                console.error("Failed to load report data:", error);
                toast.error("Failed to load report data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [location.search, navigate]);

    if (loading) {
        return <div className="min-h-screen cyber-gradient flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-400" /></div>;
    }

    if (!assessment) {
        return <div className="min-h-screen cyber-gradient flex items-center justify-center text-white text-xl">Report not found.</div>;
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'compliant': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'non_compliant': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            default: return <HelpCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="min-h-screen cyber-gradient p-4 sm:p-6 lg:p-8 print:p-0">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center print:hidden">
                    <Button variant="outline" onClick={() => navigate(createPageUrl("EtsiAssessment", { id: assessment.id }))} className="border-gray-600 text-gray-300">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessment
                    </Button>
                    <h1 className="text-2xl font-bold text-cyan-300">ETSI EN 303 645 Compliance Report</h1>
                    <Button onClick={() => window.print()} className="bg-cyan-600 hover:bg-cyan-700">
                        <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                    </Button>
                </div>

                {/* Report Body */}
                <div className="bg-slate-900/80 p-8 rounded-lg border border-slate-700 printable-area">
                    {/* Report Header for printing */}
                    <div className="hidden print:block mb-8 text-center">
                        <h1 className="text-3xl font-bold text-cyan-400">ETSI EN 303 645 Compliance Report</h1>
                        <p className="text-gray-300">Generated by Fortigap</p>
                    </div>

                    {/* Product & Summary */}
                    <Card className="bg-slate-800/50 border-slate-700 text-white mb-6">
                        <CardHeader>
                            <CardTitle>{assessment.product_name}</CardTitle>
                            <CardDescription className="text-gray-400">
                                {assessment.manufacturer_name} - {assessment.product_category?.replace(/_/g, ' ')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-300 mb-2">Overall Score</h3>
                                <div className="text-5xl font-bold text-white">{complianceScore}%</div>
                                <p className="text-gray-400">Based on applicable provisions</p>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Provisions */}
                    <h2 className="text-xl font-bold text-white mt-8 mb-4">Detailed Provision Status</h2>
                    <div className="space-y-4">
                        {PROVISION_KEYS.map(key => {
                            const status = assessment[key];
                            const detail = assessment[`${key}_detail`];
                            const provisionNumber = key.replace('provision_', '').replace(/_/g, '.');

                            return (
                                <div key={key} className="p-4 rounded-lg border bg-slate-800/50" style={{ borderColor: COLORS[status] || COLORS.not_assessed }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{provisionNumber} - {provisionTitles[provisionNumber]}</h4>
                                            {detail && <p className="text-sm text-gray-400 mt-1">{detail}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 capitalize" style={{ color: COLORS[status] || COLORS.not_assessed }}>
                                            {getStatusIcon(status)}
                                            <span>{status?.replace(/_/g, ' ') || 'Not Assessed'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
