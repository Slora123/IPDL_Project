import { useState, useEffect } from "react";
import api from "@/lib/api";
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

interface Transaction {
    id: string;
    item: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    language: "hindi" | "english" | "marathi";
}

interface EditTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    transaction: Transaction | null;
}

export function EditTransactionDialog({
    open,
    onOpenChange,
    onSuccess,
    transaction,
}: EditTransactionDialogProps) {
    const { t, tCategory } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item: "",
        amount: "",
        type: "expense",
        category: "General",
        date: new Date().toISOString().split("T")[0],
        language: "english",
    });

    // Pre-populate form when transaction changes
    useEffect(() => {
        if (transaction) {
            setFormData({
                item: transaction.item,
                amount: transaction.amount.toString(),
                type: transaction.type,
                category: transaction.category,
                date: transaction.date,
                language: transaction.language,
            });
        }
    }, [transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;

        setLoading(true);

        try {
            console.log("Updating transaction:", { ...formData, amount: parseFloat(formData.amount) });

            const response = await api.patch(
                `/api/transactions/${transaction.id}`,
                {
                    ...formData,
                    amount: parseFloat(formData.amount),
                }
            );

            console.log("Transaction updated:", response.data);
            window.dispatchEvent(new CustomEvent('trackify:transaction-saved', { detail: response.data }));
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating transaction:", error);
            console.error("Response data:", error.response?.data);
            alert(`Failed to update transaction: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white text-slate-900 border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{t('edit_title', 'dialogs', 'Edit Transaction')}</DialogTitle>
                    <DialogDescription>
                        {t('edit_desc', 'dialogs', 'Update the details of your transaction below.')}
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

                    <div className="grid gap-2">
                        <Label htmlFor="amount">{t('amount_label', 'dialogs', 'Amount (₹)')}</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
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
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="income">{t('income', 'common', 'Income')}</SelectItem>
                                <SelectItem value="expense">{t('expense', 'common', 'Expense')}</SelectItem>
                            </SelectContent>
                        </Select>
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
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">{tCategory('General')}</SelectItem>
                                <SelectItem value="Food">{tCategory('Food')}</SelectItem>
                                <SelectItem value="Transport">{tCategory('Transport')}</SelectItem>
                                <SelectItem value="Shopping">{tCategory('Shopping')}</SelectItem>
                                <SelectItem value="Bills">{tCategory('Bills')}</SelectItem>
                                <SelectItem value="Salary">{tCategory('Salary')}</SelectItem>
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t('button_cancel', 'dialogs', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('saving', 'common', 'Saving...') : t('button_update', 'dialogs', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
