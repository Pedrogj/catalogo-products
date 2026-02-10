import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">{children}</div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700">{children}</label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border px-3 py-2 text-sm outline-none " +
        "focus:ring-2 focus:ring-black/10 focus:border-black/30 " +
        (props.className ?? "")
      }
    />
  );
}

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl bg-black px-3 py-2 text-sm font-medium text-white " +
        "hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed " +
        "active:scale-[0.99] " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl border px-3 py-2 text-sm font-medium " +
        "hover:bg-gray-50 active:scale-[0.99] " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}
