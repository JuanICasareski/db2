import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`}
      {...props}
    />
  );
}

type CardProps = {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function Card({ title, icon, actions, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {icon}
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
