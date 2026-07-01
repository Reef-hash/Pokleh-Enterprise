import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Droplet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/lib/i18n";
import type { Truck, ProductType } from "@/types/pokleh";
import { PRODUCT_TYPES } from "@/types/pokleh";

interface RecordWastageFormProps {
  trucks: Truck[];
  onSubmit: (data: {
    truck_id: string;
    product_type: string;
    quantity_wasted: number;
    waste_date: string;
    notes?: string;
  }) => Promise<{ success: boolean }>;
  isLoading?: boolean;
}

export const RecordWastageForm = ({ trucks, onSubmit, isLoading }: RecordWastageFormProps) => {
  const { t } = useLanguage();
  const [truckId, setTruckId] = useState("");
  const [productType, setProductType] = useState<ProductType>("Air Batu Besar");
  const [quantity, setQuantity] = useState("");
  const [wasteDate, setWasteDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckId || !quantity || !wasteDate) return;

    setSubmitting(true);
    const result = await onSubmit({
      truck_id: truckId,
      product_type: productType,
      quantity_wasted: parseInt(quantity),
      waste_date: wasteDate,
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      setTruckId("");
      setProductType("Air Batu Besar");
      setQuantity("");
      setWasteDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          {t('stock.record-wastage')}
        </CardTitle>
        <CardDescription>
          {t('stock.wastage-subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('stock.wastage-subtitle')}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck">{t('common.truck')}</Label>
              <Select value={truckId} onValueChange={setTruckId}>
                <SelectTrigger id="truck">
                  <SelectValue placeholder={t('common.select-truck')} />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">{t('sales.product-type')}</Label>
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger id="product">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('stock.quantity-pax')}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t('common.date')}</Label>
              <Input
                id="date"
                type="date"
                value={wasteDate}
                onChange={(e) => setWasteDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('common.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Melted due to sun, cracked during transport"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={!truckId || !quantity || submitting || isLoading} className="w-full">
            {submitting ? t('common.loading') : t('stock.record-wastage')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
