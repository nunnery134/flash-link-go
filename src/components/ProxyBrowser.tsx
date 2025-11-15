import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className" | "to"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string | string[]; // allow single or multiple links
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const checkIsActive = (pathname: string) => {
      if (Array.isArray(to)) {
        return to.includes(pathname);
      }
      return pathname === to;
    };

    return (
      <RouterNavLink
        ref={ref}
        to={Array.isArray(to) ? to[0] : to} // use first as `to` prop for Router
        className={({ isActive, isPending, location }) =>
          cn(
            className,
            (isActive || (Array.isArray(to) && checkIsActive(location.pathname))) &&
              activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
