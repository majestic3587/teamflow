import { NextResponse } from "next/server";
import { AppError } from "@/application/errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  console.error("[Unhandled Error]", error);
  return NextResponse.json(
    { error: "サーバーエラーが発生しました。" },
    { status: 500 }
  );
}
