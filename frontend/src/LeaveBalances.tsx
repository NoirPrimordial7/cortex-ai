import type { LeaveBalanceItem } from "./types";

export function LeaveBalances({ balances }: { balances: LeaveBalanceItem[] }) {
  return balances.length ? (
    <dl className="leave-balances">
      {balances.map((balance) => (
        <div key={balance.leave_type_id}>
          <dt>{balance.name}</dt>
          <dd>
            {balance.balance_days}{" "}
            {Math.abs(balance.balance_days) === 1 ? "day" : "days"}
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className="empty-note">No leave balances are available.</p>
  );
}
