"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RouteFlipTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, rotateY: -8 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, rotateY: 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeInOut" }}
        style={{ transformOrigin: "left center", height: "100%" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
