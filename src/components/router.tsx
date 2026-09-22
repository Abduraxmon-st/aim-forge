"use client";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes } from "react";
import { localizeHref, splitLocalizedPath } from "../i18n/languages";
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  end?: boolean;
};
export function Link({ to, end: _end, ...props }: Props) {
  const locale = useRouteLocale();
  return <NextLink href={localizeHref(to, locale)} {...props} />;
}
export function useRouteLocale() {
  return splitLocalizedPath(usePathname() || "/").locale;
}
export function NavLink({ to, end, ...props }: Props) {
  const path = splitLocalizedPath(usePathname() || "/").path;
  const active = end ? path === to : path.startsWith(to);
  return (
    <Link
      {...props}
      to={to}
      className={(props.className ?? "") + (active ? " active" : "")}
    />
  );
}
export function useNavigate() {
  const r = useRouter();
  const locale = useRouteLocale();
  return (to: string) => r.push(localizeHref(to, locale));
}
