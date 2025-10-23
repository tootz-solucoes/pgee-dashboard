import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type SparklesTextProps = HTMLMotionProps<"span">;

export function SparklesText({ className, children, ...props }: SparklesTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "bg-gradient-to-r from-emerald-300 via-cyan-200 to-sky-400 bg-clip-text text-transparent",
        "tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </motion.span>
  );
}
