'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Check, Plus, Loader2, Search, Upload, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

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

/**
 * Resizes an image file to ensure it fits within Firestore document limits and performance guidelines.
 */
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
        // Using JPEG with 0.7 quality to keep payload sizes reasonable
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

export function ImageLibrary({ onSelect, selectedUrls = [], multiSelect = true }: ImageLibraryProps) {
  const { firestore } = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading: isMediaLoading } = useCollection<MediaItem>(mediaQuery);

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
        toast({ 
          variant: "destructive", 
          title: "Process Error", 
          description: "Could not optimize image. Try a smaller file." 
        });
      } finally {
        setIsAdding(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else if (!user && !isAuthLoading) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be signed in to upload images." });
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

  const filteredMedia = media?.filter(item => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (item.altText?.toLowerCase().includes(searchLower)) ||
      (item.url.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    // Sort by uploadedAt timestamp, handling potential nulls from optimistic updates
    const timeA = a.uploadedAt?.toMillis?.() || a.uploadedAt?.seconds * 1000 || Date.now();
    const timeB = b.uploadedAt?.toMillis?.() || b.uploadedAt?.seconds * 1000 || Date.now();
    return timeB - timeA;
  });

  // We are loading if the database query is loading, the auth is loading, 
  // or we haven't received the initial data snapshot yet.
  const isSyncing = isMediaLoading || isAuthLoading || (media === null);

  return (
    <div className="space-y-4 border rounded-3xl p-6 bg-white shadow-inner">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-bold text-primary">Media Library Browser</Label>
            <p className="text-xs text-muted-foreground">Select images for this experience</p>
          </div>
          <div className="bg-primary/5 px-3 py-1 rounded-full">
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">
              {selectedUrls.length} Selected
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter library..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-11 text-sm pl-10 rounded-full bg-muted/30 border-none"
            />
          </div>
          
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isAdding || isAuthLoading}
            variant="outline"
            className="rounded-full h-11 border-accent/20 text-accent hover:bg-accent/5 px-6"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {isAdding ? "Processing..." : "Quick Upload"}
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <ScrollArea className="h-[300px] rounded-2xl border bg-muted/10 p-4">
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground font-medium">Syncing images...</p>
          </div>
        ) : (
          <>
            {filteredMedia && filteredMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div 
                    key={item.id} 
                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all duration-200 hover:shadow-lg ${
                      selectedUrls.includes(item.url) ? "border-accent ring-4 ring-accent/20" : "border-transparent"
                    }`}
                    onClick={() => toggleSelection(item.url)}
                  >
                    <NextImage 
                      src={item.url} 
                      alt={item.altText || 'Media'} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    
                    {/* Selected Overlay */}
                    {selectedUrls.includes(item.url) && (
                      <div className="absolute inset-0 bg-accent/30 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-accent text-white rounded-full p-1.5 shadow-xl scale-110">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </div>
                      </div>
                    )}
                    
                    {/* Info Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white font-medium truncate">{item.altText}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-primary font-headline">Gallery Empty</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">
                  {searchQuery ? "No images match your search." : "Use 'Quick Upload' to add images from your device or the Media Library."}
                </p>
              </div>
            )}
          </>
        )}
      </ScrollArea>
      
      <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg">
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> Tip: Click images to select/deselect them.
        </span>
        <span className="italic font-medium text-accent">Images auto-optimized on upload</span>
      </div>
    </div>
  );
}
