import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/contexts/I18nContext";

interface ManualTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function ManualTransactionDialog({
    open,
    onOpenChange,
    onSuccess,
}: ManualTransactionDialogProps) {
    const { t, tCategory } = useI18n();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item: "",
        amount: "",
        type: "expense",
        category: "General",
        date: getTodayDateStr(),
        language: "english",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid positive amount.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const finalDate = formData.date || getTodayDateStr();
            const payload = {
                ...formData,
                date: finalDate,
                amount: amt,
                voiceInput: null,
            };

            const response = await api.post('/api/transactions', payload);

            // Notify all listening components (Dashboard, Transactions, etc.)
            window.dispatchEvent(new CustomEvent('trackify:transaction-saved', { detail: response.data }));

            toast({
                title: "Transaction Saved",
                description: `${formData.type === 'income' ? 'Income' : 'Expense'} of ₹${amt.toLocaleString()} added successfully.`,
            });

            onSuccess();
            onOpenChange(false);
            setFormData({
                item: "",
                amount: "",
                type: "expense",
                category: "General",
                date: getTodayDateStr(),
                language: "english",
            });
        } catch (error: any) {
            console.error("Error creating transaction:", error);
            const msg = error.response?.data?.error || error.message || "Failed to add transaction.";
            toast({
                title: "Error Adding Transaction",
                description: msg,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white text-slate-900 border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{t('add_title', 'dialogs', 'Add Manual Transaction')}</DialogTitle>
                    <DialogDescription>
                        {t('add_desc', 'dialogs', 'Enter the details of your transaction below.')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="item">{t('item_label', 'dialogs', 'Item Name')}</Label>
                        <Input
                            id="item"
                            required
                            placeholder={t('item_placeholder', 'dialogs', 'e.g. Milk, Salary, Rent')}
                            value={formData.item}
                            onChange={(e) =>
                                setFormData({ ...formData, item: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">{t('amount_label', 'dialogs', 'Amount (₹)')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                required
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">{t('type_label', 'dialogs', 'Type')}</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder={t('type', 'transactions', 'Select type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">{t('income', 'common', 'Income')}</SelectItem>
                                    <SelectItem value="expense">{t('expense', 'common', 'Expense')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('category_label', 'dialogs', 'Category')}</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) =>
                                setFormData({ ...formData, category: value })
                            }
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder={t('category', 'common', 'Select category')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">{tCategory('General')}</SelectItem>
                                <SelectItem value="Food & Beverage">{tCategory('Food & Beverage')}</SelectItem>
                                <SelectItem value="Grocery">{tCategory('Grocery')}</SelectItem>
                                <SelectItem value="Rent">{tCategory('Rent')}</SelectItem>
                                <SelectItem value="Utilities">{tCategory('Utilities')}</SelectItem>
                                <SelectItem value="Other">{tCategory('Other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">{t('date_label', 'dialogs', 'Date')}</Label>
                        <Input
                            id="date"
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                            {loading ? t('loading', 'common', 'Adding...') : t('button_add', 'dialogs', 'Add Transaction')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
