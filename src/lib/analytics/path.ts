export function isAdminPath(pathname: string | null | undefined): boolean {
  return pathname === "/admin" || pathname?.startsWith("/admin/") === true;
}
