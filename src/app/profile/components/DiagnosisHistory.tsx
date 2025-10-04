
'use client';

import { useState, useEffect } from 'react';
import type { DiagnosisHistoryEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDiagnosisHistoryAction } from '@/lib/actions';
import { AlertTriangle, Inbox, Stethoscope, Brain, User, Check, Clock, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { LeafLoader } from '@/components/ui/leaf-loader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const statusConfig = {
    pending_expert: { label: "Pending Expert Review", icon: Clock, className: "bg-yellow-500 text-white" },
    expert_reviewed: { label: "Expert Reviewed", icon: Check, className: "bg-green-600 text-white" },
    ai_diagnosed: { label: "AI Diagnosed", icon: Brain, className: "bg-blue-500 text-white" },
    closed: { label: "Closed", icon: Check, className: "bg-gray-500 text-white" },
    ai_skipped: { label: "Submitted to Expert", icon: User, className: "bg-purple-500 text-white" },
};

export default function DiagnosisHistory() {
  const [history, setHistory] = useState<DiagnosisHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      const result = await getUserDiagnosisHistoryAction(currentUser.uid);
      if (result.history) {
        setHistory(result.history);
      } else {
        setError(result.error || 'Failed to fetch diagnosis history.');
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LeafLoader size={32} />
        <p className="ml-2 text-muted-foreground">Loading your diagnosis history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">No Queries Yet</p>
        <p className="text-sm text-muted-foreground mt-1">You haven't submitted any queries for diagnosis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {history.map((entry) => {
          const StatusIcon = entry.status ? statusConfig[entry.status]?.icon || Stethoscope : Stethoscope;
          const statusLabel = entry.status ? statusConfig[entry.status]?.label : 'Unknown Status';
          const statusClassName = entry.status ? statusConfig[entry.status]?.className : 'bg-gray-400';

          return (
            <div key={entry.id} className="border rounded-lg p-4 space-y-4 shadow-sm">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                   <Badge className={`${statusClassName} capitalize flex items-center gap-1.5 mb-2`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                   </Badge>
                  <p className="text-sm text-muted-foreground">
                    Requested {entry.timestamp ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                {entry.photoURL && (
                   <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Eye className="h-4 w-4" /> View Image
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Submitted Crop Image</DialogTitle>
                      </DialogHeader>
                      <div className="relative aspect-video w-full mt-2 rounded-md overflow-hidden">
                        <Image src={entry.photoURL} alt="Crop diagnosis image" layout="fill" objectFit="contain" />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={entry.id!}>
                  <AccordionTrigger>View Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-base mb-1">Your Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{entry.description}</p>
                      </div>

                      {entry.diagnosis && (
                        <div className="p-3 bg-secondary/30 rounded-md">
                          <h4 className="font-semibold text-base mb-2 flex items-center gap-2"><Brain className="text-primary"/> AI Diagnosis</h4>
                          <p><strong>Disease:</strong> {entry.diagnosis.disease}</p>
                          <p><strong>Confidence:</strong> {(entry.diagnosis.confidence * 100).toFixed(0)}%</p>
                          <p className="mt-2"><strong>Treatment:</strong> {entry.diagnosis.treatmentRecommendations}</p>
                        </div>
                      )}

                      {entry.expertDiagnosis && (
                        <div className="p-3 bg-green-100/60 dark:bg-green-900/30 rounded-md border border-green-500/50">
                          <h4 className="font-semibold text-base mb-2 flex items-center gap-2"><User className="text-green-600"/> Expert's Review</h4>
                           <p><strong>Diagnosis:</strong> {entry.expertDiagnosis}</p>
                           {entry.expertComments && <p className="mt-2"><strong>Comments:</strong> {entry.expertComments}</p>}
                           <p className="text-xs text-muted-foreground mt-2">
                             Reviewed {entry.expertReviewedAt ? formatDistanceToNow(new Date(entry.expertReviewedAt), { addSuffix: true }) : ''}
                           </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          );
        })}
      </div>
    </div>
  );
}

    