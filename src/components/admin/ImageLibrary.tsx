'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Check, Loader2, Search, Upload, ImageIcon, Grid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

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

const resizeImage = (file: File, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

export function ImageLibrary({ onSelect, selectedUrls = [], multiSelect = true }: ImageLibraryProps) {
  const { firestore } = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading: isMediaLoading } = useCollection<MediaItem>(mediaQuery);

  const displayMedia = useMemo(() => {
    if (!media) return null;
    
    const filtered = media.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.altText?.toLowerCase().includes(q)) ||
        (item.url.toLowerCase().includes(q))
      );
    });

    return [...filtered].sort((a, b) => {
      const tA = a.uploadedAt?.toMillis?.() || a.uploadedAt?.seconds * 1000 || Date.now();
      const tB = b.uploadedAt?.toMillis?.() || b.uploadedAt?.seconds * 1000 || Date.now();
      return tB - tA;
    });
  }, [media, searchQuery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && firestore && user) {
      setIsAdding(true);
      const file = e.target.files[0];
      try {
        const compressedDataUrl = await resizeImage(file);
        const mediaData = {
          url: compressedDataUrl,
          type: 'image',
          altText: file.name,
          uploadedAt: serverTimestamp(),
        };
        addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
        toast({ title: "Image Uploaded", description: "Successfully added to your library." });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Process Error", description: "Could not optimize image." });
      } finally {
        setIsAdding(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const toggleSelection = (url: string) => {
    let nextSelection: string[];
    if (multiSelect) {
      nextSelection = selectedUrls.includes(url) 
        ? selectedUrls.filter(u => u !== url) 
        : [...selectedUrls, url];
    } else {
      nextSelection = [url];
    }
    onSelect(nextSelection);
  };

  const isSyncing = isMediaLoading || isUserLoading || (media === null && !!mediaQuery);

  return (
    <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search gallery..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 rounded-full bg-muted/30 border-none h-11 focus-visible:ring-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full h-10 px-4 border-accent/20 text-accent hover:bg-accent/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAdding}
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isAdding ? "Uploading..." : "Add Images"}
            </Button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <Button variant="ghost" size="icon" className="text-primary rounded-full bg-muted/50 h-10 w-10">
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground font-body">Syncing images...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayMedia?.map((item) => (
              <div 
                key={item.id} 
                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-300 ${
                  selectedUrls.includes(item.url) ? "border-accent shadow-lg scale-[0.98]" : "border-transparent hover:shadow-xl"
                }`}
                onClick={() => toggleSelection(item.url)}
              >
                <NextImage 
                  src={item.url} 
                  alt={item.altText || 'Media'} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
                {selectedUrls.includes(item.url) && (
                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-accent text-white rounded-full p-2 shadow-xl scale-110">
                      <Check className="w-5 h-5 stroke-[3px]" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white font-medium truncate uppercase tracking-widest">
                    {item.altText || 'Tour Image'}
                  </p>
                </div>
              </div>
            ))}
            {(!displayMedia || displayMedia.length === 0) && (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-bold text-primary font-headline">Gallery Empty</p>
                <p className="text-muted-foreground font-body">Upload your first images to start creating experiences.</p>
              </div>
            )}
          </div>
        )}
        {selectedUrls.length > 0 && (
          <div className="mt-6 flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
            <div className="flex items-center gap-2">
              <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{selectedUrls.length}</span>
              <span className="text-sm font-medium text-primary">Images selected</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => onSelect([])}>Clear Selection</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
