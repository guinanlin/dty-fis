import { register } from "@/components/actions/auth-action";
import { register as apiRegister } from "../app/clientService";
jest.mock("../app/clientService", () => ({ register: jest.fn() }));
describe("register action", () => { beforeEach(() => jest.clearAllMocks());
  it("sends the complete backend registration body", async () => { (apiRegister as jest.Mock).mockResolvedValue({ data: {} }); const input = { username: "alice", phone: "13800000000", email: "a@example.com", password: "Password1!" }; await expect(register(input)).resolves.toEqual({ ok: true }); expect(apiRegister).toHaveBeenCalledWith({ body: { ...input, nickname: "alice" } }); });
  it("returns duplicate username/email/phone reasons", async () => { (apiRegister as jest.Mock).mockResolvedValue({ error: { detail: { code: "REGISTER_USERNAME_EXISTS", reason: "该用户名已被注册" } } }); await expect(register({ username: "alice", phone: "13800000000", email: "a@example.com", password: "Password1!" })).resolves.toEqual({ ok: false, error: "该用户名已被注册" }); });
  it("returns backend validation text", async () => { (apiRegister as jest.Mock).mockResolvedValue({ error: { detail: "该邮箱已被注册" } }); await expect(register({ username: "alice", phone: "13800000000", email: "a@example.com", password: "Password1!" })).resolves.toEqual({ ok: false, error: "该邮箱已被注册" }); });
  it("handles transport errors", async () => { (apiRegister as jest.Mock).mockRejectedValue(new Error("Network error")); await expect(register({ username: "alice", phone: "13800000000", email: "a@example.com", password: "Password1!" })).resolves.toEqual({ ok: false, error: "Network error" }); });
});
