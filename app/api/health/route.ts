import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "../../lib/db";

export async function GET() {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    return NextResponse.json(
      {
        status: "Error",
        message: "Database connection failed",
      },
      {
        status: 503,
      },
    );
  }

  return NextResponse.json(
    {
      status: "Success",
      message: "Database connected successfully",
    },
    {
      status: 200,
    },
  );
}
