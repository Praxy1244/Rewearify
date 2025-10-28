import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

const Progress = React.forwardRef(({ 
  className, 
  value, 
  variant = "default", 
  showValue = false,
  size = "default",
  ...props 
}, ref) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 [&>div]:bg-green-600";
      case "warning":
        return "bg-yellow-100 [&>div]:bg-yellow-600";
      case "danger":
        return "bg-red-100 [&>div]:bg-red-600";
      case "info":
        return "bg-blue-100 [&>div]:bg-blue-600";
      case "gradient":
        return "bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-indigo-600";
      default:
        return "bg-primary/20 [&>div]:bg-primary";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm": return "h-1";
      case "lg": return "h-3";
      case "xl": return "h-4";
      default: return "h-2";
    }
  };

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full",
          getSizeStyles(),
          getVariantStyles(),
          className
        )}
        {...props}>
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
      </ProgressPrimitive.Root>
      {showValue && (
        <span className="absolute right-0 -top-6 text-xs font-medium">
          {value}%
        </span>
      )}
    </div>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
