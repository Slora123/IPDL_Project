import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Package, Zap, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const trendingItems = [
  { name: "Kurkure Masala Munch", category: "Snacks", increase: "+25%", demand: "High", margin: "15%", color: "text-orange-500" },
  { name: "Amul Taaza Milk 500ml", category: "Dairy", increase: "+18%", demand: "Very High", margin: "10%", color: "text-blue-500" },
  { name: "Lays Magic Masala", category: "Snacks", increase: "+15%", demand: "High", margin: "18%", color: "text-indigo-500" },
  { name: "Aashirvaad Atta 5kg", category: "Groceries", increase: "+12%", demand: "Steady", margin: "8%", color: "text-amber-600" },
  { name: "Thumbs Up 750ml", category: "Beverages", increase: "+22%", demand: "High", margin: "20%", color: "text-red-600" },
  { name: "Maggie 2-Min Noodles", category: "Groceries", increase: "+10%", demand: "High", margin: "12%", color: "text-yellow-500" },
];

export default function Trending() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Trending Items</h1>
        <p className="text-muted-foreground">
          Discover frequently sold items based on local data to plan inventory and increase profit.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card border-success/20 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-success" />
              Top Earner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Kurkure Masala</div>
            <p className="text-sm text-muted-foreground mt-1">Highest sales volume this week (+25%)</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Highest Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Cold Beverages</div>
            <p className="text-sm text-muted-foreground mt-1">Averaging 20% profit margin</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-warning/20 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Amul Milk 500ml</div>
            <p className="text-sm text-muted-foreground mt-1">High demand item, restock immediately</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detailed Trending List */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Frequently Sold Items
            </CardTitle>
            <CardDescription>
              Products flying off the shelves recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium">Product Name</th>
                    <th className="py-3 px-4 text-left font-medium">Category</th>
                    <th className="py-3 px-4 text-center font-medium">Demand</th>
                    <th className="py-3 px-4 text-right font-medium">Growth</th>
                    <th className="py-3 px-4 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {trendingItems.map((item, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/30 transition-colors">
                      <td className={`py-3 px-4 font-bold ${item.color}`}>{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.demand === 'Very High' ? 'bg-success/20 text-success' : 
                          item.demand === 'High' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.demand}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-success">{item.increase}</td>
                      <td className="py-3 px-4 text-right">{item.margin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="shadow-card bg-gradient-to-b from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              AI-driven tips to increase your profits based on current trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border shadow-sm space-y-2">
              <h4 className="font-semibold text-primary">Bundle Offer Idea</h4>
              <p className="text-sm text-muted-foreground">
                Pair <span className="font-medium text-foreground">Lays Magic Masala</span> with <span className="font-medium text-foreground">Thumbs Up 750ml</span>. Both are seeing high demand. A small combo discount can increase overall cart value.
              </p>
            </div>
            
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border shadow-sm space-y-2">
              <h4 className="font-semibold text-primary">Impulse Purchases</h4>
              <p className="text-sm text-muted-foreground">
                Move <span className="font-medium text-foreground">Kurkure Masala Munch</span> closer to the billing counter. It has the highest sales volume growth this week (+25%).
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border shadow-sm space-y-2">
              <h4 className="font-semibold text-primary">Stock Planning</h4>
              <p className="text-sm text-muted-foreground">
                Weekend demand for <span className="font-medium text-foreground">Amul Taaza Milk</span> usually spikes. Order 20% more on Friday morning to avoid stock-outs.
              </p>
            </div>

            <Button className="w-full mt-4 bg-gradient-primary">
              View Detailed Analytics <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
