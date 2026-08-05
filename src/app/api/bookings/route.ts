import { NextResponse } from "next/server";import { createBooking } from "@/server/booking";
import { checkRateLimit, clientAddress, rateLimitHeaders, rateLimits } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
// A reservation may only be finalized by an authenticated customer — browsing/selecting stays anonymous,
// but this endpoint is the actual "finalize" moment, so it enforces the session server-side too
// (the client already redirects to /login before reaching here; this is defense in depth).
export async function POST(request:Request){const limit=checkRateLimit("booking",clientAddress(request.headers),rateLimits.booking);if(!limit.allowed)return NextResponse.json({code:"RATE_LIMITED"},{status:429,headers:rateLimitHeaders(limit)});const session=await auth.api.getSession({headers:request.headers});if(!session)return NextResponse.json({code:"UNAUTHENTICATED"},{status:401,headers:rateLimitHeaders(limit)});try{const result=await createBooking(await request.json());return NextResponse.json({bookingRef:result.appointment.bookingRef,token:result.manageToken},{status:201,headers:rateLimitHeaders(limit)})}catch(error){const code=error instanceof Error?error.message:"BOOKING_FAILED";const status=code==="DOUBLE_BOOKING_CONFLICT"?409:400;return NextResponse.json({code},{status,headers:rateLimitHeaders(limit)})}}
