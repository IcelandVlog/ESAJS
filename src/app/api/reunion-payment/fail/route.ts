import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.redirect(`${req.nextUrl.origin}/reunion?payment=fail`, { status: 303 });
}
