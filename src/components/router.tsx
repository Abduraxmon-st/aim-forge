"use client";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes } from "react";
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  end?: boolean;
};
export function Link({ to, end: _end, ...props }: Props) {
  return <NextLink href={to} {...props} />;
}
export function NavLink({ to, end, ...props }: Props) {
  const path = usePathname().replace(/\/$/, "") || "/";
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
  return (to: string) => r.push(to);
}
