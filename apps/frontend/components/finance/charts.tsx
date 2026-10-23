import type { HomeDashboard } from "@/lib/finance/types";

export function RevenueProfitChart({ data }: { data: HomeDashboard["revenueProfitByMonth"] }) {
  const max = Math.max(...data.flatMap((item) => [item.主营业务收入, item.本年利润]), 1);
  const points = data.map((item, index) => `${42 + index * 58},${180 - (item.本年利润 / max) * 135}`).join(" ");
  return <div className="overflow-x-auto"><svg viewBox="0 0 720 220" className="min-w-[650px] w-full" role="img" aria-label="主营业务收入与本年利润趋势">
    {[0, 1, 2, 3].map((line) => <line key={line} x1="35" y1={45 + line * 45} x2="700" y2={45 + line * 45} stroke="#e2e8f0" />)}
    {data.map((item, index) => { const height = (item.主营业务收入 / max) * 135; return <g key={item.month}><rect x={31 + index * 58} y={180 - height} width="23" height={height} rx="4" fill="#38bdf8"><title>{item.month}月 主营业务收入 {item.主营业务收入}千元</title></rect><text x={42 + index * 58} y="202" textAnchor="middle" fontSize="11" fill="#64748b">{item.month}月</text></g>; })}
    <polyline points={points} fill="none" stroke="#f97316" strokeWidth="3" />
    {data.map((item, index) => <circle key={item.month} cx={42 + index * 58} cy={180 - (item.本年利润 / max) * 135} r="4" fill="#f97316"><title>{item.month}月 本年利润 {item.本年利润}千元</title></circle>)}
    <g transform="translate(475 18)"><rect width="12" height="12" rx="2" fill="#38bdf8"/><text x="18" y="11" fontSize="12" fill="#475569">主营业务收入</text><circle cx="122" cy="6" r="5" fill="#f97316"/><text x="133" y="11" fontSize="12" fill="#475569">本年利润</text></g>
  </svg></div>;
}

