import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className, glow = false }) => {
    return (
        <div className={twMerge(clsx(
            'rounded-2xl border border-white/5 bg-obsidian-800/40 backdrop-blur-sm p-6 shadow-xl transition-all duration-300',
            glow && 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)] border-white/10',
            className
        ))}>
            {children}
        </div>
    );
};

export const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-white/5 text-gray-300 border-white/10',
        success: 'bg-green-500/10 text-green-400 border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
        primary: 'bg-primary/10 text-primary border-primary/20',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
            {children}
        </span>
    );
};
