import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { Trash2, Shield, UserCog, Calendar, Mail } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";

interface StaffAccount {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
}

export const StaffAccountManagement = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStaff((data || []) as StaffAccount[]);
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchStaff().finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirmId || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: deleteConfirmId });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    setStaff((prev) => prev.filter((s) => s.user_id !== deleteConfirmId));
    setDeleteConfirmId(null);
    setSubmitting(false);
    toast.success(t('staff.success-delete'));
  };

  if (loading) return <PageLoader />;

  const admins = staff.filter((s) => s.role === "admin");
  const staffMembers = staff.filter((s) => s.role === "staff");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('staff.title')}</h2>
        <p className="text-muted-foreground">{t('staff.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('staff.administrators').replace('{count}', admins.length.toString())}</CardTitle>
          <CardDescription>{t('staff.admin-desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.role')}</TableHead>
                  <TableHead>{t('common.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />{a.name}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell><span className="text-primary font-medium">{t('common.admin')}</span></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {admins.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('empty.no-administrators')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="block md:hidden space-y-3">
            {admins.map((a) => (
              <ResponsiveCard key={a.id}>
                <div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-primary" /><span className="font-medium">{a.name}</span></div>
                <ResponsiveRow label={t('common.email')}>{a.email}</ResponsiveRow>
                <ResponsiveRow label={t('common.role')}><span className="text-primary font-medium">{t('common.admin')}</span></ResponsiveRow>
                <ResponsiveRow label={t('common.created')}>{new Date(a.created_at).toLocaleDateString()}</ResponsiveRow>
              </ResponsiveCard>
            ))}
            {admins.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">{t('empty.no-administrators')}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('staff.members').replace('{count}', staffMembers.length.toString())}</CardTitle>
          <CardDescription>{t('staff.members-desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.role')}</TableHead>
                  <TableHead>{t('common.created')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium"><span className="flex items-center gap-2"><UserCog className="h-4 w-4 text-muted-foreground" />{s.name}</span></TableCell>
                    <TableCell><span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{s.email}</span></TableCell>
                    <TableCell>{t('common.staff')}</TableCell>
                    <TableCell className="text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(s.created_at).toLocaleDateString()}</span></TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={s.user_id === currentUser?.id}
                        onClick={() => setDeleteConfirmId(s.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {staffMembers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('empty.no-staff')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="block md:hidden space-y-3">
            {staffMembers.map((s) => (
              <ResponsiveCard key={s.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2"><UserCog className="h-4 w-4 text-muted-foreground" />{s.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 w-8 p-0"
                    disabled={s.user_id === currentUser?.id}
                    onClick={() => setDeleteConfirmId(s.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <ResponsiveRow label={t('common.email')}>{s.email}</ResponsiveRow>
                <ResponsiveRow label={t('common.role')}>{t('common.staff')}</ResponsiveRow>
                <ResponsiveRow label={t('common.created')}>{new Date(s.created_at).toLocaleDateString()}</ResponsiveRow>
              </ResponsiveCard>
            ))}
            {staffMembers.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">{t('empty.no-staff')}</p>}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('staff.confirm-delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('staff.confirm-delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive text-destructive-foreground">
              {submitting ? t('staff.deleting') : t('staff.delete-account')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
