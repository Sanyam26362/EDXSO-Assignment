"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  variant?: "yellow" | "purple" | "green" | "gradient" | "red";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, variant = "yellow", ...props }, ref) => {
  const getVariantBg = () => {
    switch (variant) {
      case "purple":
        return "bg-[#7c3aed]";
      case "green":
        return "bg-[#15803d]";
      case "red":
        return "bg-[#ff4b3e]";
      case "gradient":
        return "bg-gradient-to-r from-[#15803d] via-[#ffdb1f] to-[#ff4b3e]";
      case "yellow":
      default:
        return "bg-[#ffdb1f]";
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden border-2 border-black bg-[#e8e3d8] p-0.5 shadow-[2px_2px_0px_#000000]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full border-r-2 border-black transition-all duration-300", getVariantBg(), indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
