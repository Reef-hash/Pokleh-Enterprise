import React from "react";
import { BRANDING, LOGO_SIZES, type LogoVariant } from "@/lib/branding";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  showText?: boolean;
}

const textColors: Record<LogoVariant, string> = {
  icon: "text-primary",
  full: "text-foreground",
  splash: "text-primary",
};

const bgSizes: Record<LogoVariant, string> = {
  icon: "w-8 h-8",
  full: "w-8 h-8",
  splash: "w-24 h-24",
};

const textSizes: Record<LogoVariant, string> = {
  icon: "text-sm",
  full: "text-lg",
  splash: "text-3xl",
};

export const Logo = ({ variant = "full", className, showText = true }: LogoProps) => {
  const size = LOGO_SIZES[variant];
  const initials = BRANDING.shortName.charAt(0);

  // Try image-based logo first, fall back to text logo
  const imgSrc = BRANDING.assets.logoSvg;
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          bgSizes[variant],
          imgError || !imgSrc ? "bg-primary" : "bg-transparent"
        )}
      >
        {!imgError && imgSrc ? (
          <img
            src={imgSrc}
            alt={BRANDING.shortName}
            width={size.width}
            height={size.height}
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={cn("font-bold", textSizes[variant], textColors[variant], "text-primary-foreground")}>
            {initials}
          </span>
        )}
      </div>
      {showText && variant !== "icon" && (
        <span className={cn("font-bold", textSizes[variant], textColors[variant])}>
          {variant === "full" ? BRANDING.shortName : BRANDING.appName}
        </span>
      )}
    </div>
  );
};

