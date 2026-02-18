"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useState, useRef, useMemo } from "react";
import { Trash2, Plus, Loader2, Search, Grid, Image as ImageIcon, Upload, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

/**
 * Resizes an image file to ensure it fits within document limits and performance guidelines.
 */
const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
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
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Using JPEG with 0.7 quality to keep payload sizes reasonable
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading: isMediaLoading } = useCollection<MediaItem>(mediaQuery);

  const filteredMedia = useMemo(() => {
    if (!media) return null;
    
    const items = media.filter(item => 
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.altText?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...items].sort((a, b) => {
      const timeA = a.uploadedAt?.toMillis?.() || a.uploadedAt?.seconds * 1000 || Date.now();
      const timeB = b.uploadedAt?.toMillis?.() || b.uploadedAt?.seconds * 1000 || Date.now();
      return timeB - timeA;
    });
  }, [media, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
    // Reset input so the same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files", description: "Please select at least one image to upload." });
      return;
    }

    if (!firestore || !user) {
      toast({ 
        variant: "destructive", 
        title: "Session Error", 
        description: "Your session is not ready. Please try refreshing the page." 
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          const compressedDataUrl = await resizeImage(file);
          
          const mediaData = {
            url: compressedDataUrl,
            type: 'image',
            altText: file.name,
            uploadedAt: serverTimestamp(),
          };
          
          addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
          successCount++;
        } catch (fileErr) {
          console.error(`Error processing ${file.name}:`, fileErr);
        }
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      
      if (successCount > 0) {
        toast({
          title: "Upload Process Started",
          description: `Processing ${successCount} images. They will appear in your gallery shortly.`,
        });
        setSelectedFiles([]);
        setIsUploadDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: "Could not prepare your images for upload. Please try smaller files.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "media", id));
    toast({
      title: "Image Removed",
      description: "The item has been deleted from your library."
    });
  };

  const isSyncing = isMediaLoading || isUserLoading || (!!mediaQuery && media === null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Media Library</h1>
            <p className="text-muted-foreground mt-1">Curate your visuals for tours and workshops.</p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 h-12 flex items-center gap-2 shadow-lg shadow-accent/20"
              >
                <Plus className="w-5 h-5" /> Add Images
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                  <Upload className="w-6 h-6 text-accent" /> New Images
                </DialogTitle>
                <DialogDescription>
                  Upload high-quality photos for your tours. Images will be optimized automatically.
                </DialogDescription>
              </DialogHeader>

              {(!user || isUserLoading) && (
                <Alert className="rounded-2xl bg-muted/50 border-none">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <AlertTitle>Verifying Session</AlertTitle>
                  <AlertDescription>
                    Please wait a moment while we synchronize your account.
                  </AlertDescription>
                </Alert>
              )}

              <div className="py-4 space-y-4">
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium">Click to select images</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG or PNG supported.</p>
                  <input 
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
                    <Label className="text-xs font-bold uppercase tracking-wider">Upload Queue ({selectedFiles.length})</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs">
                          <span className="truncate flex-1">{file.name}</span>
                          {!isUploading && (
                            <button 
                              className="text-muted-foreground hover:text-destructive p-1"
                              onClick={() => removeSelectedFile(i)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Processing Images...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); setSelectedFiles([]); }} className="rounded-full" disabled={isUploading}>Cancel</Button>
                <Button 
                  onClick={handleBatchUpload} 
                  disabled={isUploading || selectedFiles.length === 0 || !user}
                  className="bg-accent hover:bg-accent/90 rounded-full min-w-[140px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : "Start Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search gallery..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-muted/30 border-none h-10"
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="icon" className="text-primary rounded-full bg-muted/50"><Grid className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {isSyncing ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="text-muted-foreground font-body">Syncing images...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredMedia?.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm border border-border hover:shadow-xl transition-all duration-300">
                    <NextImage 
                      src={item.url} 
                      alt={item.altText || 'Media'} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="rounded-full w-10 h-10 shadow-lg"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!filteredMedia || filteredMedia.length === 0) && (
                  <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-bold text-primary font-headline">Gallery Empty</p>
                    <p className="text-muted-foreground mb-6 font-body">Your curated images will appear here once uploaded.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
