import { resetPassword } from "@/components/actions/auth-action";
import { resetPassword as apiResetPassword } from "../app/clientService";
jest.mock("../app/clientService", () => ({ resetPassword: jest.fn() }));
describe("reset password action", () => { beforeEach(() => jest.clearAllMocks());
  it("sends token and password", async () => { (apiResetPassword as jest.Mock).mockResolvedValue({ data: {} }); await expect(resetPassword({ token: "token", password: "Password1!" })).resolves.toEqual({ ok: true }); expect(apiResetPassword).toHaveBeenCalledWith({ body: { token: "token", password: "Password1!" } }); });
  it("maps invalid token", async () => { (apiResetPassword as jest.Mock).mockResolvedValue({ error: { detail: { code: "INVALID_TOKEN", reason: "重置链接无效或已过期" } } }); await expect(resetPassword({ token: "bad", password: "Password1!" })).resolves.toEqual({ ok: false, error: "重置链接无效或已过期" }); });
  it("maps invalid password", async () => { (apiResetPassword as jest.Mock).mockResolvedValue({ error: { detail: { code: "INVALID_PASSWORD", reason: "密码长度不能少于 6 位" } } }); await expect(resetPassword({ token: "token", password: "123" })).resolves.toEqual({ ok: false, error: "密码长度不能少于 6 位" }); });
  it("handles transport errors", async () => { (apiResetPassword as jest.Mock).mockRejectedValue(new Error("Network error")); await expect(resetPassword({ token: "token", password: "Password1!" })).rejects.toThrow("Network error"); });
});
