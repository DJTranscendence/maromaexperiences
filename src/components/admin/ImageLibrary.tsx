
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Image, Upload, Check, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

interface ImageLibraryProps {
  onSelect: (urls: string[]) => void;
  selectedUrls?: string[];
  multiSelect?: boolean;
}

export function ImageLibrary({ onSelect, selectedUrls = [], multiSelect = true }: ImageLibraryProps) {
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localSelection, setLocalSelection] = useState<string[]>(selectedUrls);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading } = useCollection<MediaItem>(mediaQuery);

  const handleAddMedia = () => {
    if (!newUrl || !firestore) return;
    setIsAdding(true);
    
    const mediaData = {
      url: newUrl,
      type: 'image',
      altText: 'Uploaded experience image',
      uploadedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'media'), mediaData)
      .then(() => {
        toast({ title: "Media Added", description: "Image successfully added to the library." });
        setNewUrl('');
      })
      .finally(() => setIsAdding(false));
  };

  const toggleSelection = (url: string) => {
    if (multiSelect) {
      setLocalSelection(prev => 
        prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      );
    } else {
      setLocalSelection([url]);
    }
  };

  const handleConfirm = () => {
    onSelect(localSelection);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-xl border-dashed border-2 h-24 w-full">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">Open Image Library</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-3xl text-primary">Media Library</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-1 space-y-6">
          {/* Add New Media */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-4 border border-border">
            <Label className="font-bold text-primary">Add New Image URL</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Paste image URL here..." 
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="rounded-full"
              />
              <Button 
                onClick={handleAddMedia} 
                disabled={isAdding || !newUrl}
                className="bg-accent rounded-full px-6"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add
              </Button>
            </div>
          </div>

          {/* Library Grid */}
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {media?.map((item) => (
                <div 
                  key={item.id} 
                  className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${
                    localSelection.includes(item.url) ? "border-accent" : "border-transparent"
                  }`}
                  onClick={() => toggleSelection(item.url)}
                >
                  <NextImage 
                    src={item.url} 
                    alt={item.altText || 'Media'} 
                    fill 
                    className="object-cover"
                  />
                  {localSelection.includes(item.url) && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="bg-accent text-white rounded-full p-1 shadow-lg">
                        <Check className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{item.url}</p>
                  </div>
                </div>
              ))}
              {(!media || media.length === 0) && (
                <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl">
                  <p className="text-muted-foreground">Your library is empty. Add your first image URL above!</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {localSelection.length} item{localSelection.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-full px-6">Cancel</Button>
            <Button onClick={handleConfirm} className="bg-primary rounded-full px-8">Confirm Selection</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
