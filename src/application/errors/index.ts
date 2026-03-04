export class AppError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "BAD_REQUEST"
      | "CONFLICT"
      | "INTERNAL",
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }

  get statusCode(): number {
    const map: Record<AppError["code"], number> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      BAD_REQUEST: 400,
      CONFLICT: 409,
      INTERNAL: 500,
    };
    return map[this.code];
  }
}

export const unauthorized = (msg = "認証が必要です。") => new AppError("UNAUTHORIZED", msg);
export const forbidden = (msg = "権限がありません。") => new AppError("FORBIDDEN", msg);
export const notFound = (msg = "リソースが見つかりません。") => new AppError("NOT_FOUND", msg);
export const badRequest = (msg: string) => new AppError("BAD_REQUEST", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const internal = (msg = "サーバーエラーが発生しました。") => new AppError("INTERNAL", msg);
