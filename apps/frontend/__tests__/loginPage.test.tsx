import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import Page from "@/app/login/page";

const mockReplace = jest.fn();
const mockLogin = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) =>
    React.createElement("img", { src: props.src, alt: props.alt }),
}));

jest.mock("../lib/finance/auth-context", () => ({
  useFinApp: () => ({ login: mockLogin }),
}));

function submitLogin() {
  fireEvent.click(screen.getByRole("button", { name: /^登录$/ }));
}

describe("Login Page", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockLogin.mockReset();
  });

  it("renders the password form, illustration, and submit button", () => {
    render(<Page />);

    expect(screen.getByPlaceholderText("账号 / 手机号")).toHaveValue("admin");
    expect(screen.getByPlaceholderText("密码")).toHaveValue("123456");
    expect(screen.getByRole("button", { name: /^登录$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "账号密码登录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "短信验证码登录" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "汤圆财务云端工作台插画" })).toHaveAttribute(
      "src",
      "/images/login-illustration.webp",
    );
    expect(screen.getByRole("heading", { name: /让每个决策/ })).toBeInTheDocument();
  });

  it("calls useFinApp login and opens the dashboard for a single account set", async () => {
    mockLogin.mockResolvedValue([{ id: "a1" }]);

    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("账号 / 手机号"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("密码"), {
      target: { value: "#123176a@" },
    });
    submitLogin();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser@example.com", "#123176a@");
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("opens account-set selection when login returns more than one set", async () => {
    mockLogin.mockResolvedValue([{ id: "a1" }, { id: "a2" }]);

    render(<Page />);
    submitLogin();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin", "123456");
    });
    expect(mockReplace).toHaveBeenCalledWith("/select-account-set");
  });

  it("displays the thrown error message and does not redirect", async () => {
    mockLogin.mockRejectedValue(new Error("账号或密码错误"));

    render(<Page />);
    submitLogin();

    expect(await screen.findByText("账号或密码错误")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("displays a fallback message when login fails without an Error", async () => {
    mockLogin.mockRejectedValue("boom");

    render(<Page />);
    submitLogin();

    expect(await screen.findByText("登录失败")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("submits the sms mode with the fixed verification password", async () => {
    mockLogin.mockResolvedValue([{ id: "a1" }]);

    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "短信验证码登录" }));
    expect(screen.getByPlaceholderText("短信验证码")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("账号 / 手机号"), {
      target: { value: "13800000000" },
    });
    submitLogin();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("13800000000", "123456");
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
