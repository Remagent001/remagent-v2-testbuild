"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";

export default function RichTextEditor({ content, onChange, placeholder, maxLength = 5000 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Placeholder.configure({ placeholder: placeholder || "Start typing..." }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        <button
          type="button"
          className={`rich-editor-btn ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`rich-editor-btn ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`rich-editor-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          className={`rich-editor-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
      </div>
      <EditorContent editor={editor} className="rich-editor-content" />
      <div className="form-char-count">
        {charCount}/{maxLength}
      </div>
    </div>
  );
}
