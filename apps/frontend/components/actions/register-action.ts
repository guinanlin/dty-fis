import { register as realRegister } from "./auth-action";
export async function register(_prev: unknown, formData: FormData) {
  const result = await realRegister({ username: String(formData.get("username") ?? ""), phone: String(formData.get("phone") ?? ""), email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") });
  return result.ok ? result : { server_validation_error: result.error };
}
