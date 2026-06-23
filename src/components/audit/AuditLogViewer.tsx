import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLog } from "@/types/pokleh";

const ENTITIES = [
  "all", "sales", "debt_ledger", "debt_collection", "stock_intake",
  "stock_distribution", "stock_return", "supplier_settlements", "expenses"
];

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (filterEntity !== "all") {
          query = query.eq("entity", filterEntity);
        }
        const { data, error } = await query;
        if (error) throw error;
        setLogs((data || []) as unknown as AuditLog[]);
      } catch {
        // offline fallback
      }
    };
    fetchLogs().finally(() => setLoading(false));
  }, [filterEntity]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">Immutable record of all data changes (admin only)</p>
      </div>

      <div className="w-64 space-y-2">
        <Label>Filter by Entity</Label>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENTITIES.map((e) => (
              <SelectItem key={e} value={e}>{e === "all" ? "All Entities" : e.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({logs.length})</CardTitle>
          <CardDescription>All changes tracked via database triggers</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-sm">{log.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${
                        log.action === "INSERT" ? "text-green-600" :
                        log.action === "UPDATE" ? "text-blue-600" :
                        log.action === "DELETE" ? "text-destructive" : ""
                      }`}>{log.action}</span>
                    </TableCell>
                    <TableCell className="text-sm">{log.entity.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{log.entity_id.slice(0, 8)}...</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit logs found</p>
            ) : (
              logs.map((log) => (
                <ResponsiveCard key={log.id}>
                  <ResponsiveRow label="Timestamp">{new Date(log.created_at).toLocaleString()}</ResponsiveRow>
                  <ResponsiveRow label="User">{log.user_id.slice(0, 8)}...</ResponsiveRow>
                  <ResponsiveRow label="Action">
                    <span className={`text-sm font-medium ${
                      log.action === "INSERT" ? "text-green-600" :
                      log.action === "UPDATE" ? "text-blue-600" :
                      log.action === "DELETE" ? "text-destructive" : ""
                    }`}>{log.action}</span>
                  </ResponsiveRow>
                  <ResponsiveRow label="Entity">{log.entity.replace(/_/g, " ")}</ResponsiveRow>
                  <ResponsiveRow label="Entity ID" className="text-xs text-muted-foreground font-mono">{log.entity_id.slice(0, 8)}...</ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
