"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (subjects: string[]) => void | Promise<void>;
  autoFocus?: boolean;
  inputId?: string;
  placeholder?: string;
}

/**
 * The fast-capture input: type, press Enter, keep typing.
 * Pasting multi-line text creates one task per line.
 */
export default function TaskEntry({ onAdd, autoFocus, inputId, placeholder }: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const subject = value.trim();
    if (!subject) return;
    setValue("");
    void onAdd([subject]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative"
    >
      <Plus size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (!text.includes("\n")) return;
          e.preventDefault();
          const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length) void onAdd(lines);
        }}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder ?? "Add a task and press Enter…"}
        className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-12 text-[15px] placeholder:text-faint shadow-[0_1px_2px_rgba(24,36,32,0.04)] focus:border-pine focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-faint">
        ↵
      </kbd>
    </form>
  );
}
