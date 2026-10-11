import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const card = (mine = false) =>
  `my-4 rounded-lg border bg-card p-4 ${mine ? 'border-accent' : 'border-line'}`;

type Variant = 'default' | 'primary' | 'link' | 'danger';

const variants: Record<Variant, string> = {
  default: 'border border-line bg-card px-4 py-2 text-fg',
  primary: 'border border-accent bg-accent px-4 py-2 text-accent-fg',
  link: 'bg-transparent px-2 text-accent underline',
  danger: 'mt-2 bg-transparent p-0 text-err underline',
};

export function Button({
  variant = 'default',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`cursor-pointer rounded-md disabled:cursor-default disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the input is passed in as children
    <label className="mb-3 flex flex-col gap-1 text-[.9rem] text-muted">
      {label}
      {children}
    </label>
  );
}

export const errorText = 'my-2 text-err';
export const hintText = 'mb-2 text-[.85rem] text-muted';
