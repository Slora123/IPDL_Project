import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Mic,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { VoiceButton } from "@/components/VoiceButton";

interface Transaction {
  id: string;
  item: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  time: string;
  date: string;
  language: "hindi" | "english" | "marathi";
  voiceInput?: string;
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const mockTransactions: Transaction[] = [
    {
      id: "1",
      item: "दूध (Milk)",
      amount: 50,
      type: "expense",
      category: "Dairy",
      time: "10:30 AM",
      date: "2024-01-15",
      language: "hindi",
      voiceInput: "50 रुपये दूध खरीदी"
    },
    {
      id: "2", 
      item: "Cold Drinks Sale",
      amount: 270,
      type: "income",
      category: "Beverages",
      time: "11:45 AM", 
      date: "2024-01-15",
      language: "english",
      voiceInput: "3 cold drinks beche 90 rupaye mein each"
    },
    {
      id: "3",
      item: "चाय पत्ती (Tea Leaves)",
      amount: 120,
      type: "expense", 
      category: "Inventory",
      time: "2:15 PM",
      date: "2024-01-15",
      language: "hindi",
      voiceInput: "120 रुपये की चाय पत्ती खरीदी"
    },
    {
      id: "4",
      item: "Snacks Sale", 
      amount: 150,
      type: "income",
      category: "Food",
      time: "3:30 PM",
      date: "2024-01-15", 
      language: "english"
    },
    {
      id: "5",
      item: "भाजी (Vegetables)",
      amount: 80,
      type: "expense",
      category: "Groceries", 
      time: "4:45 PM",
      date: "2024-01-14",
      language: "marathi",
      voiceInput: "80 रुपयांची भाजी घेतली"
    }
  ];

  const [transactions] = useState<Transaction[]>(mockTransactions);

  const filteredTransactions = transactions.filter(transaction =>
    transaction.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayTransactions = filteredTransactions.filter(t => t.date === "2024-01-15");
  const yesterdayTransactions = filteredTransactions.filter(t => t.date === "2024-01-14");

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
    
    return (
      <Card className="shadow-card hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{transaction.item}</h3>
                <Badge variant="outline" className="text-xs">
                  {getLanguageFlag(transaction.language)}
                </Badge>
                {transaction.voiceInput && (
                  <Badge variant="secondary" className="text-xs">
                    <Mic className="h-3 w-3 mr-1" />
                    Voice
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{transaction.category}</span>
                <span>{transaction.time}</span>
              </div>
              
              {transaction.voiceInput && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  "{transaction.voiceInput}"
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === "income" ? "+" : "-"}₹{transaction.amount}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {transaction.type}
                </div>
              </div>
              
              <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
              
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            All your voice-recorded and manual transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Manual
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
                placeholder="Search transactions, categories, or items..."
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
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="income">Income Only</TabsTrigger>
          <TabsTrigger value="expenses">Expenses Only</TabsTrigger>
          <TabsTrigger value="voice">Voice Recorded</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-6">
            {/* Today's Transactions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Today's Transactions</h2>
                <Badge className="bg-primary/10 text-primary">
                  {todayTransactions.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {todayTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>

            {/* Yesterday's Transactions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Yesterday's Transactions</h2>
                <Badge variant="secondary">
                  {yesterdayTransactions.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {yesterdayTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="space-y-3">
            {todayTransactions.map(transaction => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions
              .filter(t => t.type === "income")
              .map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions
              .filter(t => t.type === "expense")
              .map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions
              .filter(t => t.voiceInput)
              .map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Voice Recording Tip */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Recording Tips
          </CardTitle>
          <CardDescription>
            Get better results from voice transaction recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Hindi Example:</strong><br />
              "50 रुपये दूध खरीदी" → Expense recorded
            </div>
            <div>
              <strong>English Example:</strong><br />
              "Sold 3 cold drinks for 90 rupees each" → Income recorded
            </div>
            <div>
              <strong>Marathi Example:</strong><br />
              "80 रुपयांची भाजी घेतली" → Expense recorded
            </div>
            <div>
              <strong>Best Practices:</strong><br />
              Speak clearly, mention amount and item name
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Voice Button */}
      <VoiceButton />
    </div>
  );
}