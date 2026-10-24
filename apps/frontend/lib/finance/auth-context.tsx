"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { accountSet, auth } from "./service";
import type { AccountSet, Role, User } from "./types";

type UserAccountSet = AccountSet & { role: Role };
type Session = {
  token: string;
  user: User;
  accountSetId?: string;
  period?: { year: number; month: number };
};

interface FinAppContextValue {
  ready: boolean;
  token: string | null;
  currentUser: User | null;
  accountSets: UserAccountSet[];
  currentAccountSet: UserAccountSet | null;
  currentPeriod: { year: number; month: number };
  login: (username: string, password: string) => Promise<UserAccountSet[]>;
  logout: () => Promise<void>;
  selectAccountSet: (id: string) => void;
  setPeriod: (year: number, month: number) => void;
  refreshAccountSets: () => Promise<void>;
  updateCurrentUser: (user: User) => void;
}

const storageKey = "ty-finance-session";
const initialPeriod = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
};
const FinAppContext = createContext<FinAppContextValue | null>(null);

export function FinAppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accountSets, setAccountSets] = useState<UserAccountSet[]>([]);
  const [currentAccountSet, setCurrentAccountSet] =
    useState<UserAccountSet | null>(null);
  const [currentPeriod, setCurrentPeriodState] = useState(initialPeriod);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setReady(true);
      return;
    }
    const session = JSON.parse(raw) as Session;
    setToken(session.token);
    setCurrentUser(session.user);
    setCurrentPeriodState(session.period ?? initialPeriod);
    accountSet
      .listByUser(session.user.id)
      .then((items) => {
        setAccountSets(items);
        setCurrentAccountSet(
          items.find((item) => item.id === session.accountSetId) ?? null,
        );
      })
      .finally(() => setReady(true));
  }, []);

  const persist = (session: Session | null) =>
    session
      ? localStorage.setItem(storageKey, JSON.stringify(session))
      : localStorage.removeItem(storageKey);
  const refreshAccountSets = async () => {
    if (!currentUser) return;
    const items = await accountSet.listByUser(currentUser.id);
    setAccountSets(items);
  };
  const login = async (username: string, password: string) => {
    const result = await auth.login(username, password);
    const items = await accountSet.listByUser(result.user.id);
    setToken(result.token);
    setCurrentUser(result.user);
    setAccountSets(items);
    setCurrentAccountSet(items.length === 1 ? items[0] : null);
    persist({
      token: result.token,
      user: result.user,
      accountSetId: items.length === 1 ? items[0].id : undefined,
      period: items.length === 1 ? items[0].currentPeriod : initialPeriod,
    });
    return items;
  };
  const logout = async () => {
    await auth.logout();
    setToken(null);
    setCurrentUser(null);
    setAccountSets([]);
    setCurrentAccountSet(null);
    persist(null);
  };
  const selectAccountSet = (id: string) => {
    const selected = accountSets.find((item) => item.id === id) ?? null;
    setCurrentAccountSet(selected);
    if (selected) {
      setCurrentPeriodState(selected.currentPeriod);
      if (token && currentUser)
        persist({
          token,
          user: currentUser,
          accountSetId: selected.id,
          period: selected.currentPeriod,
        });
    }
  };
  const setPeriod = (year: number, month: number) => {
    const period = { year, month };
    setCurrentPeriodState(period);
    if (token && currentUser)
      persist({
        token,
        user: currentUser,
        accountSetId: currentAccountSet?.id,
        period,
      });
  };
  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
    if (token)
      persist({
        token,
        user,
        accountSetId: currentAccountSet?.id,
        period: currentPeriod,
      });
  };
  const value = {
    ready,
    token,
    currentUser,
    accountSets,
    currentAccountSet,
    currentPeriod,
    login,
    logout,
    selectAccountSet,
    setPeriod,
    refreshAccountSets,
    updateCurrentUser,
  };
  return (
    <FinAppContext.Provider value={value}>{children}</FinAppContext.Provider>
  );
}

export function useFinApp() {
  const value = useContext(FinAppContext);
  if (!value) throw new Error("useFinApp must be used within FinAppProvider");
  return value;
}
