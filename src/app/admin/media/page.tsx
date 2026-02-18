"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useState } from "react";
import { Trash2, Plus, Loader2, Search, Grid, List, Image as ImageIcon, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  uploadedAt: any;
}

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [urlsToUpload, setUrlsToUpload] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'media');
  }, [firestore]);

  const { data: media, isLoading } = useCollection<MediaItem>(mediaQuery);

  const handleBatchUpload = async () => {
    if (!urlsToUpload.trim() || !firestore) return;
    
    setIsUploading(true);
    const urls = urlsToUpload.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    
    try {
      for (const url of urls) {
        const mediaData = {
          url,
          type: 'image',
          altText: 'Uploaded experience image',
          uploadedAt: serverTimestamp(),
        };
        addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
      }
      
      toast({
        title: "Success",
        description: `Successfully added ${urls.length} images to the library.`,
      });
      setUrlsToUpload('');
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was an error adding the images.",
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
                  <ImageIcon className="w-6 h-6 text-accent" /> Batch Upload Images
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urls">Image URLs (one per line)</Label>
                  <Textarea 
                    id="urls"
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    className="min-h-[200px] rounded-2xl"
                    value={urlsToUpload}
                    onChange={(e) => setUrlsToUpload(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    * For this prototype, please provide direct image URLs.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} className="rounded-full">Cancel</Button>
                <Button 
                  onClick={handleBatchUpload} 
                  disabled={isUploading || !urlsToUpload.trim()}
                  className="bg-accent hover:bg-accent/90 rounded-full min-w-[120px]"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Upload"}
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
                        <p className="text-[10px] text-white truncate text-center">{item.url.split('/').pop()}</p>
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
                          <p className="text-muted-foreground max-w-xs mx-auto">Upload some images to start building your experience library.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsUploadDialogOpen(true)}
                          className="rounded-full mt-2"
                        >
                          Upload First Image
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
