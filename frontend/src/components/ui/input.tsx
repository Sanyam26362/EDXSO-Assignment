import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border-2 border-black dark:border-[#383a45] bg-white dark:bg-[#141518] px-3 py-2 text-xs font-mono text-black dark:text-[#f5f0e7] shadow-[3px_3px_0px_#000000] transition-colors file:border-0 file:bg-transparent file:text-xs file:font-bold file:font-mono placeholder:text-[#888] dark:placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#ffdb1f] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

