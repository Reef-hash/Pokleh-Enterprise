import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * NumberInput - Shows numeric keypad on mobile
 */
export const NumberInput = React.forwardRef<
  HTMLInputElement,
  MobileInputProps
>(({ label, error, helperText, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <Label className="text-sm font-medium">{label}</Label>
    )}
    <Input
      ref={ref}
      type="number"
      inputMode="numeric"
      className={cn(
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
    {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
  </div>
));
NumberInput.displayName = "NumberInput";

/**
 * PhoneInput - Shows phone keypad on mobile
 */
export const PhoneInput = React.forwardRef<
  HTMLInputElement,
  MobileInputProps
>(({ label, error, helperText, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <Label className="text-sm font-medium">{label}</Label>
    )}
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      placeholder="01234567890"
      className={cn(
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
    {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
  </div>
));
PhoneInput.displayName = "PhoneInput";

/**
 * QuantityInput - Number input with +/- buttons (optimized for PAX, quantities)
 */
interface QuantityInputProps extends Omit<MobileInputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const QuantityInput = React.forwardRef<
  HTMLInputElement,
  QuantityInputProps
>(
  (
    {
      label,
      error,
      helperText,
      className,
      min = 0,
      max,
      step = 1,
      value,
      onIncrement,
      onDecrement,
      onChange,
      ...props
    },
    ref
  ) => {
    const numValue = Number(value) || 0;

    const handleIncrement = () => {
      if (max && numValue >= max) return;
      onIncrement?.();
      const newValue = numValue + (step || 1);
      onChange?.({
        target: { value: String(newValue) },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleDecrement = () => {
      if (numValue <= min) return;
      onDecrement?.();
      const newValue = Math.max(min, numValue - (step || 1));
      onChange?.({
        target: { value: String(newValue) },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className="space-y-1">
        {label && (
          <Label className="text-sm font-medium">{label}</Label>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            disabled={numValue <= min}
            className="h-9 w-9 sm:h-10 sm:w-10 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            ref={ref}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            className={cn(
              "text-center",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            disabled={max !== undefined && numValue >= max}
            className="h-9 w-9 sm:h-10 sm:w-10 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);
QuantityInput.displayName = "QuantityInput";

/**
 * CurrencyInput - Shows currency value nicely formatted
 */
export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  MobileInputProps & { currency?: string }
>(({ label, error, helperText, className, currency = "RM", ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <Label className="text-sm font-medium">{label}</Label>
    )}
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        {currency}
      </span>
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        className={cn(
          "pl-10",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        step="0.01"
        {...props}
      />
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
    {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
  </div>
));
CurrencyInput.displayName = "CurrencyInput";
