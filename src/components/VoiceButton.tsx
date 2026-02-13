import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VoiceButton() {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      toast({
        title: "Voice Recording Started",
        description: "Speak your transaction: '50 रुपये दूध खरीदी' or '3 cold drinks बेचे 90 रुपये में'",
      });
      
      // Simulate recording for demo
      setTimeout(() => {
        setIsRecording(false);
        toast({
          title: "Transaction Recorded!",
          description: "Added: ₹50 milk expense to your records",
          variant: "default",
        });
      }, 3000);
    } else {
      toast({
        title: "Recording Stopped",
        description: "Processing your voice input...",
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleVoiceToggle}
        className={`
          h-16 w-16 rounded-full shadow-floating transition-smooth
          ${isRecording 
            ? 'bg-destructive hover:bg-destructive/90 animate-pulse-gentle' 
            : 'bg-gradient-primary hover:scale-110 transform'
          }
        `}
      >
        {isRecording ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </Button>
      
      {isRecording && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-slide-up">
          <div className="bg-destructive text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
            Recording... Speak now
          </div>
        </div>
      )}
    </div>
  );
}