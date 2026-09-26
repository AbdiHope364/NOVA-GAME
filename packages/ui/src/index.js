import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export const Button = ({ children, className, variant = 'primary', size = 'md', isLoading = false, disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const variants = {
        primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
        accent: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20',
        outline: 'border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    };
    return (_jsx("button", { className: cn(baseStyles, variants[variant], sizes[size], className), disabled: disabled || isLoading, ...props, children: isLoading ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4 text-current", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Loading..."] })) : (children) }));
};
export const Card = ({ children, className, ...props }) => {
    return (_jsx("div", { className: cn('bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-xl p-5 shadow-2xl', className), ...props, children: children }));
};
export const Input = ({ label, error, className, ...props }) => {
    return (_jsxs("div", { className: "flex flex-col gap-1.5 w-full", children: [label && _jsx("label", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: label }), _jsx("input", { className: cn('w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm', error && 'border-rose-500 focus:border-rose-500', className), ...props }), error && _jsx("span", { className: "text-xs text-rose-400 font-medium", children: error })] }));
};
export const Badge = ({ children, variant = 'info', className, }) => {
    const styles = {
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
    return (_jsx("span", { className: cn('px-2.5 py-1 text-xs font-semibold rounded-full border', styles[variant], className), children: children }));
};
