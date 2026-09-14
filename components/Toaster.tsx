"use client";

import { useEffect, useRef, useState } from "react";
import { onToast } from "@/lib/client";

interface Msg {
  id: number;
  text: string;
}

export default function Toaster() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const counter = useRef(0);

  useEffect(
    () =>
      onToast((text) => {
        const id = ++counter.current;
        setMsgs((m) => [...m, { id, text }]);
        setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2600);
      }),
    []
  );

  if (msgs.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2">
      {msgs.map((m) => (
        <div
          key={m.id}
          className="rounded-full bg-ink px-4 py-1.5 font-mono text-xs text-paper shadow-lg"
          style={{ animation: "toast-in 160ms ease-out" }}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}
