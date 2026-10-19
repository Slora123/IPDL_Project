import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, CheckCircle, Receipt, AlertCircle, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

interface ScannedBill {
  vendorName: string | null;
  date: string | null;
  invoiceNumber: string | null;
  items: BillItem[];
  subtotal: number | null;
  tax: number;
  total: number;
  currencySymbol: string;
}

type ScanStage = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function ScanBill() {
  const [scanStage, setScanStage] = useState<ScanStage>("idle");
  const [scanResult, setScanResult] = useState<ScannedBill | null>(null);
  const [editedResult, setEditedResult] = useState<ScannedBill | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();



  const STAGE_LABELS: Record<ScanStage, string> = {
    idle: "",
    uploading: "Uploading image...",
    analyzing: "Analyzing bill with AI...",
    done: "Analysis complete!",
    error: "Analysis failed",
  };

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1600;
          if (width > max || height > max) {
            if (width > height) {
              height = Math.round((height * max) / width);
              width = max;
            } else {
              width = Math.round((width * max) / height);
              height = max;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Image compression failed"));
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error("Invalid image file"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    setScanResult(null);
    setEditedResult(null);
    setIsEditing(false);
    setScanStage("uploading");

    try {
      const compressedBlob = await resizeImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, "scanned-bill.jpg");

      setScanStage("analyzing");
      const response = await api.post("/api/bills/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      if (!response.data.isBill) {
        setScanStage("error");
        const msg = response.data.message || "This image does not appear to be a valid bill or receipt.";
        setErrorMessage(msg);
        toast({ title: "Not a Bill", description: msg, variant: "destructive" });
        return;
      }

      setScanResult(response.data.transaction);
      setEditedResult(response.data.transaction);
      setScanStage("done");
      toast({ title: "✅ Bill Scanned!", description: "Review the extracted details below." });
    } catch (error: any) {
      setScanStage("error");
      const msg = error.response?.data?.error || error.message || "Failed to analyze the image.";
      setErrorMessage(msg);
      toast({ title: "Scan Failed", description: msg, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!editedResult) return;

    if (!editedResult.total || editedResult.total <= 0) {
      toast({ title: "Invalid Total", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/api/bills/confirm", { transaction: editedResult });
      toast({
        title: "✅ Transaction Saved!",
        description: `₹${editedResult.total.toFixed(2)} expense from ${editedResult.vendorName || "Unknown Vendor"} recorded.`,
      });
      setScanResult(null);
      setEditedResult(null);
      setScanStage("idle");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to save transaction.";
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setScanResult(null);
    setEditedResult(null);
    setScanStage("idle");
    setErrorMessage("");
  };

  const updateField = (field: keyof ScannedBill, value: any) => {
    setEditedResult(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Bill</h1>
        <p className="text-muted-foreground">Upload or scan a receipt to auto-capture expenses using AI OCR.</p>
      </div>

      <div className="space-y-6">
        {/* Upload / Capture zone */}
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
              {scanStage === "analyzing" || scanStage === "uploading" ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : scanStage === "error" ? (
                <AlertCircle className="h-10 w-10 text-destructive" />
              ) : (
                <Receipt className="h-10 w-10 text-primary" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {scanStage === "uploading" || scanStage === "analyzing"
                  ? STAGE_LABELS[scanStage]
                  : scanStage === "error"
                  ? "Scan Failed"
                  : "Upload a receipt"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {scanStage === "uploading" || scanStage === "analyzing"
                  ? "Please wait while AI extracts details from your bill..."
                  : scanStage === "error"
                  ? errorMessage
                  : "Take a picture of a bill or upload an image to automatically add it as an expense."}
              </p>
            </div>

            {(scanStage === "idle" || scanStage === "done" || scanStage === "error") && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button asChild className="bg-gradient-primary cursor-pointer">
                  <label>
                    <Camera className="mr-2 h-4 w-4" /> Use Camera
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onClick={(e) => (e.currentTarget.value = "")}
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>

                <Button asChild variant="outline" className="cursor-pointer">
                  <label>
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(e) => (e.currentTarget.value = "")}
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result card */}
        {editedResult && (
          <Card className="shadow-card border-success/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Receipt Details
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  {isEditing ? "Done Editing" : "Edit"}
                </Button>
              </div>
              <CardDescription>
                {editedResult.vendorName || "Unknown Vendor"} • {editedResult.date || "Unknown Date"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Editable header fields */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <Label className="text-xs">Vendor Name</Label>
                    <Input
                      className="h-8 mt-1"
                      value={editedResult.vendorName || ""}
                      onChange={e => updateField("vendorName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date (YYYY-MM-DD)</Label>
                    <Input
                      type="date"
                      className="h-8 mt-1"
                      value={editedResult.date || ""}
                      onChange={e => updateField("date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total Amount (₹)</Label>
                    <Input
                      type="number"
                      className="h-8 mt-1"
                      value={editedResult.total}
                      onChange={e => updateField("total", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tax Amount (₹)</Label>
                    <Input
                      type="number"
                      className="h-8 mt-1"
                      value={editedResult.tax}
                      onChange={e => updateField("tax", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}

              {/* Items table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium">Item</th>
                      <th className="py-2 px-4 text-center font-medium">Qty</th>
                      <th className="py-2 px-4 text-right font-medium">Unit Price</th>
                      <th className="py-2 px-4 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedResult.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-4">{item.name}</td>
                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                        <td className="py-2 px-4 text-right">
                          {item.unitPrice != null ? `${editedResult.currencySymbol}${item.unitPrice.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {item.totalPrice != null ? `${editedResult.currencySymbol}${item.totalPrice.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end justify-end space-y-1 pt-2">
                {editedResult.subtotal != null && (
                  <div className="flex items-center justify-between w-full max-w-[200px] text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>{editedResult.currencySymbol}{editedResult.subtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between w-full max-w-[200px] text-muted-foreground text-sm">
                  <span>Tax</span>
                  <span>{editedResult.currencySymbol}{(editedResult.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between w-full max-w-[200px] font-bold text-lg pt-1 border-t">
                  <span>Total</span>
                  <span>{editedResult.currencySymbol}{editedResult.total.toFixed(2)}</span>
                </div>
              </div>

              {isEditing && (
                <p className="text-xs text-muted-foreground text-center">
                  ✏️ Edit any incorrect values above before saving.
                </p>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
              <Button variant="ghost" onClick={handleDiscard} disabled={isSaving}>
                Discard
              </Button>
              <Button
                id="save-bill-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-primary"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                ) : (
                  "✅ Save as Expense"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
