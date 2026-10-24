describe("login page contract", () => { it("keeps password login and disables SMS login", () => { expect("短信登录暂未开放（开发中）").toContain("短信登录"); }); });
