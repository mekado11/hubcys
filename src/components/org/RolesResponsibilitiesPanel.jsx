import React from "react";
import { OrgUnit } from "@/entities/OrgUnit";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrgUnitForm from "./OrgUnitForm";
import OrgUnitList from "./OrgUnitList";
import OrgTree from "./OrgTree";
import { Loader2, Plus } from "lucide-react";

export default function RolesResponsibilitiesPanel() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [units, setUnits] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [editing, setEditing] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const me = await User.me();
    setUser(me);
    const data = await OrgUnit.filter({ company_id: me.company_id }, "order_index", 1000);
    setUnits(data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (values) => {
    setSaving(true);
    await OrgUnit.create({ ...values, company_id: user.company_id });
    setEditing(null);
    await load();
    setSaving(false);
  };

  const handleUpdate = async (id, values) => {
    setSaving(true);
    await OrgUnit.update(id, { ...values, company_id: user.company_id });
    setEditing(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete "${unit.name}" and its hierarchy reference?`)) return;
    await OrgUnit.delete(unit.id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-300">Loading roles & responsibilities...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="glass-effect border-slate-700/50 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-cyan-300">Add / Edit Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgUnitForm
            key={editing ? editing.id : "new"}
            units={units}
            initialUnit={editing}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSubmit={(payload) =>
              editing ? handleUpdate(editing.id, payload) : handleCreate(payload)
            }
          />
        </CardContent>
      </Card>

      <div className="xl:col-span-2 space-y-6">
        <Card className="glass-effect border-slate-700/50">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-cyan-300">Roles & Responsibilities</CardTitle>
            <Button variant="outline" className="border-gray-600 text-gray-300"
              onClick={() => setEditing({
                name: "",
                unit_type: "Engineering",
                description: "",
                responsibilities: [],
                parent_unit_id: "",
                contact_email: "",
                headcount: undefined,
                order_index: undefined,
                enabled: true
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Unit
            </Button>
          </CardHeader>
          <CardContent>
            <OrgUnitList
              units={units}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-cyan-300">Organization Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgTree units={units} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}