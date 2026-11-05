"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono font-black uppercase tracking-wider transition-all cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffdb1f]",
  {
    variants: {
      variant: {
        default:
          "bg-[#ffdb1f] text-[#101010] border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000]",
        secondary:
          "bg-[#a8d8ff] text-[#101010] border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000]",
        outline:
          "bg-white dark:bg-[#1c1d22] text-black dark:text-white border-2 border-black dark:border-[#383a45] shadow-[2px_2px_0px_#000000] hover:bg-[#f1f5f9] dark:hover:bg-[#292a2d] hover:translate-x-0.5 hover:translate-y-0.5",
        ghost:
          "bg-transparent text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border-2 border-transparent",
        destructive:
          "bg-[#ff4b3e] text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000]",
        success:
          "bg-[#b9f4a8] text-[#101010] border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000]",
        purple:
          "bg-[#7c3aed] text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#6d28d9] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000]",
      },
      size: {
        default: "h-10 px-4 py-2 text-xs",
        sm: "h-8 px-3 py-1 text-[11px]",
        lg: "h-12 px-6 py-3 text-sm font-black",
        icon: "h-10 w-10 p-0 shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

