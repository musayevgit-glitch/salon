import "server-only";import { headers } from "next/headers";import { redirect } from "next/navigation";import { auth } from "@/lib/auth";import { prisma } from "@/lib/prisma";
export async function requireAuthenticatedUser(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect("/login");return session.user;}
export async function requireSuperAdmin(){const user=await requireAuthenticatedUser();const db=await prisma.user.findUnique({where:{id:user.id}});if(db?.globalRole!=="SUPER_ADMIN")redirect("/");return db;}
export async function requireTenantMembership(roles:("SALON_ADMIN"|"SALON_MANAGER")[]){const user=await requireAuthenticatedUser();const membership=await prisma.membership.findFirst({where:{userId:user.id,active:true,role:{in:roles},salon:{status:"ACTIVE"}},include:{salon:true}});if(membership)return membership;
// Membership exists but the salon was deactivated: make the block visible instead of a silent
// redirect to "/", per the rule that an inactive salon's admin login must be clearly blocked.
const inactiveMembership=await prisma.membership.findFirst({where:{userId:user.id,active:true,role:{in:roles}},include:{salon:true}});
if(inactiveMembership)redirect("/login?blocked=salon_inactive");
redirect("/");}
