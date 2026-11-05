import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black text-[10px] font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] select-none transition-all",
  {
    variants: {
      variant: {
        default: "bg-[#ffdb1f] text-[#101010]",
        strongMatch: "bg-[#b9f4a8] text-[#101010]",
        partialMatch: "bg-[#ffdb1f] text-[#101010]",
        weakMatch: "bg-[#ff4b3e] text-white",
        info: "bg-[#a8d8ff] text-[#101010]",
        pink: "bg-[#ff72b6] text-[#101010]",
        purple: "bg-[#7c3aed] text-white",
        outline:
          "bg-white dark:bg-[#1c1d22] text-black dark:text-[#e3e2e6] dark:border-[#383a45]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

