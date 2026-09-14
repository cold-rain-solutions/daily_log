"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

function ToolButton({
  icon: Icon,
  active,
  label,
  onRun,
}: {
  icon: LucideIcon;
  active: boolean;
  label: string;
  onRun: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onRun();
      }}
      className={`rounded-md p-1.5 transition-colors ${
        active ? "bg-pine-soft text-pine-deep" : "text-soft hover:bg-paper hover:text-ink"
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

export default function NotesEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    autofocus: "end",
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: (ctx: { editor: Editor | null }) =>
      ctx.editor
        ? {
            bold: ctx.editor.isActive("bold"),
            italic: ctx.editor.isActive("italic"),
            bullet: ctx.editor.isActive("bulletList"),
            ordered: ctx.editor.isActive("orderedList"),
          }
        : null,
  });

  return (
    <div className="notes-editor rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
        <ToolButton
          icon={Bold}
          label="Bold"
          active={!!state?.bold}
          onRun={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolButton
          icon={Italic}
          label="Italic"
          active={!!state?.italic}
          onRun={() => editor?.chain().focus().toggleItalic().run()}
        />
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolButton
          icon={List}
          label="Bullet list"
          active={!!state?.bullet}
          onRun={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          icon={ListOrdered}
          label="Numbered list"
          active={!!state?.ordered}
          onRun={() => editor?.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  );
}
