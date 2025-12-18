import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EtsiAssessmentHeader({ assessment, onSave, saving, onInputChange }) {
  const navigate = useNavigate();

  return (
    <Card className="glass-effect border-cyan-500/30">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="text-2xl font-bold text-cyan-300">ETSI EN 303 645 Assessment</CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                    Evaluate a consumer IoT product against baseline security requirements.
                </CardDescription>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
                <Button variant="outline" onClick={() => navigate(createPageUrl("Assessment"))} className="border-gray-600 text-gray-300">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => navigate(createPageUrl("EtsiReport", { id: assessment.id }))} disabled={!assessment.id}>
                    <FileText className="w-4 h-4 mr-2" /> View Report
                </Button>
                <Button onClick={onSave} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <div className="space-y-2">
            <Label htmlFor="product_name" className="text-gray-300">Product Name</Label>
            <Input
              id="product_name"
              placeholder="e.g., Smart Security Camera v2"
              value={assessment.product_name || ""}
              onChange={(e) => onInputChange('product_name', e.target.value)}
              className="bg-slate-800/50 border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_category" className="text-gray-300">Product Category</Label>
            <Select
              value={assessment.product_category || ""}
              onValueChange={(value) => onInputChange('product_category', value)}
            >
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Smart_Home_Device">Smart Home Device</SelectItem>
                <SelectItem value="Wearable_Health_Tracker">Wearable Health Tracker</SelectItem>
                <SelectItem value="Connected_Appliance">Connected Appliance</SelectItem>
                <SelectItem value="Security_Camera">Security Camera</SelectItem>
                <SelectItem value="Smart_Speaker">Smart Speaker</SelectItem>
                <SelectItem value="Baby_Monitor">Baby Monitor</SelectItem>
                <SelectItem value="Connected_Toy">Connected Toy</SelectItem>
                <SelectItem value="Smart_Lock">Smart Lock</SelectItem>
                <SelectItem value="IoT_Gateway_Hub">IoT Gateway/Hub</SelectItem>
                <SelectItem value="Smart_Thermostat">Smart Thermostat</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturer_name" className="text-gray-300">Manufacturer Name</Label>
            <Input
              id="manufacturer_name"
              placeholder="e.g., SecureHome Inc."
              value={assessment.manufacturer_name || ""}
              onChange={(e) => onInputChange('manufacturer_name', e.target.value)}
              className="bg-slate-800/50 border-gray-600 text-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}