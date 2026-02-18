
"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useState, useRef } from "react";
import { Trash2, Plus, Loader2, Search, Grid, List, Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

/**
 * Resizes an image file to ensure it fits within Firestore document limits.
 * Aggressively targets 800px and 0.6 quality for prototype stability.
 */
const resizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<string> => {
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
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading } = useCollection<MediaItem>(mediaQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0 || !firestore) return;
    
    setIsUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const compressedDataUrl = await resizeImage(file);
        
        const mediaData = {
          url: compressedDataUrl,
          type: 'image',
          altText: file.name,
          uploadedAt: serverTimestamp(),
        };
        
        addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
      }
      
      toast({
        title: "Upload Started",
        description: `Processing ${selectedFiles.length} images. They will appear shortly.`,
      });
      setSelectedFiles([]);
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Error processing images. Ensure they are valid image files.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "media", id));
    toast({
      title: "Media Deleted",
      description: "The item has been removed from the library."
    });
  };

  const filteredMedia = media?.filter(item => 
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.altText?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const timeA = a.uploadedAt?.toMillis?.() || 0;
    const timeB = b.uploadedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Media Library</h1>
            <p className="text-muted-foreground mt-1">Manage images and videos for your tours and workshops.</p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 h-12 flex items-center gap-2 shadow-lg shadow-accent/20">
                <Plus className="w-5 h-5" /> Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                  <Upload className="w-6 h-6 text-accent" /> Upload Experience Images
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium">Click to select files or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">Images optimized for Firestore storage.</p>
                    <Input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider">Selected Files ({selectedFiles.length})</Label>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs">
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-muted-foreground ml-2">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); setSelectedFiles([]); }} className="rounded-full" disabled={isUploading}>Cancel</Button>
                <Button 
                  onClick={handleBatchUpload} 
                  disabled={isUploading || selectedFiles.length === 0}
                  className="bg-accent hover:bg-accent/90 rounded-full min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : "Start Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search your library..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-muted/30 border-none h-10"
                />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="icon" className="text-primary rounded-full bg-muted/50"><Grid className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full hover:bg-muted/50"><List className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                  <p className="text-muted-foreground animate-pulse">Loading your assets...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {filteredMedia?.map((item) => (
                    <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm border border-border hover:shadow-xl hover:border-accent/50 transition-all duration-300">
                      <NextImage 
                        src={item.url} 
                        alt={item.altText || 'Media'} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized // Recommended for data URIs in prototype
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="rounded-full w-10 h-10 shadow-lg"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-[10px] text-white truncate text-center">{item.altText}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(!filteredMedia || filteredMedia.length === 0) && (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary">No assets found</p>
                          <p className="text-muted-foreground max-w-xs mx-auto">Select images from your computer to start building your library.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsUploadDialogOpen(true)}
                          className="rounded-full mt-2"
                        >
                          Select First Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
