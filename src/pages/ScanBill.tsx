import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, CheckCircle, Receipt, AlertCircle, Edit2, ShoppingCart, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";

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

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function apiErrorMessage(error: any, fallback: string): string {
  if (error?.response?.data?.error) {
    const requestId = error.response.data.requestId;
    return requestId ? `${error.response.data.error} (Reference: ${requestId})` : error.response.data.error;
  }
  if (error?.response?.status === 401) {
    return "Your sign-in session is no longer valid. Please sign in again and retry.";
  }
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Check your connection and try again.";
  }
  if (!error?.response) {
    return "Could not reach the Trackify server. Check your connection and try again.";
  }
  return fallback;
}

const EXPENSE_CATEGORIES = [
  "Shopping", "Inventory", "Supplies", "Utilities", "Food & Dining",
  "Transport", "Rent", "Maintenance", "Marketing", "General",
];
const INCOME_CATEGORIES = [
  "Sales", "Service Revenue", "Product Sales", "Consulting", "Other Income",
];

export default function ScanBill() {
  const { t, tCategory } = useI18n();
  const [scanStage, setScanStage] = useState<ScanStage>("idle");
  const [scanResult, setScanResult] = useState<ScannedBill | null>(null);
  const [editedResult, setEditedResult] = useState<ScannedBill | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Separate saving states to prevent double-submit on either button
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingIncome,  setIsSavingIncome]  = useState(false);
  const savedRef = useRef(false);  // prevents double-submit from rapid clicks

  // Category and descriptions
  const [saleDescription, setSaleDescription] = useState("");
  const [saleCategory,    setSaleCategory]    = useState("Sales");
  const [expenseCategory, setExpenseCategory] = useState("Shopping");

  const { toast } = useToast();

  const STAGE_LABELS: Record<ScanStage, string> = {
    idle:      "",
    uploading: t("uploading", "scan"),
    analyzing: t("analyzing", "scan"),
    done:      t("done", "scan"),
    error:     t("failed", "scan"),
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

      const today = getTodayDateStr();
      const extracted = response.data.transaction;
      const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(extracted?.date || "") ? extracted.date : today;
      const tx = { ...extracted, date: initialDate };

      setScanResult(tx);
      setEditedResult(tx);
      setImageBase64(response.data.imageBase64 || null);
      setScanStage("done");

      // Pre-fill sale description from bill items
      const firstItem = tx?.items?.[0]?.name;
      const itemCount  = tx?.items?.length ?? 0;
      if (firstItem) {
        setSaleDescription(itemCount > 1 ? `${firstItem} + ${itemCount - 1} more` : firstItem);
      }

      toast({ title: "✅ Bill Scanned!", description: "Choose to record as Expense or Income below." });
    } catch (error: any) {
      setScanStage("error");
      const msg = apiErrorMessage(error, "Could not analyze the image. Please try again.");
      setErrorMessage(msg);
      toast({ title: "Scan Failed", description: msg, variant: "destructive" });
    }
  };

  // ── Option 2: Save as Expense ───────────────────────────────────────────────
  const handleSaveExpense = async () => {
    if (!editedResult || isSavingExpense || isSavingIncome || savedRef.current) return;

    if (!editedResult.total || editedResult.total <= 0) {
      toast({ title: "Invalid Total", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }

    savedRef.current = true;
    setIsSavingExpense(true);
    try {
      const finalDate = editedResult.date || getTodayDateStr();
      const response = await api.post("/api/bills/confirm", {
        transaction: {
          ...editedResult,
          category: expenseCategory,
          date: finalDate,
        },
        imageBase64,
      });
      window.dispatchEvent(new CustomEvent('trackify:transaction-saved', { detail: response.data?.transaction }));
      toast({
        title: "✅ Expense Saved!",
        description: `₹${editedResult.total.toFixed(2)} expense recorded under ${expenseCategory}. Visible in Transactions, Spending & Dashboard.`,
      });
      resetForm();
    } catch (error: any) {
      savedRef.current = false;
      const msg = apiErrorMessage(error, "Could not save this expense. Please try again.");
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSavingExpense(false);
    }
  };

  // ── Option 3: Save as Income ────────────────────────────────────────────────
  const handleSaveIncome = async () => {
    if (!editedResult || isSavingExpense || isSavingIncome || savedRef.current) return;

    if (!editedResult.total || editedResult.total <= 0) {
      toast({ title: "Invalid Total", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }
    if (!saleDescription.trim()) {
      toast({ title: "Description Required", description: "Please enter a description for this income.", variant: "destructive" });
      return;
    }

    savedRef.current = true;
    setIsSavingIncome(true);
    try {
      const finalDate = editedResult.date || getTodayDateStr();
      const response = await api.post("/api/bills/confirm-sale", {
        transaction: {
          ...editedResult,
          category: saleCategory,
          saleDescription: saleDescription.trim(),
          date: finalDate,
        },
        imageBase64,
      });
      window.dispatchEvent(new CustomEvent('trackify:transaction-saved', { detail: response.data?.transaction }));
      toast({
        title: "✅ Income Recorded!",
        description: `₹${editedResult.total.toFixed(2)} income from "${saleDescription}" added to your account.`,
      });
      resetForm();
    } catch (error: any) {
      savedRef.current = false;
      const msg = apiErrorMessage(error, "Could not save this income. Please try again.");
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSavingIncome(false);
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

  const isBusy = isSavingExpense || isSavingIncome;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title", "scan")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", "scan")}
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
                  ? t("failed", "scan")
                  : t("upload_receipt", "scan")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {scanStage === "uploading" || scanStage === "analyzing"
                  ? t("analyzing", "scan")
                  : scanStage === "error"
                  ? errorMessage
                  : t("upload_desc", "scan")}
              </p>
            </div>

            {(scanStage === "idle" || scanStage === "done" || scanStage === "error") && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button asChild className="bg-gradient-primary cursor-pointer">
                  <label>
                    <Camera className="mr-2 h-4 w-4" /> {t("use_camera", "scan")}
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
                    <Upload className="mr-2 h-4 w-4" /> {t("upload_file", "scan")}
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
                  {t("receipt_details", "scan")}
                </CardTitle>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs gap-1"
                  disabled={isBusy}
                >
                  <Edit2 className="h-3 w-3" />
                  {isEditing ? t("done", "common") : t("edit", "common")}
                </Button>
              </div>
              <CardDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>{editedResult.vendorName || t("unknown_vendor", "scan")}</span>
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                  {editedResult.invoiceNumber ? `${t("invoice_no", "scan")} ${editedResult.invoiceNumber}` : t("receipt_details", "scan")}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Transaction Date Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/30 rounded-lg border text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-muted-foreground">{t("transaction_date", "scan")}</span>
                  <Input
                    type="date"
                    className="h-7 w-36 text-xs px-2"
                    value={editedResult.date || getTodayDateStr()}
                    onChange={e => updateField("date", e.target.value)}
                    disabled={isBusy}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => updateField("date", getTodayDateStr())}
                    disabled={isBusy}
                  >
                    {t("set_today", "scan")}
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {t("date_tip", "scan")}
                </span>
              </div>

              {/* Editable header fields */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <Label className="text-xs">{t("vendor_name", "scan")}</Label>
                    <Input className="h-8 mt-1" value={editedResult.vendorName || ""}
                      onChange={e => updateField("vendorName", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("date", "common")}</Label>
                    <Input type="date" className="h-8 mt-1" value={editedResult.date || ""}
                      onChange={e => updateField("date", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("total", "common")} (₹)</Label>
                    <Input type="number" className="h-8 mt-1" value={editedResult.total}
                      onChange={e => updateField("total", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("tax", "common")} (₹)</Label>
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
                      <th className="py-2 px-4 text-left font-medium">{t("item", "scan")}</th>
                      <th className="py-2 px-4 text-center font-medium">{t("qty", "scan")}</th>
                      <th className="py-2 px-4 text-right font-medium">{t("unit_price", "scan")}</th>
                      <th className="py-2 px-4 text-right font-medium">{t("total", "scan")}</th>
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
                    <span>{t("subtotal", "scan")}</span>
                    <span>{editedResult.currencySymbol}{editedResult.subtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between w-full max-w-[200px] text-muted-foreground text-sm">
                  <span>{t("tax", "scan")}</span>
                  <span>{editedResult.currencySymbol}{(editedResult.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between w-full max-w-[200px] font-bold text-lg pt-1 border-t">
                  <span>{t("total", "scan")}</span>
                  <span>{editedResult.currencySymbol}{editedResult.total.toFixed(2)}</span>
                </div>
              </div>

              {/* ── Action panels: Expense vs Income ───────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Expense panel */}
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> {t("record_as_expense", "scan")}
                  </p>
                  <div>
                    <Label className="text-xs">{t("expense_category", "scan")}</Label>
                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{tCategory(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Income / Sale panel */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {t("record_as_income", "scan")}
                  </p>
                  <div>
                    <Label className="text-xs">{t("income_description", "scan")}</Label>
                    <Input
                      className="h-8 mt-1 text-xs"
                      placeholder={t("income_placeholder", "scan")}
                      value={saleDescription}
                      onChange={e => setSaleDescription(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("income_category", "scan")}</Label>
                    <Select value={saleCategory} onValueChange={setSaleCategory}>
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{tCategory(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* ── Footer: 3 Options (Discard, Add as Expense, Add as Income) ───────────────────── */}
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t p-4 bg-muted/20">
              {/* Option 1: Discard */}
              <Button variant="ghost" onClick={handleDiscard} disabled={isBusy}>
                {t("discard", "scan")}
              </Button>

              <div className="flex flex-wrap gap-2">
                {/* Option 2: Add as Expense */}
                <Button
                  id="save-bill-expense-btn"
                  variant="outline"
                  onClick={handleSaveExpense}
                  disabled={isBusy}
                  className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  {isSavingExpense ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("saving_expense", "scan")}</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" />{t("add_as_expense", "scan")}</>
                  )}
                </Button>

                {/* Option 3: Add as Income */}
                <Button
                  id="save-bill-income-btn"
                  onClick={handleSaveIncome}
                  disabled={isBusy}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90"
                >
                  {isSavingIncome ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("saving_income", "scan")}</>
                  ) : (
                    <><TrendingUp className="h-4 w-4 mr-2" />{t("add_as_income", "scan")}</>
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
              <p className="text-xs text-muted-foreground mb-2">{t("preview", "scan")}</p>
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
