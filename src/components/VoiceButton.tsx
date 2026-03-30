import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import axios from "axios";

interface TransactionPreview {
  type: 'income' | 'expense';
  amount: number;
  item: string;
  category: string;
  transcript: string;
}

export function VoiceButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionPreview, setTransactionPreview] = useState<TransactionPreview | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { token } = useAuth();
  const { language } = usePreferences();

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported mime type
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Using mime type:', mimeType);
          break;
        }
      }

      if (!selectedMimeType) {
        // Fallback: no mime type specified (browser will choose)
        console.log('No specific mime type supported, using browser default');
      }

      // Create MediaRecorder with supported mime type
      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob with detected mime type
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        console.log('Audio blob created:', audioBlob.type, audioBlob.size, 'bytes');

        // Send to backend
        await processAudio(audioBlob);

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "🎤 Recording...",
        description: "Speak your transaction clearly",
      });

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 10000);

    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: error.message || "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      toast({
        title: "Processing...",
        description: "Transcribing audio with Whisper...",
      });
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      console.log('Sending voice for processing with language:', language || 'en');
      formData.append('language', language || 'en');

      // Send to backend
      const response = await axios.post(
        `${""}/api/voice/process`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        // Show confirmation dialog
        setTransactionPreview({
          type: response.data.transaction.type,
          amount: response.data.transaction.amount,
          item: response.data.transaction.item,
          category: response.data.transaction.category,
          transcript: response.data.transcript
        });
        setShowConfirmation(true);
      } else {
        toast({
          title: "No Transaction Detected",
          description: response.data.transcript
            ? `Heard: "${response.data.transcript}"\n\nTry: 'I earned 500 rupees' or 'spent 50 on milk'`
            : "Could not detect speech. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    toast({
      title: "✅ Transaction Added!",
      description: `${transactionPreview?.type === 'income' ? 'Income' : 'Expense'}: ₹${transactionPreview?.amount}`,
      variant: "default",
    });

    setShowConfirmation(false);
    setTransactionPreview(null);

    // Reload to show new transaction
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setTransactionPreview(null);
    toast({
      title: "Cancelled",
      description: "Transaction not saved.",
    });
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      {/* Fixed Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-all"
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6 animate-pulse" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {isRecording && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-destructive animate-pulse bg-background px-2 py-1 rounded-md shadow-sm">
              {recordingTime}s
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transactionPreview?.type === 'income' ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Confirm Transaction
            </DialogTitle>
            <DialogDescription>
              Heard: "{transactionPreview?.transcript}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-lg font-semibold capitalize">
                  {transactionPreview?.type}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">₹{transactionPreview?.amount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Item</p>
                <p className="font-medium">{transactionPreview?.item}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{transactionPreview?.category}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              ❌ Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-gradient-primary">
              ✅ Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}