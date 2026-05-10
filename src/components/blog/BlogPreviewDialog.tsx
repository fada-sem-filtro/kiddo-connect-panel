import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, X } from 'lucide-react';
import { BlogPostView, type BlogPostViewData } from './BlogPostView';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  post: BlogPostViewData;
}

export function BlogPreviewDialog({ open, onOpenChange, post }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <DialogTitle className="text-sm font-medium">Pré-visualização do artigo</DialogTitle>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={device === 'desktop' ? 'default' : 'ghost'} onClick={() => setDevice('desktop')}>
              <Monitor className="w-4 h-4 mr-1" /> Desktop
            </Button>
            <Button size="sm" variant={device === 'mobile' ? 'default' : 'ghost'} onClick={() => setDevice('mobile')}>
              <Smartphone className="w-4 h-4 mr-1" /> Mobile
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-background">
          <div
            className={`mx-auto bg-background transition-all ${device === 'mobile' ? 'max-w-[390px] border-x border-border' : 'w-full'}`}
          >
            <BlogPostView post={post} showBreadcrumb={false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
