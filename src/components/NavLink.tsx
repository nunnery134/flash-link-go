import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className" | "to"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string; // single input string
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // Determine URL
    const formattedUrl = (() => {
      const trimmed = to.trim();
      if (
        trimmed.endsWith(".com") ||
        trimmed.endsWith(".org") ||
        trimmed.endsWith(".net") ||
        trimmed.endsWith(".io") ||
        trimmed.endsWith(".co") ||
        trimmed.endsWith(".gov")
      ) {
        return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      } else {
        return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
      }
    })();

    return (
      <RouterNavLink
        ref={ref}
        to={formattedUrl}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
