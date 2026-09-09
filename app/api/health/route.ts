import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    application: "mestre-da-colorimetria",
    status: "ok",
  });
}
