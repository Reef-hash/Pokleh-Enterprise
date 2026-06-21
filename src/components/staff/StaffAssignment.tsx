import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useAreas } from "@/hooks/useAreas";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/pokleh";

interface StaffAssignmentProps {
  userRole: "admin" | "staff";
}

export const StaffAssignment = ({ userRole }: StaffAssignmentProps) => {
  const { assignments, loading, assignStaff, endAssignment } = useStaffAssignments();
  const { areas } = useAreas();
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "staff")
      .order("name")
      .then(({ data }) => setStaffList((data || []) as Profile[]));
  }, []);

  const active = assignments.filter((a) => !a.ended_date);

  const handleAssign = async () => {
    if (!selectedStaff || !selectedArea) return;
    await assignStaff(selectedStaff, selectedArea);
    setSelectedStaff("");
    setSelectedArea("");
    setIsOpen(false);
  };

  if (userRole !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Areas</CardTitle>
          <CardDescription>Areas you are assigned to</CardDescription>
        </CardHeader>
        <CardContent>
          {active
            .filter((a) => a.staff_id === "") // Will be populated by the hook
            .length === 0 ? (
            <p className="text-muted-foreground">Loading assignments...</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Assignments</h2>
          <p className="text-muted-foreground">Assign staff members to delivery areas</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Assign Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Assignments ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.profile?.name || a.staff_id}</TableCell>
                  <TableCell><Badge variant="secondary">{a.area?.name}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(a.assigned_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => endAssignment(a.id)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {active.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No active assignments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Area</DialogTitle>
            <DialogDescription>Assign a staff member to a delivery area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
