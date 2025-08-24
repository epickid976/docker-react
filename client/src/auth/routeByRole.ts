// src/auth/routeByRole.ts
export function routeByRole(role: string | null) {
  if (role === "SYSTEM_ADMIN") return "/admin";
  if (role === "INSTITUTION_ADMIN" || role === "TEACHER") return "/dashboard";
  if (role === "PARENT") return "/parent";
  return "/auth";
}