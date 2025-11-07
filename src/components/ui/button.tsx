import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-ios shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-ios shadow-sm",
        outline: "border border-input bg-card hover:bg-accent/50 hover:text-accent-foreground rounded-ios",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-ios shadow-sm",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground rounded-ios",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[var(--shadow-strong)] transition-all duration-300 font-semibold rounded-xl",
        ctaOutline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold rounded-xl",
        ctaAmazon: "bg-[hsl(var(--cta-amazon))] hover:bg-[hsl(var(--cta-amazon-hover))] text-black font-bold shadow-[0_2px_5px_0_rgba(213,217,217,.5)] hover:shadow-[0_4px_8px_0_rgba(213,217,217,.7)] border border-[#a88734] hover:border-[#8f7229] transition-all duration-200 rounded-lg",
        ctaUrgent: "bg-gradient-to-r from-[hsl(var(--cta-urgent))] to-[hsl(var(--cta-urgent-hover))] text-white font-bold shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-strong)] hover:scale-105 transition-all duration-300 animate-pulse rounded-lg",
        ctaPremium: "bg-gradient-to-r from-[hsl(var(--cta-premium))] via-[hsl(281_83%_63%)] to-[hsl(var(--cta-premium))] text-white font-bold shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-strong)] transition-all duration-300 bg-[length:200%_auto] hover:bg-right-bottom rounded-xl",
        ctaTrust: "bg-[hsl(var(--cta-trust))] hover:bg-[hsl(var(--cta-trust))]/90 text-white font-semibold shadow-md hover:shadow-lg border-2 border-[hsl(var(--cta-trust))]/20 transition-all duration-200 rounded-md",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-ios px-3 text-ios-callout",
        lg: "h-13 rounded-ios px-8 text-ios-body",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
