import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, CheckCircle, Receipt, AlertCircle, Edit2, ShoppingCart, TrendingUp } from "lucide-react";
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

const EXPENSE_CATEGORIES = [
  "Shopping", "Inventory", "Supplies", "Utilities", "Food & Dining",
  "Transport", "Rent", "Maintenance", "Marketing", "General",
];
const INCOME_CATEGORIES = [
  "Sales", "Service Revenue", "Product Sales", "Consulting", "Other Income",
];

export default function ScanBill() {
  const [scanStage, setScanStage] = useState<ScanStage>("idle");
  const [scanResult, setScanResult] = useState<ScannedBill | null>(null);
  const [editedResult, setEditedResult] = useState<ScannedBill | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Separate saving states to prevent double-submit on either button
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingSale,    setIsSavingSale]    = useState(false);
  const savedRef = useRef(false);  // prevents double-submit from rapid clicks

  // Sale-specific editable fields
  const [saleDescription, setSaleDescription] = useState("");
  const [saleCategory,    setSaleCategory]    = useState("Sales");
  const [expenseCategory, setExpenseCategory] = useState("Shopping");

  const { toast } = useToast();

  const STAGE_LABELS: Record<ScanStage, string> = {
    idle:      "",
    uploading: "Uploading image...",
    analyzing: "Analyzing bill with AI...",
    done:      "Analysis complete!",
    error:     "Analysis failed",
  };

  // ── Image resizing ──────────────────────────────────────────────────────────
  const resizeImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const max = 1600;
          if (width > max || height > max) {
            if (width > height) { height = Math.round((height * max) / width); width = max; }
            else                { width  = Math.round((width  * max) / height); height = max; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")),
            "image/jpeg", 0.85
          );
        };
        img.onerror = () => reject(new Error("Invalid image file"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  // ── File / camera handler ───────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    setScanResult(null);
    setEditedResult(null);
    setImageBase64(null);
    setIsEditing(false);
    savedRef.current = false;
    setSaleDescription("");
    setSaleCategory("Sales");
    setExpenseCategory("Shopping");
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
      setImageBase64(response.data.imageBase64 || null);
      setScanStage("done");

      // Pre-fill sale description from bill items
      const firstItem = response.data.transaction?.items?.[0]?.name;
      const itemCount  = response.data.transaction?.items?.length ?? 0;
      if (firstItem) {
        setSaleDescription(itemCount > 1 ? `${firstItem} + ${itemCount - 1} more` : firstItem);
      }

      toast({ title: "✅ Bill Scanned!", description: "Review the extracted details below." });
    } catch (error: any) {
      setScanStage("error");
      const msg = error.response?.data?.error || error.message || "Failed to analyze the image.";
      setErrorMessage(msg);
      toast({ title: "Scan Failed", description: msg, variant: "destructive" });
    }
  };

  // ── Save as Expense ─────────────────────────────────────────────────────────
  const handleSaveExpense = async () => {
    if (!editedResult || isSavingExpense || isSavingSale || savedRef.current) return;

    if (!editedResult.total || editedResult.total <= 0) {
      toast({ title: "Invalid Total", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }

    savedRef.current = true;
    setIsSavingExpense(true);
    try {
      await api.post("/api/bills/confirm", {
        transaction: { ...editedResult, category: expenseCategory },
        imageBase64,
      });
      toast({
        title: "✅ Expense Saved!",
        description: `₹${editedResult.total.toFixed(2)} expense from ${editedResult.vendorName || "Unknown Vendor"} recorded.`,
      });
      resetForm();
    } catch (error: any) {
      savedRef.current = false;
      const msg = error.response?.data?.error || "Failed to save expense.";
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSavingExpense(false);
    }
  };

  // ── Save as Sale (Income) ───────────────────────────────────────────────────
  const handleSaveSale = async () => {
    if (!editedResult || isSavingExpense || isSavingSale || savedRef.current) return;

    if (!editedResult.total || editedResult.total <= 0) {
      toast({ title: "Invalid Total", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }
    if (!saleDescription.trim()) {
      toast({ title: "Description Required", description: "Please enter a description for this sale.", variant: "destructive" });
      return;
    }

    savedRef.current = true;
    setIsSavingSale(true);
    try {
      await api.post("/api/bills/confirm-sale", {
        transaction: {
          ...editedResult,
          category: saleCategory,
          saleDescription: saleDescription.trim(),
        },
        imageBase64,
      });
      toast({
        title: "✅ Sale Recorded!",
        description: `₹${editedResult.total.toFixed(2)} revenue from "${saleDescription}" added to your income.`,
      });
      resetForm();
    } catch (error: any) {
      savedRef.current = false;
      const msg = error.response?.data?.error || "Failed to save sale.";
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSavingSale(false);
    }
  };

  const resetForm = () => {
    setScanResult(null);
    setEditedResult(null);
    setImageBase64(null);
    setScanStage("idle");
    setErrorMessage("");
    setIsEditing(false);
    setSaleDescription("");
    setSaleCategory("Sales");
    setExpenseCategory("Shopping");
    savedRef.current = false;
  };

  const handleDiscard = () => { resetForm(); };

  const updateField = (field: keyof ScannedBill, value: any) =>
    setEditedResult(prev => prev ? { ...prev, [field]: value } : prev);

  const isBusy = isSavingExpense || isSavingSale;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Bill</h1>
        <p className="text-muted-foreground">
          Upload or scan a receipt. Record it as an expense (purchase) or as a customer sale (revenue).
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Upload / Capture zone ──────────────────────────────────────── */}
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
                  : "Take a picture or upload an image. Then save it as an expense or as a customer sale."}
              </p>
            </div>

            {(scanStage === "idle" || scanStage === "done" || scanStage === "error") && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button asChild className="bg-gradient-primary cursor-pointer">
                  <label>
                    <Camera className="mr-2 h-4 w-4" /> Use Camera
                    <input
                      type="file" accept="image/*" capture="environment"
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
                      type="file" accept="image/*"
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

        {/* ── Scanned bill result card ───────────────────────────────────── */}
        {editedResult && (
          <Card className="shadow-card border-success/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Receipt Details
                </CardTitle>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs gap-1"
                  disabled={isBusy}
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
                    <Label className="text-xs">Vendor / Customer Name</Label>
                    <Input className="h-8 mt-1" value={editedResult.vendorName || ""}
                      onChange={e => updateField("vendorName", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Date (YYYY-MM-DD)</Label>
                    <Input type="date" className="h-8 mt-1" value={editedResult.date || ""}
                      onChange={e => updateField("date", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Total Amount (₹)</Label>
                    <Input type="number" className="h-8 mt-1" value={editedResult.total}
                      onChange={e => updateField("total", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">Tax Amount (₹)</Label>
                    <Input type="number" className="h-8 mt-1" value={editedResult.tax}
                      onChange={e => updateField("tax", parseFloat(e.target.value) || 0)} />
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

              {/* ── Action panels: Expense vs Sale ─────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Expense panel */}
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> Record as Expense (Purchase)
                  </p>
                  <div>
                    <Label className="text-xs">Expense Category</Label>
                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sale panel */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Record as Sale (Revenue)
                  </p>
                  <div>
                    <Label className="text-xs">Sale Description</Label>
                    <Input
                      className="h-8 mt-1 text-xs"
                      placeholder="e.g. Rice 5kg sold to Ramu"
                      value={saleDescription}
                      onChange={e => setSaleDescription(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Revenue Category</Label>
                    <Select value={saleCategory} onValueChange={setSaleCategory}>
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isEditing && (
                <p className="text-xs text-muted-foreground text-center">
                  ✏️ Edit any incorrect values above before saving.
                </p>
              )}
            </CardContent>

            {/* ── Footer: Discard + two action buttons ───────────────────── */}
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t p-4 bg-muted/20">
              <Button variant="ghost" onClick={handleDiscard} disabled={isBusy}>
                Discard
              </Button>

              <div className="flex flex-wrap gap-2">
                {/* Add to Expense */}
                <Button
                  id="save-bill-expense-btn"
                  variant="outline"
                  onClick={handleSaveExpense}
                  disabled={isBusy}
                  className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  {isSavingExpense ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" />Add to Expense</>
                  )}
                </Button>

                {/* Add to Transaction (Sale / Income) */}
                <Button
                  id="save-bill-sale-btn"
                  onClick={handleSaveSale}
                  disabled={isBusy}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90"
                >
                  {isSavingSale ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                  ) : (
                    <><TrendingUp className="h-4 w-4 mr-2" />Add to Transaction</>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Bill image preview (thumbnail) */}
        {imageBase64 && scanStage === "done" && editedResult && (
          <Card className="shadow-card">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-2">Scanned Image Preview</p>
              <img
                src={imageBase64}
                alt="Scanned bill"
                className="w-full max-h-48 object-contain rounded border border-border"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
