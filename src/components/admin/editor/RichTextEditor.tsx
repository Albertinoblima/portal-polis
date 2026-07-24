"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "@/components/admin/editor/EditorToolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, onImageUpload, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "Escreva a matéria..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm min-h-[320px] w-full max-w-none rounded-b-sm border border-polis-navy/20 px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  // Mantém o editor em sincronia quando `value` muda por fora (ex.: carregar
  // a matéria, ou alternar de volta da aba HTML) sem resetar o cursor a cada
  // tecla digitada — só aplica quando o HTML realmente diverge do editor.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[360px] w-full animate-pulse rounded-sm border border-polis-navy/20 bg-polis-off-white" />
    );
  }

  return (
    <div>
      <EditorToolbar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
