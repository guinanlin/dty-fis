import { registerSchema } from "@/lib/definitions";
describe("register page contract", () => { it("validates username, phone and confirmation", () => expect(registerSchema.safeParse({ username: "alice", phone: "13800000000", email: "a@example.com", password: "Password1!", confirm: "Password1!" }).success).toBe(true)); });
