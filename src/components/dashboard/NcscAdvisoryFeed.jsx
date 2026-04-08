import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { fetchNcscKev } from '@/functions/fetchNcscKev';

export default function NcscAdvisoryFeed() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdvisories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchNcscKev();
        if (response && response.data && Array.isArray(response.data)) {
          setAdvisories(response.data);
        } else {
          console.warn("Unexpected data format from fetchNcscKev:", response.data);
          setAdvisories([]);
        }
      } catch (err) {
        console.error("Error fetching NCSC advisories:", err);
        setError("Could not load NCSC advisories at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisories();
  }, []);

  const getSeverityBadge = (severity) => {
    switch (String(severity).toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-700">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity || 'Unknown'}</Badge>;
    }
  };

  return (
    <Card className="glass-effect h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <img src="https://www.ncsc.gov.uk/assets/images/ncsc-logo-white-2.svg" alt="NCSC logo" className="h-6 mr-3"/>
           UK Threat Advisories
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        )}
        {error && (
          <div className="flex flex-col justify-center items-center h-full text-center text-gray-400">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
            <p className="font-semibold">Error Loading Feed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && advisories.length === 0 && (
            <div className="text-center text-gray-400 py-10">
                <p>No advisories found.</p>
            </div>
        )}
        {!loading && !error && advisories.length > 0 && (
          <ul className="space-y-4">
            {advisories.slice(0, 10).map((advisory, index) => (
              <li key={index} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                <a href={advisory.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="font-semibold text-white mb-1 leading-tight">{advisory.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            {getSeverityBadge(advisory.severity)}
                            <span>{new Date(advisory.dateAdded).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 ml-4 mt-1" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}