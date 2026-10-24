import { cn } from "@/lib/utils";

export function formatMoney(value: number | string | undefined) {
  const amount = Number(value || 0);
  return amount
    ? amount.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
}

export function MoneyText({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn("tabular-nums", value < 0 && "text-red-600", className)}
    >
      {formatMoney(value) || "0.00"}
    </span>
  );
}
