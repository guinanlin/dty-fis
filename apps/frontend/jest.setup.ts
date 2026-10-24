Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  act: async (callback: () => void | Promise<void>) => await callback(),
}));
