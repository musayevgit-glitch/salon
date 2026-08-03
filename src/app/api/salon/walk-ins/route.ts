import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantMembership } from "@/server/authorization";
import { createBooking } from "@/server/booking";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientAddress, rateLimitHeaders, rateLimits } from "@/lib/rate-limit";

const input=z.object({serviceId:z.string().cuid(),providerId:z.string().cuid(),startsAt:z.coerce.date(),customerName:z.string().min(2),customerEmail:z.string().email(),customerPhone:z.string().min(7)});
export async function POST(request:Request){const limit=checkRateLimit("walk-in",clientAddress(request.headers),rateLimits.walkIn);if(!limit.allowed)return NextResponse.json({code:"RATE_LIMITED"},{status:429,headers:rateLimitHeaders(limit)});try{const {salon}=await requireTenantMembership(["SALON_ADMIN","SALON_MANAGER"]);const data=input.parse(await request.json());const result=await createBooking({...data,salonId:salon.id,idempotencyKey:crypto.randomUUID()});await prisma.appointment.update({where:{id:result.appointment.id},data:{status:"CONFIRMED"}});await prisma.auditLog.create({data:{salonId:salon.id,action:"WALK_IN_CREATED",targetType:"Appointment",targetId:result.appointment.id}});return NextResponse.json({bookingRef:result.appointment.bookingRef},{status:201,headers:rateLimitHeaders(limit)})}catch(error){return NextResponse.json({code:error instanceof Error?error.message:"WALK_IN_FAILED"},{status:400,headers:rateLimitHeaders(limit)})}}
