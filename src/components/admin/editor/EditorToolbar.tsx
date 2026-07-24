"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => Promise<string>;
}

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-sm border border-b-0 border-polis-navy/20 bg-polis-off-white p-1.5">
      <ToolbarButton
        label="Negrito"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label="Itálico"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label="Sublinhado"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        label="Tachado"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Título 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Título 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        label="Citação"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>

      <Divider />

      <LinkButton editor={editor} />
      <ToolbarButton
        label={isUploadingImage ? "Enviando imagem..." : "Inserir imagem"}
        onClick={() => imageInputRef.current?.click()}
        disabled={isUploadingImage}
      >
        🖼
      </ToolbarButton>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <ToolbarButton label="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        —
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Desfazer"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↺
      </ToolbarButton>
      <ToolbarButton
        label="Refazer"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↻
      </ToolbarButton>
    </div>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");

  function openPopover() {
    setUrl(editor.getAttributes("link").href ?? "");
    setIsOpen(true);
  }

  function applyLink() {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setIsOpen(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={openPopover}>
        🔗
      </ToolbarButton>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 flex w-64 items-center gap-1 rounded-sm border border-polis-navy/20 bg-white p-2 shadow-md">
          <input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="https://..."
            className="w-full rounded-sm border border-polis-navy/20 px-2 py-1 text-xs focus:border-polis-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="shrink-0 rounded-sm bg-polis-navy px-2 py-1 text-xs font-semibold text-white"
          >
            OK
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onClick={removeLink}
              className="shrink-0 text-xs font-semibold text-red-700"
            >
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-polis-navy/10" />;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 min-w-7 items-center justify-center rounded-sm px-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-polis-navy text-white" : "text-polis-navy hover:bg-polis-navy/10"
      )}
    >
      {children}
    </button>
  );
}
