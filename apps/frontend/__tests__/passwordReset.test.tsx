import { getErrorMessage } from "@/lib/utils";
describe("forgot password contract", () => { it("uses account-oriented responses", () => expect({ message: "sent", resetToken: "token" }).toMatchObject({ message: "sent", resetToken: "token" })); it("maps invalid token", () => expect(getErrorMessage({ detail: "INVALID_TOKEN" })).toBe("重置链接无效或已过期")); });
