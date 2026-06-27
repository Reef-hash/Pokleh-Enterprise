import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useTrucks } from "@/hooks/useTrucks";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/pokleh";
import { toast } from "sonner";

interface StaffAssignmentProps {
  userRole: "admin" | "staff";
}

export const StaffAssignment = ({ userRole }: StaffAssignmentProps) => {
  const { assignments, loading, assignStaff, endAssignment } = useStaffAssignments();
  const { trucks } = useTrucks();
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [endConfirmId, setEndConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEndAssignment = async () => {
    if (!endConfirmId || submitting) return;
    setSubmitting(true);
    try {
      const result = await endAssignment(endConfirmId);
      if (result.success) {
        setEndConfirmId(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
    if (!selectedStaff || !selectedTruck || submitting) { toast.error("Please select a staff member and a truck."); return; }
    setSubmitting(true);
    try {
      const result = await assignStaff(selectedStaff, selectedTruck);
      if (result.success) {
        setSelectedStaff("");
        setSelectedTruck("");
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Trucks</CardTitle>
          <CardDescription>Trucks you are assigned to</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading assignments...</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Assignments"
        subtitle="Assign staff members to trucks"
        actionLabel="Assign Staff"
        actionIcon={UserPlus}
        onAction={() => setIsOpen(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Assignments ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.profile?.name || a.staff_id}</TableCell>
                  <TableCell><Badge variant="secondary">{a.truck?.name}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(a.assigned_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEndConfirmId(a.id)} className="text-destructive">
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
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {active.map((a) => (
              <ResponsiveCard key={a.id}>
                <ResponsiveRow label="Staff"><span className="font-medium">{a.profile?.name || a.staff_id}</span></ResponsiveRow>
                <ResponsiveRow label="Truck"><Badge variant="secondary">{a.truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="Assigned Date"><span className="text-muted-foreground">{new Date(a.assigned_date).toLocaleDateString()}</span></ResponsiveRow>
                <div className="flex justify-end pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setEndConfirmId(a.id)} className="text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </ResponsiveCard>
            ))}
            {active.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No active assignments</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Truck</DialogTitle>
            <DialogDescription>Assign a staff member to a truck</DialogDescription>
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
              <Label>Truck</Label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!endConfirmId} onOpenChange={(o) => { if (!o) setEndConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this staff assignment? The staff member will no longer have access to this truck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndAssignment} disabled={submitting} className="bg-destructive text-destructive-foreground">{submitting ? "Ending..." : "End Assignment"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
