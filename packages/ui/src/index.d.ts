import React from 'react';
import { type ClassValue } from 'clsx';
export declare function cn(...inputs: ClassValue[]): string;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}
export declare const Button: React.FC<ButtonProps>;
export declare const Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}
export declare const Input: React.FC<InputProps>;
export declare const Badge: React.FC<{
    children: React.ReactNode;
    variant?: 'success' | 'danger' | 'warning' | 'info';
    className?: string;
}>;
//# sourceMappingURL=index.d.ts.map