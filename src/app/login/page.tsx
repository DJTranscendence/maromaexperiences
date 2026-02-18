"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, formData.email, formData.password);
      toast({ title: "Welcome back", description: "You are being signed in..." });
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "Sign In Failed", 
        description: err.message || "Please check your credentials and try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await initiateEmailSignUp(auth, formData.email, formData.password);
      toast({ title: "Account created", description: "Welcome to Maroma Experiences!" });
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "Sign Up Failed", 
        description: err.message || "An error occurred during account creation." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/30">
              <TabsTrigger value="signin" className="data-[state=active]:bg-background">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-background">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
                  <CardDescription>Sign in to your Maroma account to manage your bookings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="alex@example.com" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary rounded-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Create Account</CardTitle>
                  <CardDescription>Join Maroma for curated experiences and workshops.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="alex@example.com" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-accent rounded-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
