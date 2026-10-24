import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mic,
  Receipt,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { VoiceButton } from "@/components/VoiceButton";
import { ManualTransactionDialog } from "@/components/ManualTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { useI18n } from "@/contexts/I18nContext";
import { usePreferences } from "@/contexts/PreferencesContext";

interface Transaction {
  id: string;
  item: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  time: string;
  date: string;
  language: "hindi" | "english" | "marathi";
  source?: string;
  billRef?: string;
  billImage?: string;
  voiceInput?: string;
}

export default function Transactions() {
  const { t, tCategory } = useI18n();
  const { language } = usePreferences();
  const isEnglish = language === 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["all", "today", "income", "expenses", "bills", "voice"];
  const currentTab = validTabs.includes(searchParams.get("tab") || "") ? (searchParams.get("tab") as string) : "all";
  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter and Date Range state
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/api/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const handleSaved = () => fetchTransactions();
    window.addEventListener('trackify:transaction-saved', handleSaved);
    return () => window.removeEventListener('trackify:transaction-saved', handleSaved);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
      window.dispatchEvent(new CustomEvent('trackify:transaction-saved'));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const matchesSearch = transaction.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = filterType === "all" || transaction.type === filterType;

    // Category filter
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;

    // Date range filter
    const matchesDateRange = () => {
      if (!dateRangeStart && !dateRangeEnd) return true;
      const txDate = new Date(transaction.date);
      if (dateRangeStart && new Date(dateRangeStart) > txDate) return false;
      if (dateRangeEnd && new Date(dateRangeEnd) < txDate) return false;
      return true;
    };

    return matchesSearch && matchesType && matchesCategory && matchesDateRange();
  });

  // Get today's and yesterday's dates dynamically — use LOCAL date not UTC
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);


  const todayTransactions = filteredTransactions.filter(t => t.date === todayStr);
  const yesterdayTransactions = filteredTransactions.filter(t => t.date === yesterdayStr);

  // Group ALL filtered transactions by date for the "All" tab
  const transactionsByDate: Record<string, Transaction[]> = {};
  for (const tx of filteredTransactions) {
    if (!transactionsByDate[tx.date]) transactionsByDate[tx.date] = [];
    transactionsByDate[tx.date].push(tx);
  }
  // Sorted newest-first
  const sortedDateGroups = Object.keys(transactionsByDate).sort((a, b) => b.localeCompare(a));

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return t('todays_transactions', 'dashboard');
    if (dateStr === yesterdayStr) return t('yesterdays_transactions', 'dashboard');
    // Format as "Mon, 10 Oct 2026" etc.
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDateBadgeVariant = (dateStr: string) => {
    if (dateStr === todayStr) return 'default' as const;
    if (dateStr === yesterdayStr) return 'secondary' as const;
    return 'outline' as const;
  };

  const getTypeColor = (type: Transaction["type"]) => {
    return type === "income" ? "text-success" : "text-destructive";
  };

  const getTypeIcon = (type: Transaction["type"]) => {
    return type === "income" ? TrendingUp : TrendingDown;
  };

  const getLanguageFlag = (language: Transaction["language"]) => {
    switch (language) {
      case "hindi": return "🇮🇳 हिं";
      case "marathi": return "🇮🇳 मरा";
      case "english": return "🇬🇧 EN";
      default: return "🇮🇳";
    }
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const TypeIcon = getTypeIcon(transaction.type);

    const getCategoryColor = (category: string) => {
      switch (category.toLowerCase()) {
        case 'food': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
        case 'business': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
        case 'supplies': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
        case 'software': return 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20';
        case 'services': return 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20';
        default: return 'bg-primary/10 text-primary hover:bg-primary/20';
      }
    };

    return (
      <Card className={`shadow-card hover:shadow-lg transition-all duration-200 border-l-4 ${transaction.type === 'income' ? 'border-l-success' : 'border-l-destructive'}`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate" title={transaction.item}>{transaction.item}</h3>
                <Badge variant="outline" className="text-xs bg-background shrink-0">
                  {getLanguageFlag(transaction.language)}
                </Badge>
                {transaction.voiceInput && (
                  <Badge variant="secondary" className="text-xs bg-muted">
                    <Mic className="h-3 w-3 mr-1 text-primary" />
                    {t('voice', 'dashboard')}
                  </Badge>
                )}
                {(transaction.source === 'bill' || transaction.billRef) && (
                  <Badge variant="secondary" className="text-xs bg-muted">
                    <Receipt className="h-3 w-3 mr-1 text-primary" />
                    {t('bill', 'transactions', 'Bill')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <Badge className={`border-none ${getCategoryColor(transaction.category)}`}>
                  {tCategory(transaction.category)}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {transaction.time}
                </span>
              </div>

              {transaction.voiceInput && (
                <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-md border border-muted mt-2">
                  "{transaction.voiceInput}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
              <div className="text-right">
                <div className={`text-xl font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground capitalize font-medium">
                  {transaction.type === "income" ? t('income', 'common', 'Income') : t('expense', 'common', 'Expense')}
                </div>
              </div>

              <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
              </div>

              <div className="flex md:flex-col gap-1 border-l pl-3 ml-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted" onClick={() => handleEdit(transaction)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(transaction.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold truncate">{t('transaction_history', 'transactions', 'Transaction History')}</h1>
          <p className="text-muted-foreground">
            {t('all_transactions', 'transactions', 'All your voice-recorded, scanned, and manual transactions')}
          </p>
        </div>
        <div className="flex flex-nowrap gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {/* Filter Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 px-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">
                <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{t('filter', 'common', 'Filter')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">{t('filter_type', 'transactions', 'Type')}</Label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all', 'common', 'All')}</SelectItem>
                      <SelectItem value="income">{t('income', 'common', 'Income')}</SelectItem>
                      <SelectItem value="expense">{t('expense', 'common', 'Expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">{t('category', 'common', 'Category')}</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_categories', 'transactions', 'All Categories')}</SelectItem>
                      <SelectItem value="General">{tCategory('General')}</SelectItem>
                      <SelectItem value="Food">{tCategory('Food')}</SelectItem>
                      <SelectItem value="Transport">{tCategory('Transport')}</SelectItem>
                      <SelectItem value="Shopping">{tCategory('Shopping')}</SelectItem>
                      <SelectItem value="Bills">{tCategory('Bills')}</SelectItem>
                      <SelectItem value="Salary">{tCategory('Salary')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 px-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">
                <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{t('date_range', 'transactions', 'Date Range')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">{t('start_date', 'transactions', 'Start Date')}</Label>
                  <Input
                    type="date"
                    className="h-8 mt-1"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t('end_date', 'transactions', 'End Date')}</Label>
                  <Input
                    type="date"
                    className="h-8 mt-1"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setDateRangeStart(""); setDateRangeEnd(""); }}
                >
                  {t('clear', 'common', 'Clear')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" className="flex-1 px-2 text-xs sm:text-sm sm:px-3 bg-gradient-primary whitespace-nowrap" onClick={() => setIsManualDialogOpen(true)}>
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{t('add_manual', 'transactions', '+ Add Transaction')}</span>
          </Button>
        </div>
      </div>

      {/* Search and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search_placeholder', 'dashboard')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{transactions.length}</div>
            <div className="text-sm text-muted-foreground">{t('total_transactions', 'dashboard')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex-wrap h-auto w-full justify-start sm:justify-center">
          <TabsTrigger value="all">{t('all_transactions_tab', 'dashboard')}</TabsTrigger>
          <TabsTrigger value="today">{t('today', 'common')}</TabsTrigger>
          <TabsTrigger value="income">{t('income_only', 'dashboard')}</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses_only', 'dashboard')}</TabsTrigger>
          <TabsTrigger value="bills">{t('bills_tab', 'transactions', 'Bills')}</TabsTrigger>
          <TabsTrigger value="voice">{t('voice_recorded', 'dashboard')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-6">
            {sortedDateGroups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_transactions', 'transactions', 'No transactions found')}</p>
            ) : (
              sortedDateGroups.map(dateStr => (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold">{formatDateLabel(dateStr)}</h2>
                    <Badge variant={getDateBadgeVariant(dateStr)} className={dateStr === todayStr ? 'bg-primary/10 text-primary' : ''}>
                      {transactionsByDate[dateStr].length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {transactionsByDate[dateStr].map(transaction => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="space-y-3">
            {todayTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_transactions', 'transactions', 'No transactions found')}</p>
            ) : (
              todayTransactions.map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions.filter(t => t.type === "income").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_transactions', 'transactions', 'No transactions found')}</p>
            ) : (
              filteredTransactions
                .filter(t => t.type === "income")
                .map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions.filter(t => t.type === "expense").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_transactions', 'transactions', 'No transactions found')}</p>
            ) : (
              filteredTransactions
                .filter(t => t.type === "expense")
                .map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions.filter(t => t.source === "bill" || t.billRef).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_bill_transactions', 'transactions', 'No scanned bills found')}</p>
            ) : (
              filteredTransactions
                .filter(t => t.source === "bill" || t.billRef)
                .map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions.filter(t => t.voiceInput).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('no_transactions', 'transactions', 'No transactions found')}</p>
            ) : (
              filteredTransactions
                .filter(t => t.voiceInput)
                .map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Voice Recording Tip */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            {t('voice_tips_title', 'dashboard')}
          </CardTitle>
          <CardDescription>
            {t('voice_tips_desc', 'dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {!isEnglish && (
              <div>
                <strong>{t('hindi_example', 'dashboard')}</strong><br />
                "50 रुपये दूध खरीदी" → Expense recorded
              </div>
            )}
            <div>
              <strong>{t('english_example', 'dashboard')}</strong><br />
              "Sold 3 cold drinks for 90 rupees each" → Income recorded
            </div>
            {!isEnglish && (
              <div>
                <strong>{t('marathi_example', 'dashboard')}</strong><br />
                "80 रुपयांची भाजी घेतली" → Expense recorded
              </div>
            )}
            <div>
              <strong>{t('best_practices', 'dashboard')}</strong><br />
              {t('best_practices_text', 'dashboard')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Voice Button */}
      <VoiceButton onTransactionSaved={fetchTransactions} />

      {/* Manual Transaction Dialog */}
      <ManualTransactionDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onSuccess={fetchTransactions}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchTransactions}
        transaction={editingTransaction}
      />
    </div>
  );
}