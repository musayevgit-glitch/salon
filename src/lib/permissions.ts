import { GlobalRole, MembershipRole } from "@prisma/client";
export const permissions = {
  SUPER_ADMIN: ["platform:read", "salon:suspend"],
  SALON_ADMIN: ["appointments:manage", "salon:manage", "team:manage", "reports:read"],
  SALON_MANAGER: ["appointments:manage", "customers:read", "reports:read"],
  CUSTOMER: ["booking:create", "booking:manage-own"]
} as const;
export function hasPermission(role: GlobalRole | MembershipRole, permission: string) { return (permissions[role] as readonly string[]).includes(permission); }
