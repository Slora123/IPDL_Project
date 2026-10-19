import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Loader2, CheckCircle, XCircle, Globe, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/contexts/PreferencesContext";
import api from "@/lib/api";

type Stage =
  | "idle"
  | "listening"
  | "processing_speech"
  | "converting_english"
  | "understanding_transaction"
  | "ready_to_confirm"
  | "saving"
  | "done"
  | "error";

interface TransactionPreview {
  type: "income" | "expense";
  amount: number;
  item: string;
  category: string;
  date?: string;
  paymentMethod?: string;
  source?: string;
  voiceInput?: string;
  language?: string;
}

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  listening: "🎙️ Listening...",
  processing_speech: "🔄 Transcribing speech...",
  converting_english: "🌐 Converting to English...",
  understanding_transaction: "🧠 Understanding transaction...",
  ready_to_confirm: "✅ Ready to confirm",
  saving: "💾 Saving transaction...",
  done: "✅ Saved!",
  error: "❌ Error",
};

export function VoiceButton({ onTransactionSaved }: { onTransactionSaved?: () => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionPreview, setTransactionPreview] = useState<TransactionPreview | null>(null);
  const [transcript, setTranscript] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { language } = usePreferences();

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
      let selectedMimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';

      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        clearTimer();
        setRecordingTime(0);

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStage("listening");

      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

      // Auto-stop after 12 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, 12000);

    } catch (error: any) {
      setStage("error");
      const msg = error.name === 'NotAllowedError'
        ? "Microphone permission denied. Please allow microphone access in your browser settings."
        : error.name === 'NotFoundError'
        ? "No microphone found. Please connect a microphone and try again."
        : error.message || "Could not access microphone.";
      setErrorMessage(msg);
      toast({ title: "Microphone Error", description: msg, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStage("processing_speech");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    setRecordingTime(0);
    setStage("idle");
    toast({ title: "Cancelled", description: "Recording cancelled." });
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Send to SarvamAI transcribe+translate pipeline
      setStage("processing_speech");

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('target_lang', language || 'en-IN');

      setStage("converting_english");
      const response = await api.post('/api/voice/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      setStage("understanding_transaction");

      if (!response.data.success) {
        setStage("error");
        const msg = response.data.message || 'No transaction detected. Try: "I spent 250 rupees on groceries"';
        setErrorMessage(msg);
        toast({ title: "No Transaction Found", description: msg, variant: "destructive" });
        return;
      }

      // Step 2: Show transcription + parsed transaction for user review
      setTranscript(response.data.transcript || '');
      setEnglishText(response.data.englishTranslation || '');
      setTransactionPreview(response.data.transaction);
      setStage("ready_to_confirm");
      setShowConfirmation(true);

    } catch (error: any) {
      setStage("error");
      const msg = error.response?.data?.error || error.message || "Failed to process audio.";
      setErrorMessage(msg);
      toast({ title: "Processing Error", description: msg, variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    if (!transactionPreview) return;
    setStage("saving");
    try {
      await api.post('/api/transactions', {
        ...transactionPreview,
        source: 'voice',
        voiceInput: transcript,
      });

      setStage("done");
      setShowConfirmation(false);
      setTransactionPreview(null);
      setTranscript("");
      setEnglishText("");

      toast({
        title: "✅ Transaction Saved!",
        description: `${transactionPreview.type === 'income' ? 'Income' : 'Expense'}: ₹${transactionPreview.amount.toLocaleString()} — ${transactionPreview.item}`,
      });

      // Trigger parent refresh
      onTransactionSaved?.();

      setTimeout(() => setStage("idle"), 1500);
    } catch (error: any) {
      setStage("error");
      const msg = error.response?.data?.error || "Failed to save transaction.";
      setErrorMessage(msg);
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setTransactionPreview(null);
    setTranscript("");
    setEnglishText("");
    setStage("idle");
    toast({ title: "Cancelled", description: "Transaction not saved." });
  };

  const handleButtonClick = () => {
    if (stage === "listening") { stopRecording(); return; }
    if (stage === "idle" || stage === "done" || stage === "error") startRecording();
  };

  const isRecording = stage === "listening";
  const isProcessing = ["processing_speech", "converting_english", "understanding_transaction", "saving"].includes(stage);

  return (
    <>
      {/* Fixed Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative flex flex-col items-center gap-2">
          {/* Status label above button */}
          {stage !== "idle" && (
            <div className="text-xs font-medium bg-background border rounded-full px-3 py-1 shadow text-center whitespace-nowrap animate-in fade-in duration-200">
              {STAGE_LABELS[stage]}
            </div>
          )}

          <Button
            id="voice-button"
            onClick={handleButtonClick}
            disabled={isProcessing || stage === "saving"}
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-all ${
              isRecording ? "animate-pulse ring-4 ring-destructive/30" : ""
            }`}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Recording timer */}
          {isRecording && (
            <div className="text-xs font-bold text-destructive animate-pulse">
              {recordingTime}s
            </div>
          )}

          {/* Cancel button during recording */}
          {isRecording && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
              onClick={cancelRecording}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transactionPreview?.type === "income" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Confirm Transaction
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {transcript && (
                <span className="block text-xs text-muted-foreground">
                  🎙️ Heard: <em>"{transcript}"</em>
                </span>
              )}
              {englishText && englishText !== transcript && (
                <span className="block text-xs text-muted-foreground">
                  <Globe className="inline h-3 w-3 mr-1" />
                  English: <em>"{englishText}"</em>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Main amount display */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              transactionPreview?.type === "income"
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}>
              <div className="flex items-center gap-2">
                {transactionPreview?.type === "income" ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-semibold capitalize">{transactionPreview?.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className={`text-2xl font-bold ${transactionPreview?.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  ₹{transactionPreview?.amount?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="font-medium text-sm line-clamp-2">{transactionPreview?.item}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <Badge variant="secondary" className="text-xs">{transactionPreview?.category}</Badge>
              </div>
              {transactionPreview?.date && (
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-medium text-sm">{transactionPreview.date}</p>
                </div>
              )}
              {transactionPreview?.paymentMethod && (
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <p className="font-medium text-sm">{transactionPreview.paymentMethod}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              ❌ Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={stage === "saving"}
              className={transactionPreview?.type === "income"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-primary hover:bg-primary/90"}
            >
              {stage === "saving" ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              ) : (
                "✅ Confirm & Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}