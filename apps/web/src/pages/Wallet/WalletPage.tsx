import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@nova/ui';
import { useWalletStore } from '../../stores/walletStore';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { balance, currency, deposit, withdraw } = useWalletStore();
  const [depositAmount, setDepositAmount] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState(50);
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState('');

  const handleDeposit = async () => {
    try {
      await deposit(depositAmount, 'Demo Bank / Card');
      setMsg(`Successfully deposited $${depositAmount}`);
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdraw(withdrawAmount, address || '0xDemoWallet');
      setMsg(`Successfully withdrew $${withdrawAmount}`);
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Withdrawal failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Card className="flex items-center justify-between border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-850">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Available Balance</span>
            <h2 className="text-3xl font-extrabold text-white font-mono">${balance.toFixed(2)} {currency}</h2>
          </div>
        </div>
        <Badge variant="success">Shared Platform Ledger</Badge>
      </Card>

      {msg && <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-semibold">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" /> Deposit Funds
          </h3>
          <Input label="Amount (USD)" type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
          <Button variant="primary" onClick={handleDeposit}>
            CONFIRM DEMO DEPOSIT
          </Button>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-400" /> Withdraw Funds
          </h3>
          <Input label="Amount (USD)" type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} />
          <Input label="Wallet / Address" type="text" placeholder="0x..." value={address} onChange={(e) => setAddress(e.target.value)} />
          <Button variant="danger" onClick={handleWithdraw}>
            REQUEST WITHDRAWAL
          </Button>
        </Card>
      </div>
    </div>
  );
};
