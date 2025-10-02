
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { DiagnosisHistoryEntry } from '@/types';
import { fetchPendingExpertQueriesAction, submitExpertDiagnosisAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Inbox, CheckCircle, Edit3, Eye, User, Brain } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { LeafLoader } from '@/components/ui/leaf-loader';


interface ExpertQueryManagementProps {
  reviewerUserId: string; // Can be admin or expert
}

interface ExpertReviewFormData {
  expertDiagnosis: string;
  expertComments: string;
}

export default function ExpertQueryManagement({ reviewerUserId }: ExpertQueryManagementProps) {
  const [queries, setQueries] = useState<DiagnosisHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedQuery, setSelectedQuery] = useState<DiagnosisHistoryEntry | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState<ExpertReviewFormData>({ expertDiagnosis: '', expertComments: '' });

  const fetchQueries = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchPendingExpertQueriesAction();
    if (result.queries) {
      setQueries(result.queries);
    } else {
      setError(result.error || 'Failed to fetch pending expert queries.');
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not load queries.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQueries();
  }, [reviewerUserId]);

  const handleOpenReviewDialog = (query: DiagnosisHistoryEntry) => {
    setSelectedQuery(query);
    setReviewFormData({ 
      expertDiagnosis: query.diagnosis?.disease || '', // Pre-fill with AI diagnosis or empty string
      expertComments: '' 
    });
    setIsReviewDialogOpen(true);
  };

  const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async () => {
    if (!selectedQuery || !selectedQuery.id) return;
    if (!reviewFormData.expertDiagnosis.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Expert diagnosis cannot be empty.' });
      return;
    }
    
    setIsSubmittingReview(true);
    const result = await submitExpertDiagnosisAction(
      reviewerUserId, 
      selectedQuery.id, 
      reviewFormData.expertDiagnosis, 
      reviewFormData.expertComments
    );
    
    if (result.success) {
      toast({ title: "Review Submitted", description: result.message || "Expert diagnosis saved successfully."});
      setIsReviewDialogOpen(false);
      fetchQueries(); // Refresh list
    } else {
      toast({ variant: 'destructive', title: 'Submission Failed', description: result.error || "Could not save expert review." });
    }
    setIsSubmittingReview(false);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LeafLoader size={32} />
        <p className="ml-2 text-muted-foreground">Loading pending queries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Failed to load queries</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-10">
        <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">No pending expert queries.</p>
        <p className="text-sm text-muted-foreground mt-1">All user requests for expert review have been addressed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableCaption>List of crop diagnoses awaiting expert review.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Requested</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Analysis</TableHead>
            <TableHead className="text-center w-[100px]">Image</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.map((query) => (
            <TableRow key={query.id}>
              <TableCell>
                {query.timestamp ? formatDistanceToNow(new Date(query.timestamp), { addSuffix: true }) : 'Unknown date'}
              </TableCell>
              <TableCell className="truncate max-w-[150px] text-xs">{query.userId}</TableCell>
              <TableCell>
                {query.diagnosis ? (
                    <>
                      <div className="font-medium flex items-center gap-2"><Brain className="h-4 w-4 text-purple-500" />{query.diagnosis.disease}</div>
                      <Badge variant="outline" className="mt-1">AI Conf: {(query.diagnosis.confidence * 100).toFixed(0)}%</Badge>
                    </>
                  ) : (
                    <div className="font-medium text-muted-foreground italic flex items-center gap-2"><User className="h-4 w-4 text-blue-500" />Direct Submission</div>
                  )}
              </TableCell>
              <TableCell className="text-center">
                {query.photoURL && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Eye className="h-5 w-5"/></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                      </DialogHeader>
                      <div className="relative aspect-video w-full mt-2 rounded-md overflow-hidden">
                        <Image src={query.photoURL} alt="Crop diagnosis image" layout="fill" objectFit="contain" />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </TableCell>
              <TableCell className="text-right">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenReviewDialog(query)}
                  >
                  <Edit3 className="mr-2 h-4 w-4" /> Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {selectedQuery && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Expert Review: {selectedQuery.diagnosis ? `AI Diagnosed "${selectedQuery.diagnosis.disease}"` : 'Direct User Query'}</DialogTitle>
              <DialogDescription>Provide your expert assessment for this diagnosis query.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <h4 className="font-medium mb-1 text-sm">Original User Description:</h4>
                <p className="text-sm text-muted-foreground p-3 border rounded-md bg-secondary/30 whitespace-pre-wrap">{selectedQuery.description}</p>
              </div>
              {selectedQuery.diagnosis && (
                <>
                <div>
                  <h4 className="font-medium mb-1 text-sm">AI Confidence:</h4>
                  <p className="text-sm text-muted-foreground p-2 border rounded-md bg-secondary/30">{(selectedQuery.diagnosis.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-sm">AI Treatment Recommendations:</h4>
                  <p className="text-sm text-muted-foreground p-3 border rounded-md bg-secondary/30 whitespace-pre-wrap">{selectedQuery.diagnosis.treatmentRecommendations}</p>
                </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="expertDiagnosis" className="text-sm font-medium">Your Diagnosis <span className="text-destructive">*</span></Label>
                <Input 
                  id="expertDiagnosis"
                  name="expertDiagnosis"
                  value={reviewFormData.expertDiagnosis} 
                  onChange={handleReviewInputChange}
                  disabled={isSubmittingReview}
                  placeholder="e.g., Downey Mildew, Nutrient Deficiency"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertComments" className="text-sm font-medium">Comments & Recommendations</Label>
                <Textarea 
                  id="expertComments"
                  name="expertComments" 
                  rows={5} 
                  value={reviewFormData.expertComments} 
                  onChange={handleReviewInputChange}
                  disabled={isSubmittingReview}
                  placeholder="Provide detailed comments, alternative treatments, or confirm AI findings..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={isSubmittingReview}>Cancel</Button>
              <Button onClick={handleReviewSubmit} disabled={isSubmittingReview}>
                {isSubmittingReview ? <LeafLoader size={16} className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />} 
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
