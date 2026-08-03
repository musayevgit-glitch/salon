import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
export const auth = betterAuth({database:prismaAdapter(prisma,{provider:"postgresql"}),emailAndPassword:{enabled:true},session:{expiresIn:60*60*24*30,updateAge:60*60*24},advanced:{cookiePrefix:"salonomia",ipAddress:{ipAddressHeaders:["x-forwarded-for","x-real-ip"]},defaultCookieAttributes:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"}}});
