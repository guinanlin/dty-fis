import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function getErrorMessage(error: unknown): string {
  const value = error as { detail?: unknown; reason?: unknown };
  const detail = value?.detail ?? value;
  if (Array.isArray(detail)) return detail.map((item) => (item as { msg?: string }).msg ?? "请求参数错误").join("；");
  if (typeof detail === "string") return ({ LOGIN_BAD_CREDENTIALS: "账号或密码错误", REGISTER_USER_ALREADY_EXISTS: "该邮箱已被注册", USER_NOT_VERIFIED: "账号未验证", INVALID_TOKEN: "重置链接无效或已过期" } as Record<string, string>)[detail] ?? detail;
  if (detail && typeof detail === "object" && typeof (detail as { reason?: unknown }).reason === "string") return (detail as { reason: string }).reason;
  if (error instanceof Error) return error.message || "网络异常，请稍后重试";
  return "请求失败，请稍后重试";
}
