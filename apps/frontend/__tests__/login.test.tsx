import { getErrorMessage } from "@/lib/utils";
describe("login auth contract", () => { it("maps bad credentials to Chinese", () => expect(getErrorMessage({ detail: "LOGIN_BAD_CREDENTIALS" })).toBe("账号或密码错误")); it("keeps backend reasons", () => expect(getErrorMessage({ detail: { code: "INVALID_PASSWORD", reason: "密码长度不能少于 6 位" } })).toBe("密码长度不能少于 6 位")); });
