import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Button, Badge } from '@nova/ui';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';
import { api } from '../../services/api';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, CheckCircle2, AlertCircle, ShieldCheck, Upload, X, Smartphone, Building2, Landmark, Trophy, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';

interface WalletPageProps {
  defaultTab?: 'DEPOSIT' | 'WITHDRAW' | 'HISTORY';
}

export const WalletPage: React.FC<WalletPageProps> = ({ defaultTab }) => {
  const [searchParams] = useSearchParams();
  const {
    balance,
    cashBalance,
    bonusBalance,
    lockedWinnings,
    withdrawableBalance,
    currency,
    transactions,
    walletNotification,
    setWalletNotification,
    fetchWallet,
    fetchTransactions,
    deposit,
    withdraw,
  } = useWalletStore();
  const t = useI18nStore((s) => s.t);

  const resolveInitialTab = (): 'DEPOSIT' | 'WITHDRAW' | 'HISTORY' => {
    const q = (searchParams.get('tab') || '').toUpperCase();
    if (q === 'WITHDRAW') return 'WITHDRAW';
    if (q === 'HISTORY' || q === 'TRANSACTIONS') return 'HISTORY';
    if (q === 'DEPOSIT') return 'DEPOSIT';
    return defaultTab || 'DEPOSIT';
  };

  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW' | 'HISTORY'>(resolveInitialTab);
  const [enabledMethods, setEnabledMethods] = useState<Array<{ id: string; label: string; description: string }>>([
    { id: 'TELEBIRR', label: 'Telebirr', description: 'Instant mobile wallet receipt verification' },
    { id: 'CBE_BIRR', label: 'CBE Birr', description: 'Commercial Bank of Ethiopia mobile wallet' },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer', description: 'Direct Ethiopian bank transfer' },
  ]);
  const [minDepositEtb, setMinDepositEtb] = useState<number>(10);
  const [confirmAction, setConfirmAction] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);

  useEffect(() => {
    setActiveTab(resolveInitialTab());
  }, [defaultTab, searchParams.get('tab')]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    api
      .get('/wallet/methods')
      .then((res) => {
        const d = res.data?.data;
        if (Array.isArray(d?.methods) && d.methods.length > 0) {
          setEnabledMethods(d.methods.filter((m: any) => m.enabled));
        }
        if (d?.minDepositEtb) setMinDepositEtb(Number(d.minDepositEtb));
      })
      .catch(() => {});
  }, []);
  
  // Deposit State
  const [depositMethod, setDepositMethod] = useState<'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('TELEBIRR');
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositPhone, setDepositPhone] = useState<string>('');
  const [depositRefNumber, setDepositRefNumber] = useState<string>('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Withdraw State
  const [withdrawMethod, setWithdrawMethod] = useState<'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('TELEBIRR');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawAccount, setWithdrawAccount] = useState<string>('');
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presets = [50, 100, 500, 1000, 5000];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDepositMsg({ type: 'error', text: 'Please upload a valid image file (PNG, JPG, JPEG)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDepositMsg({ type: 'error', text: 'Image file size must be less than 5MB' });
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setReceiptPhoto(uploadEvent.target?.result as string);
      setDepositMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDepositSubmit = async () => {
    if (depositAmount <= 0) {
      setDepositMsg({ type: 'error', text: 'Please enter a valid deposit amount' });
      return;
    }
    if (!depositPhone.trim()) {
      setDepositMsg({ type: 'error', text: 'Please enter your payment phone number' });
      return;
    }
    if (!receiptPhoto) {
      setDepositMsg({ type: 'error', text: 'Please upload a screenshot or photo of your payment receipt' });
      return;
    }

    setConfirmAction(null);
    setDepositMsg(null);
    setIsSubmitting(true);
    try {
      await deposit(depositAmount, depositMethod, depositPhone, receiptPhoto, depositRefNumber);
      setDepositMsg({
        type: 'success',
        text: `Deposit request for ${depositAmount} ${currency} submitted! Admin will verify your receipt and credit your balance shortly.`,
      });
      setDepositPhone('');
      setDepositRefNumber('');
      setReceiptPhoto(null);
      setReceiptFileName('');
    } catch (err: any) {
      setDepositMsg({
        type: 'error',
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Deposit submission failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    if (withdrawAmount <= 0) {
      setWithdrawMsg({ type: 'error', text: 'Please enter a valid withdrawal amount' });
      return;
    }
    if (withdrawAmount > withdrawableBalance) {
      setWithdrawMsg({
        type: 'error',
        text: `Amount exceeds your eligible withdrawable balance (${withdrawableBalance.toFixed(2)} ${currency}). Bonus credits cannot be withdrawn directly.`,
      });
      return;
    }
    if (!withdrawAccount.trim()) {
      setWithdrawMsg({ type: 'error', text: 'Please enter your phone or account number' });
      return;
    }
    setConfirmAction(null);
    setWithdrawMsg(null);
    try {
      await withdraw(withdrawAmount, `${withdrawMethod}: ${withdrawAccount}`);
      setWithdrawMsg({
        type: 'success',
        text: `Withdrawal request of ${withdrawAmount} ${currency} submitted! Processing to ${withdrawAccount}`,
      });
    } catch (err: any) {
      setWithdrawMsg({
        type: 'error',
        text: err.response?.data?.error || 'Withdrawal failed. Please try again.',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 py-2 px-2 sm:px-0">
      {/* Real-Time Admin Approval Notification Banner */}
      {walletNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{walletNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setWalletNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Wallet Balance Hero Card + 4-Way Wallet Separation */}
      <Card className="flex flex-col gap-4 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shrink-0">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.common.platformWallet || 'Total Playable Balance'}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight mt-0.5">
                {balance.toLocaleString()} <span className="text-cyan-400 text-lg sm:text-xl font-bold">{currency}</span>
              </h2>
            </div>
          </div>
          <Badge variant="success" className="gap-1 items-center text-[10px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Audited Transaction Ledger
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Cash Balance</span>
            <span className="text-sm font-mono font-black text-white">{cashBalance.toFixed(2)} {currency}</span>
          </div>
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Bonus Credit</span>
            <span className="text-sm font-mono font-black text-amber-300">{bonusBalance.toFixed(2)} {currency}</span>
          </div>
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-purple-400 uppercase block">Locked Winnings</span>
            <span className="text-sm font-mono font-black text-purple-300">{lockedWinnings.toFixed(2)} {currency}</span>
          </div>
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Withdrawable</span>
            <span className="text-sm font-mono font-black text-emerald-300">{withdrawableBalance.toFixed(2)} {currency}</span>
          </div>
        </div>
      </Card>

      {/* Tab Controls */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('DEPOSIT')}
          className={`py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 ${
            activeTab === 'DEPOSIT'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0" /> Deposit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('WITHDRAW')}
          className={`py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 ${
            activeTab === 'WITHDRAW'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" /> Withdraw
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 ${
            activeTab === 'HISTORY'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4 shrink-0" /> History
        </button>
      </div>

      {/* DEPOSIT TAB */}
      {activeTab === 'DEPOSIT' && (
        <Card className="flex flex-col gap-4 sm:gap-5 border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Instant Payment Deposit
            </h3>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Min: 10 ETB</span>
          </div>

          {/* Alert Message */}
          {depositMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                depositMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {depositMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{depositMsg.text}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Payment Method (Min {minDepositEtb} {currency})
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {enabledMethods.map((method) => {
                const isSelected = depositMethod === method.id;
                const IconComp =
                  method.id === 'TELEBIRR'
                    ? Smartphone
                    : method.id === 'CBE_BIRR'
                    ? Building2
                    : Landmark;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setDepositMethod(method.id as any)}
                    className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-cyan-400" /> {method.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                      Configured
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Instructions Card */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
              {depositMethod} Payment Info
            </span>
            <p className="text-slate-400">
              Transfer funds to merchant account: <strong className="text-white font-mono">1000 4829 1928</strong>
            </p>
            <span className="text-[11px] text-slate-500">
              * Enter your transaction reference number below after completing payment.
            </span>
          </div>

          {/* Amount Presets */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Amount ({currency})</label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDepositAmount(p)}
                  className={`py-2 rounded-xl font-mono text-[11px] sm:text-xs font-bold border transition-all active:scale-95 ${
                    depositAmount === p
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  +{p}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              placeholder="Custom amount..."
            />
          </div>

          {/* Phone Number Input */}
          <Input
            label="Payment Phone Number *"
            type="text"
            value={depositPhone}
            onChange={(e) => setDepositPhone(e.target.value)}
            placeholder="e.g. 0912345678 or 0712345678"
          />

          {/* Transaction Reference / Receipt No */}
          <Input
            label="Transaction Ref / Tx ID (Optional)"
            type="text"
            value={depositRefNumber}
            onChange={(e) => setDepositRefNumber(e.target.value)}
            placeholder="e.g. FT2409823901 or 1000..."
          />

          {/* Receipt Photo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Receipt Photo / Screenshot *</span>
              <span className="text-[10px] text-slate-500 font-normal">Required for Verification</span>
            </label>

            {receiptPhoto ? (
              <div className="relative rounded-2xl border border-slate-700 bg-slate-950 p-3 flex items-center gap-3">
                <img
                  src={receiptPhoto}
                  alt="Receipt Preview"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-800 shadow"
                />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-xs font-bold text-emerald-400 truncate">{receiptFileName}</span>
                  <span className="text-[10px] text-slate-500">Image uploaded ready for submission</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPhoto(null);
                    setReceiptFileName('');
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 active:scale-95"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-cyan-400 cursor-pointer transition-all active:scale-98">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                <div className="text-center">
                  <span className="text-xs font-bold block">Click or Drop Payment Receipt Screenshot</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Supports PNG, JPG, JPEG (Max 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <Button
            variant="accent"
            size="lg"
            onClick={() => setConfirmAction('DEPOSIT')}
            disabled={isSubmitting || !depositPhone.trim() || !receiptPhoto}
            className="w-full py-3.5 sm:py-4 font-black tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl shadow-lg disabled:opacity-50 min-h-[48px] active:scale-95 transition-transform"
          >
            {isSubmitting ? 'SUBMITTING REQUEST...' : `SUBMIT DEPOSIT REQUEST (${depositAmount} ${currency})`}
          </Button>
        </Card>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === 'WITHDRAW' && (
        <Card className="flex flex-col gap-4 sm:gap-5 border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> Fast Withdrawal Cashout
            </h3>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
              Withdrawable: {withdrawableBalance.toFixed(2)} {currency}
            </span>
          </div>

          {/* Alert Message */}
          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                withdrawMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {withdrawMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{withdrawMsg.text}</span>
            </div>
          )}

          {/* Withdrawal Destination Method */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payout Destination</label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setWithdrawMethod('TELEBIRR')}
                className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                  withdrawMethod === 'TELEBIRR'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Telebirr</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">09xx...</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod('CBE_BIRR')}
                className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                  withdrawMethod === 'CBE_BIRR'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-purple-400" /> CBE Birr</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod('BANK_TRANSFER')}
                className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                  withdrawMethod === 'BANK_TRANSFER'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-amber-400" /> Bank</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">Account</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Withdrawal Amount ({currency})</label>
              <button
                type="button"
                onClick={() => setWithdrawAmount(Math.floor(withdrawableBalance))}
                className="text-[11px] text-cyan-400 font-bold hover:underline"
              >
                Max Withdrawable ({Math.floor(withdrawableBalance)} ETB)
              </button>
            </div>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              placeholder="Amount..."
            />
            {withdrawableBalance <= 0 && (
              <p className="text-[11px] text-amber-300 font-semibold">
                Withdrawable balance requires a confirmed qualifying first deposit and completed bonus wagering requirements. Promotional credits are not directly withdrawable.
              </p>
            )}
          </div>

          {/* Recipient Account / Phone Number */}
          <Input
            label={withdrawMethod === 'BANK_TRANSFER' ? 'Bank Account Number' : 'Phone Number (09...)'}
            type="text"
            value={withdrawAccount}
            onChange={(e) => setWithdrawAccount(e.target.value)}
            placeholder={withdrawMethod === 'BANK_TRANSFER' ? '1000 1234 5678' : '0912 345 678'}
          />

          <Button
            variant="danger"
            size="lg"
            onClick={() => setConfirmAction('WITHDRAW')}
            disabled={withdrawableBalance < withdrawAmount || withdrawAmount <= 0 || !withdrawAccount.trim()}
            className="w-full py-3.5 sm:py-4 font-black tracking-wider uppercase bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white rounded-xl shadow-lg disabled:opacity-50 min-h-[48px] active:scale-95 transition-transform"
          >
            REQUEST WITHDRAWAL ({withdrawAmount} {currency})
          </Button>
        </Card>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <Card className="flex flex-col gap-4 border-slate-800 bg-slate-900/90 shadow-2xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" /> Recent Wallet Ledger Activity
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchWallet();
                  fetchTransactions();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Refresh Transactions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <Badge variant="info">Audited</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <span className="text-slate-400 block">Pending Deposits</span>
              <strong className="text-orange-300 font-mono text-sm">
                {transactions.filter((tx) => tx.type === 'DEPOSIT' && tx.status === 'PENDING').length}
              </strong>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <span className="text-slate-400 block">Pending Withdrawals</span>
              <strong className="text-cyan-300 font-mono text-sm">
                {transactions.filter((tx) => tx.type === 'WITHDRAWAL' && tx.status === 'PENDING').length}
              </strong>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {transactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-bold">
                No wallet transactions recorded yet. Submit a deposit or place a bet to see activity.
              </div>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === 'DEPOSIT' || tx.type === 'BET_WON' || tx.type === 'BET_REFUND';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                          isCredit
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.type === 'DEPOSIT' ? (
                          <ArrowDown className="w-4 h-4 text-emerald-400" />
                        ) : tx.type === 'BET_WON' ? (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ArrowUp className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white block leading-tight">
                          {tx.description || `${tx.paymentMethod || ''} ${tx.type}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-mono text-sm font-black ${
                          isCredit ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{tx.amount} ETB
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Financial Actions */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Financial Transaction"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">
              {confirmAction === 'DEPOSIT' ? 'Confirm Deposit Request' : 'Confirm Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmAction === 'DEPOSIT'
                ? `Submit deposit request of ${depositAmount.toLocaleString()} ${currency} via ${depositMethod} (${depositPhone})?`
                : `Request withdrawal of ${withdrawAmount.toLocaleString()} ${currency} to ${withdrawMethod}: ${withdrawAccount}?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction === 'DEPOSIT') handleDepositSubmit();
                  else handleWithdrawSubmit();
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
