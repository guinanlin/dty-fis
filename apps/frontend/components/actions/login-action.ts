import { login as realLogin } from "./auth-action";
export async function login(_prev: unknown, formData: FormData) {
  const result = await realLogin(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  return result.ok ? result : { server_validation_error: result.error };
}
