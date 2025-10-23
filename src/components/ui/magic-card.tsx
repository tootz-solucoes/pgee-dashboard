import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type MagicCardProps = HTMLMotionProps<"div"> & {
  spotlight?: boolean;
};

export function MagicCard({
  className,
  children,
  spotlight = true,
  ...props
}: MagicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5",
        "shadow-[0_0_80px_rgba(15,118,110,0.12)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-500/10 before:via-cyan-500/0 before:to-indigo-500/10",
        "after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:border after:border-white/10",
        className,
      )}
      {...props}
    >
      {spotlight ? (
        <div className="pointer-events-none absolute -top-32 right-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      ) : null}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
