import { forgotPassword } from "@/components/actions/auth-action";
import { forgotPassword as apiForgotPassword } from "../app/clientService";
jest.mock("../app/clientService", () => ({ forgotPassword: jest.fn() }));
describe("forgot password action", () => { beforeEach(() => jest.clearAllMocks());
  it("sends account and exposes development reset token", async () => { (apiForgotPassword as jest.Mock).mockResolvedValue({ data: { message: "已发送", reset_token: "token" } }); await expect(forgotPassword("admin")).resolves.toEqual({ message: "已发送", resetToken: "token" }); expect(apiForgotPassword).toHaveBeenCalledWith({ body: { account: "admin" } }); });
  it("preserves anti-enumeration message", async () => { (apiForgotPassword as jest.Mock).mockResolvedValue({ data: { message: "如果该账号存在，重置链接已发送到您的邮箱" } }); await expect(forgotPassword("missing")).resolves.toEqual({ message: "如果该账号存在，重置链接已发送到您的邮箱", resetToken: undefined }); });
  it("maps request errors", async () => { (apiForgotPassword as jest.Mock).mockResolvedValue({ error: { detail: "请求失败" } }); await expect(forgotPassword("admin")).resolves.toEqual({ message: "请求失败" }); });
});
