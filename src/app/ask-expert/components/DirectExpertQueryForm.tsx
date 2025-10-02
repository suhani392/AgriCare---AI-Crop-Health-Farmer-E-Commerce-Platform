
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, AlertTriangle, CheckCircle2, UserCheck, Send } from 'lucide-react';
import { submitDirectExpertQueryAction } from '@/lib/actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadImageForDiagnosis } from '@/lib/firebase/storage';
import { LeafLoader } from '@/components/ui/leaf-loader';

const directQueryFormSchema = z.object({
  image: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, 'Please upload an image of the crop.'),
  description: z.string().min(10, 'Please provide a detailed description of at least 10 characters.').max(500, 'Description must be 500 characters or less.'),
});

type DirectQueryFormValues = z.infer<typeof directQueryFormSchema>;

export default function DirectExpertQueryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<DirectQueryFormValues>({
    resolver: zodResolver(directQueryFormSchema),
    defaultValues: {
      description: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('image', event.target.files!);
    } else {
      setPreviewImage(null);
    }
  };

  const onSubmit: SubmitHandler<DirectQueryFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    if (!currentUser) {
      setError('You must be logged in to ask an expert.');
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit a query.",
      });
      return;
    }

    try {
      const file = data.image[0];
      const photoURL = await uploadImageForDiagnosis(file, currentUser.uid);
      const result = await submitDirectExpertQueryAction({ photoURL, description: data.description }, currentUser.uid);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Query Submitted Successfully",
          description: "An expert will review your query. You will be notified of their response.",
          action: <CheckCircle2 className="text-green-500" />,
        });
        form.reset();
        setPreviewImage(null);
      } else {
        setError(result.error || 'Failed to submit query. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {isSuccess ? (
        <Card className="shadow-xl rounded-xl text-center">
          <CardHeader>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Query Sent!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your query has been successfully submitted to our experts. They will review it and you will receive a notification once they respond. You can check the status in your diagnosis history.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsSuccess(false)} className="w-full">Submit Another Query</Button>
          </CardFooter>
        </Card>
      ) : (
        <Form {...form}>
          <Card className="shadow-xl rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl"><UserCheck className="text-primary" /> Submit Query to Expert</CardTitle>
              <CardDescription>Provide an image and a detailed description of the issue. Login required.</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="file:text-sm file:font-medium file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-1.5 hover:file:bg-primary/20"
                          disabled={!currentUser || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {previewImage && (
                  <div className="mt-4 border rounded-lg overflow-hidden aspect-video relative w-full max-w-md mx-auto">
                    <Image src={previewImage} alt="Crop preview" layout="fill" objectFit="contain" data-ai-hint="leaf plant" />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description of Problem</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., The leaves are turning yellow with brown spots, starting from the edges. The problem started about a week ago..." {...field} rows={6} disabled={!currentUser || isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Submission Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!currentUser || isLoading} className="w-full">
                  {isLoading ? <LeafLoader size={16} className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Query to Expert
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Form>
      )}
    </div>
  );
}
