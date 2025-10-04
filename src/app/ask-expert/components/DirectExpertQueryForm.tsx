'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, UserCheck, Send } from 'lucide-react';
import { submitExpertQueryAction } from '@/lib/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LeafLoader } from '@/components/ui/leaf-loader';
import { Label } from '@/components/ui/label';

export default function DirectExpertQueryForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image file is too large. Please upload an image smaller than 5MB.');
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the input
        }
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Authentication Required' });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get('image') as File;
    const description = formData.get('description') as string;
    
    if (!imageFile || imageFile.size === 0) {
      setError('Please select an image file.');
      return;
    }
    if (!description || description.trim().length < 10) {
      setError('Please provide a description of at least 10 characters.');
      return;
    }
    
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitExpertQueryAction(formData);

      if (result.success) {
        setSuccess(true);
        toast({
          title: "Query Submitted Successfully",
          description: "An expert will review your query. You can now see it in your profile's query history.",
        });
        formRef.current?.reset();
        setPreviewImage(null);
      } else {
        setError(result.error || 'An unknown submission error occurred.');
      }
    });
  };

  if (success) {
    return (
      <Card className="shadow-xl rounded-xl text-center">
        <CardHeader>
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle>Query Sent!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your query has been successfully submitted to our experts. They will review it and you will receive a notification once they respond. You can check the status in your diagnosis history.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setSuccess(false)} className="w-full">Submit Another Query</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><UserCheck className="text-primary" /> Submit Query to Expert</CardTitle>
          <CardDescription>Provide an image and a detailed description of the issue. Login required.</CardDescription>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
             {currentUser && <input type="hidden" name="userId" value={currentUser.uid} />}
            <div>
              <Label htmlFor="image-upload">Crop Image</Label>
              <Input
                id="image-upload"
                name="image"
                type="file"
                accept="image/*"
                required
                ref={fileInputRef}
                onChange={handleImageChange}
                className="mt-1 file:text-sm file:font-medium file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-1.5 hover:file:bg-primary/20"
                disabled={!currentUser || isPending}
              />
            </div>

            {previewImage && (
              <div className="mt-4 border rounded-lg overflow-hidden aspect-video relative w-full max-w-md mx-auto">
                <Image src={previewImage} alt="Crop preview" layout="fill" objectFit="contain" data-ai-hint="leaf plant" />
              </div>
            )}
            
            <div>
                <Label htmlFor="description">Detailed Description of Problem</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="e.g., The leaves are turning yellow with brown spots, starting from the edges. The problem started about a week ago..."
                    rows={6}
                    required
                    minLength={10}
                    disabled={!currentUser || isPending}
                    className="mt-1"
                />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
             {!currentUser && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Required</AlertTitle>
                <AlertDescription>You must be logged in to submit a query.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!currentUser || isPending} className="w-full">
              {isPending ? <LeafLoader size={16} className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
              {isPending ? 'Submitting...' : 'Send Query to Expert'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
