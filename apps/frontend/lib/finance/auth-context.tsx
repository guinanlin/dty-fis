"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { accountSet } from "./service";
import type { AccountSet, Role, User } from "./types";
import * as authAction from "@/components/actions/auth-action";
type UserAccountSet = AccountSet & { role: Role };
type BackendUser = { id: string; username: string; email: string; nickname?: string | null; phone?: string | null; avatar_url?: string | null };
type Session = { user: User; accountSetId?: string; period?: { year: number; month: number } };
interface FinAppContextValue { ready: boolean; token: string | null; currentUser: User | null; accountSets: UserAccountSet[]; currentAccountSet: UserAccountSet | null; currentPeriod: { year: number; month: number }; login: (username: string, password: string) => Promise<UserAccountSet[]>; logout: () => Promise<void>; selectAccountSet: (id: string) => void; setPeriod: (year: number, month: number) => void; refreshAccountSets: () => Promise<void>; updateCurrentUser: (user: User) => void; }
const storageKey = "ty-finance-session";
const initialPeriod = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
const FinAppContext = createContext<FinAppContextValue | null>(null);
const mockUserIdFor = (user: BackendUser) => ({ admin: "u1", zhangsan: "u2", lisi: "u3" }[user.username] ?? `u-${user.id.slice(0, 8)}`);
const mapUser = (user: BackendUser): User => ({ id: user.id, username: user.username, password: "", realName: user.nickname || user.username, mobile: user.phone || "", email: user.email, avatarUrl: user.avatar_url || undefined });
export function FinAppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false); const [token, setToken] = useState<string | null>(null); const [currentUser, setCurrentUser] = useState<User | null>(null); const [accountSets, setAccountSets] = useState<UserAccountSet[]>([]); const [currentAccountSet, setCurrentAccountSet] = useState<UserAccountSet | null>(null); const [currentPeriod, setCurrentPeriodState] = useState(initialPeriod);
  const persist = (user: User | null, accountSetId?: string, period = currentPeriod) => user ? localStorage.setItem(storageKey, JSON.stringify({ user, accountSetId, period })) : localStorage.removeItem(storageKey);
  const loadSets = async (user: User, stored?: Session) => { const items = await accountSet.listByUser(mockUserIdFor({ id: user.id, username: user.username, email: user.email })); setAccountSets(items); const selected = items.find((item) => item.id === stored?.accountSetId) ?? (items.length === 1 ? items[0] : null); setCurrentAccountSet(selected); const period = stored?.period ?? selected?.currentPeriod ?? initialPeriod; setCurrentPeriodState(period); persist(user, selected?.id, period); return items; };
  useEffect(() => { void (async () => { const backend = await authAction.getSession(); if (backend) { const user = mapUser(backend); setToken("authenticated"); setCurrentUser(user); const raw = localStorage.getItem(storageKey); await loadSets(user, raw ? JSON.parse(raw) as Session : undefined); } else { setToken(null); setCurrentUser(null); } setReady(true); })(); }, []);
  const login = async (username: string, password: string) => { const result = await authAction.login(username, password); if (!result.ok) throw new Error(result.error); const user = mapUser(result.user); setToken("authenticated"); setCurrentUser(user); return loadSets(user); };
  const logout = async () => { await authAction.logout(); setToken(null); setCurrentUser(null); setAccountSets([]); setCurrentAccountSet(null); persist(null); };
  const selectAccountSet = (id: string) => { const selected = accountSets.find((item) => item.id === id) ?? null; setCurrentAccountSet(selected); if (selected && currentUser) { setCurrentPeriodState(selected.currentPeriod); persist(currentUser, selected.id, selected.currentPeriod); } };
  const setPeriod = (year: number, month: number) => { const period = { year, month }; setCurrentPeriodState(period); if (currentUser) persist(currentUser, currentAccountSet?.id, period); };
  const updateCurrentUser = (user: User) => { setCurrentUser(user); if (token) persist(user, currentAccountSet?.id); };
  const refreshAccountSets = async () => { if (currentUser) await loadSets(currentUser, { user: currentUser, accountSetId: currentAccountSet?.id, period: currentPeriod }); };
  return <FinAppContext.Provider value={{ ready, token, currentUser, accountSets, currentAccountSet, currentPeriod, login, logout, selectAccountSet, setPeriod, refreshAccountSets, updateCurrentUser }}>{children}</FinAppContext.Provider>;
}
export function useFinApp() { const value = useContext(FinAppContext); if (!value) throw new Error("useFinApp must be used within FinAppProvider"); return value; }
