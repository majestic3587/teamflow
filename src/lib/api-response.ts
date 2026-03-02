import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => errorResponse("認証が必要です。", 401);
export const forbidden    = () => errorResponse("権限がありません。", 403);
export const notFound     = () => errorResponse("リソースが見つかりません。", 404);
export const badRequest   = (message: string) => errorResponse(message, 400);
export const serverError  = () => errorResponse("サーバーエラーが発生しました。", 500);
