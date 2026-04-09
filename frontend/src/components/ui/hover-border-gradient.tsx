import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface HoverBorderGradientProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export function HoverBorderGradient({ children, className, ...props }: HoverBorderGradientProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'group relative w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-sky-500 p-[1px] shadow-[0_8px_30px_rgb(14,165,233,0.18)]',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-md transition-opacity duration-200 group-hover:opacity-80 bg-gradient-to-r from-indigo-500/60 via-cyan-500/60 to-sky-500/60" />
      <span className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100">
        {children}
      </span>
    </motion.button>
  );
}
