import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '1': '0.25rem',    // 4pt
        '2': '0.5rem',     // 8pt
        '3': '0.75rem',    // 12pt
        '4': '1rem',       // 16pt
        '5': '1.25rem',    // 20pt
        '6': '1.5rem',     // 24pt
        '11': '2.75rem',   // 44pt (iOS touch target)
        '13': '3.25rem',   // 52pt (iOS nav bar desktop)
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: {
            height: "0",
            opacity: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          to: {
            height: "0",
            opacity: "0",
          },
        },
        "spring-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
          "60%": {
            transform: "scale(1.02)",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "spring-out": {
          "0%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
        },
        "slide-up": {
          "0%": {
            transform: "translateY(100%)",
          },
          "100%": {
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "accordion-up": "accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "spring-in": "spring-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-out": "spring-out 0.25s cubic-bezier(0.4, 0, 1, 1)",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
        'xl': '0.75rem',   // 12pt iOS standard
        '2xl': '1rem',     // 16pt
        'ios': '0.625rem', // 10pt iOS input/button
      },
      fontSize: {
        'ios-large-title': ['34px', { lineHeight: '1.2', letterSpacing: '0.374px' }],
        'ios-title1': ['28px', { lineHeight: '1.2', letterSpacing: '0.364px' }],
        'ios-title2': ['22px', { lineHeight: '1.3', letterSpacing: '0.352px' }],
        'ios-title3': ['20px', { lineHeight: '1.3', letterSpacing: '0.38px' }],
        'ios-headline': ['17px', { lineHeight: '1.4', letterSpacing: '-0.408px', fontWeight: '600' }],
        'ios-body': ['17px', { lineHeight: '1.4', letterSpacing: '-0.408px' }],
        'ios-callout': ['16px', { lineHeight: '1.4', letterSpacing: '-0.32px' }],
        'ios-subheadline': ['15px', { lineHeight: '1.4', letterSpacing: '-0.24px' }],
        'ios-footnote': ['13px', { lineHeight: '1.4', letterSpacing: '-0.078px' }],
        'ios-caption1': ['12px', { lineHeight: '1.3' }],
        'ios-caption2': ['11px', { lineHeight: '1.3', letterSpacing: '0.066px' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
