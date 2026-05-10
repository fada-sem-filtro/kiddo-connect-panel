import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import Typography from '@tiptap/extension-typography';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline as UIcon, List, ListOrdered, ListChecks, Heading1, Heading2, Heading3, Heading4,
  Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Quote, Undo, Redo, Pilcrow, Table as TableIcon, Youtube as YoutubeIcon, Minus, Code,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { optimizeImage, suggestAltFromFilename } from '@/lib/image-optimize';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: 'rounded-lg my-4 w-full aspect-video' } }),
      Image.configure({ HTMLAttributes: { loading: 'lazy', class: 'rounded-lg my-4 max-w-full h-auto' } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo…' }),
    ],
    content: value || '',
    parseOptions: { preserveWhitespace: 'full' },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none min-h-[400px] p-4 focus:outline-none',
      },
      transformPastedHTML(html) {
        // Strip inline styles, classes, and Office/Word noise to keep HTML clean.
        return html
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
          .replace(/\sstyle="[^"]*"/gi, '')
          .replace(/\sclass="[^"]*"/gi, '')
          .replace(/<font[^>]*>|<\/font>/gi, '')
          .replace(/<span[^>]*>/gi, '<span>');
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes only when not actively editing (prevents cursor jump).
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const current = editor.getHTML();
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('URL do link:', previous);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('URL do vídeo do YouTube:');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  };

  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const handleImageUpload = async (file: File) => {
    try {
      const optimized = await optimizeImage(file, { maxWidth: 1600, quality: 0.82 });
      const safeName = optimized.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `inline/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('blog-imagens').upload(path, optimized, {
        upsert: false, contentType: optimized.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('blog-imagens').getPublicUrl(path);
      const suggested = suggestAltFromFilename(file.name);
      const alt = window.prompt('Texto alternativo (alt) para SEO:', suggested) || suggested;
      editor.chain().focus().setImage({ src: data.publicUrl, alt }).run();
    } catch (e: any) {
      toast.error('Falha ao enviar imagem: ' + e.message);
    }
  };

  const ToolbarBtn = ({ onClick, active, children, title, disabled }: any) => (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="h-8 w-8 p-0 shrink-0"
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-md bg-background">
      <div className="sticky top-0 z-10 flex flex-nowrap gap-1 p-2 border-b border-border bg-background/95 backdrop-blur overflow-x-auto">
        <ToolbarBtn title="Parágrafo" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')}><Pilcrow className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="H4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })}><Heading4 className="h-4 w-4" /></ToolbarBtn>
        <div className="w-px bg-border mx-1 shrink-0" />
        <ToolbarBtn title="Negrito (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Itálico (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Código inline" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}><Code className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote className="h-4 w-4" /></ToolbarBtn>
        <div className="w-px bg-border mx-1 shrink-0" />
        <ToolbarBtn title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}><ListChecks className="h-4 w-4" /></ToolbarBtn>
        <div className="w-px bg-border mx-1 shrink-0" />
        <ToolbarBtn title="Alinhar à esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Centralizar" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Alinhar à direita" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight className="h-4 w-4" /></ToolbarBtn>
        <div className="w-px bg-border mx-1 shrink-0" />
        <ToolbarBtn title="Link" onClick={addLink} active={editor.isActive('link')}><LinkIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Imagem" onClick={() => fileRef.current?.click()}><ImageIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Vídeo do YouTube" onClick={addYoutube}><YoutubeIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Tabela" onClick={insertTable}><TableIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolbarBtn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = '';
        }} />
        <div className="w-px bg-border mx-1 shrink-0" />
        <ToolbarBtn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
