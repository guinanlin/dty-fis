"use server";
import { resetPassword } from "./auth-action";
export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const result = await resetPassword({ token: String(formData.get("token") ?? ""), password: String(formData.get("password") ?? "") });
  return result.ok ? { message: "密码重置成功" } : { server_error: result.error };
}
export const passwordReset = resetPasswordAction;
export const passwordResetConfirm = resetPasswordAction;
