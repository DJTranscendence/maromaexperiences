'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Check, Plus, Loader2, Search, Upload } from 'lucide-react';
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

export function ImageLibrary({ onSelect, selectedUrls = [], multiSelect = true }: ImageLibraryProps) {
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading } = useCollection<MediaItem>(mediaQuery);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && firestore) {
      setIsAdding(true);
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const mediaData = {
          url: dataUrl,
          type: 'image',
          altText: file.name,
          uploadedAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'media'), mediaData)
          .then(() => {
            toast({ title: "Media Added", description: "Image successfully added to the library." });
          })
          .finally(() => setIsAdding(false));
      };
      reader.readAsDataURL(file);
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

  const filteredMedia = media?.filter(item => 
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.altText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 border rounded-2xl p-4 bg-muted/10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold text-primary">Media Library</Label>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            {selectedUrls.length} Selected
          </span>
        </div>
        
        {/* Add New Media Inline */}
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isAdding}
            size="sm"
            variant="outline"
            className="w-full flex items-center gap-2 rounded-full h-9 bg-white border-accent/20 text-accent hover:bg-accent/5"
          >
            {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            <span className="text-xs">Select Image from Device</span>
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        {/* Search Media */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input 
            placeholder="Search library..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 rounded-full bg-white"
          />
        </div>
      </div>

      <ScrollArea className="h-64 rounded-xl border bg-white p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredMedia?.map((item) => (
              <div 
                key={item.id} 
                className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedUrls.includes(item.url) ? "border-accent ring-2 ring-accent/20" : "border-transparent"
                }`}
                onClick={() => toggleSelection(item.url)}
              >
                <NextImage 
                  src={item.url} 
                  alt={item.altText || 'Media'} 
                  fill 
                  className="object-cover"
                />
                {selectedUrls.includes(item.url) && (
                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                    <div className="bg-accent text-white rounded-full p-0.5 shadow-lg">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-white truncate">{item.altText}</p>
                </div>
              </div>
            ))}
            {(!filteredMedia || filteredMedia.length === 0) && (
              <div className="col-span-full text-center py-10">
                <p className="text-xs text-muted-foreground">No images found</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      <p className="text-[10px] text-muted-foreground italic">
        * Click images to select/deselect them for this experience.
      </p>
    </div>
  );
}
