"use client";

import { useCallback, useEffect, useRef } from "react";

export const useDebouncedCallback = <Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delay = 500,
) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useCallback(
    (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
};
