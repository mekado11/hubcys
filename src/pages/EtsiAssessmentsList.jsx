
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EtsiAssessment } from '@/entities/EtsiAssessment'; // Fixed import: now a named export
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ArrowLeft, FileText, Edit } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'react-hot-toast';

export default function EtsiAssessmentsListPage() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const user = await User.me();
                setCurrentUser(user);

                // CRITICAL FIX: Ensure user and company_id exist before filtering
                if (!user || !user.company_id) {
                    console.warn("User or Company ID not found. Cannot load ETSI assessments.");
                    setAssessments([]); // Ensure it's an empty array for the UI
                    setLoading(false);
                    return; // Stop execution
                }

                const data = await EtsiAssessment.filter({ company_id: user.company_id }, '-updated_date', 50);
                setAssessments(data || []); // Ensure data is an array even if filter returns null
            } catch (error) {
                console.error("Failed to load ETSI assessments:", error);
                toast.error("Failed to load assessments.");
                setAssessments([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-500/20 text-green-300">Completed</Badge>;
            case 'in_progress': return <Badge className="bg-yellow-500/20 text-yellow-300">In Progress</Badge>;
            case 'draft':
            default:
                return <Badge className="bg-gray-500/20 text-gray-300">Draft</Badge>;
        }
    };
    
    const calculateComplianceScore = (assessment) => {
        const provisionKeys = Object.keys(assessment).filter(k => k.startsWith('provision_') && !k.endsWith('_detail'));
        const applicableProvisions = provisionKeys.filter(key => assessment[key] !== 'not_applicable');
        const compliantProvisions = applicableProvisions.filter(key => assessment[key] === 'compliant');

        if (applicableProvisions.length === 0) return 'N/A';
        
        const score = Math.round((compliantProvisions.length / applicableProvisions.length) * 100);
        return `${score}%`;
    };

    return (
        <div className="min-h-screen cyber-gradient p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Button variant="ghost" onClick={() => navigate(createPageUrl("Assessment"))} className="text-gray-300 hover:text-white mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Assessments
                        </Button>
                        <h1 className="text-3xl font-bold text-cyan-300">ETSI EN 303 645 Assessments</h1>
                        <p className="text-gray-400 mt-1">Manage and review your Consumer IoT product security assessments.</p>
                    </div>
                    <Button onClick={() => navigate(createPageUrl("EtsiAssessment"))}>
                        <Plus className="w-4 h-4 mr-2" />
                        New IoT Assessment
                    </Button>
                </div>

                <Card className="glass-effect border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white">Assessed Products</CardTitle>
                        <CardDescription className="text-gray-400">A list of all IoT products assessed against the ETSI standard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-white">Product Name</TableHead>
                                        <TableHead className="text-white">Category</TableHead>
                                        <TableHead className="text-white">Compliance Score</TableHead>
                                        <TableHead className="text-white">Status</TableHead>
                                        <TableHead className="text-white text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assessments.length > 0 ? (
                                        assessments.map(item => (
                                            <TableRow key={item.id} className="border-slate-800">
                                                <TableCell className="font-medium text-white">{item.product_name || 'Untitled Assessment'}</TableCell>
                                                <TableCell className="text-gray-300">{item.product_category?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                                                <TableCell className="text-cyan-300 font-semibold">{calculateComplianceScore(item)}</TableCell>
                                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("EtsiAssessment", { id: item.id }))} title="Edit">
                                                        <Edit className="w-4 h-4 text-gray-400 hover:text-cyan-300" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("EtsiReport", { id: item.id }))} title="View Report">
                                                        <FileText className="w-4 h-4 text-gray-400 hover:text-cyan-300" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-400 h-24">
                                                No ETSI assessments found. Start by creating a new one.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
