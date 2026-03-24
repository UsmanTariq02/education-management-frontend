"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) {
        return;
      }

      const nextUrl = `${destination.pathname}${destination.search}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (nextUrl === currentUrl) {
        return;
      }

      setIsNavigating(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsNavigating(false);
      }, 8000);
    };

    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    setIsNavigating(false);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  if (!isNavigating) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-primary/10">
        <div className="h-full w-1/3 animate-[route-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <div className="absolute right-5 top-5 rounded-2xl border bg-background/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative rounded-2xl bg-primary/10 p-2 text-primary">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
            <GraduationCap className="relative h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Loading</p>
            <p className="text-sm font-medium">Opening next page...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
