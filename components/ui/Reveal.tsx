"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/components/ui/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger helper — seconds of delay before the fade-up. */
  delay?: number;
  as?: "div" | "li" | "section";
};

/** Gentle fade-up on scroll into view; collapses to a no-op under reduced-motion. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}
