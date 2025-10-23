import { HTMLAttributes, forwardRef } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

const combine = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={combine("rounded-xl border border-gray-800 bg-gray-900 text-white", className)} {...props} />
));

Card.displayName = "Card";

export const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={combine("p-4", className)} {...props} />
));

CardContent.displayName = "CardContent";
