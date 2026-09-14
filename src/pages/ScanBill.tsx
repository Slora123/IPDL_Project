import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, Camera, Upload, Loader2, CheckCircle, TrendingUp, Receipt, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const trendingItems = [
  { name: "Kurkure Masala", category: "Snacks", increase: "+15%", color: "text-green-500" },
  { name: "Amul Milk 500ml", category: "Dairy", increase: "+8%", color: "text-green-500" },
  { name: "Lays Magic Masala", category: "Snacks", increase: "+12%", color: "text-green-500" },
  { name: "Thumbs Up 750ml", category: "Beverages", increase: "+20%", color: "text-green-500" },
  { name: "Maggie Noodles", category: "Groceries", increase: "+10%", color: "text-green-500" },
];

export default function ScanBill() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const { toast } = useToast();

  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate OCR API processing
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        vendor: "Local Supermarket",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        total: 250.00,
        tax: 12.50,
        items: [
          { name: "Kurkure Masala Munch", price: 20, qty: 2, total: 40 },
          { name: "Amul Milk 500ml", price: 30, qty: 2, total: 60 },
          { name: "Lays Classic", price: 10, qty: 5, total: 50 },
          { name: "Maggie 2-Min Noodles", price: 20, qty: 5, total: 100 }
        ]
      });
      toast({
        title: "Scan Successful",
        description: "Receipt processed and items extracted.",
      });
    }, 2500);
  };

  const handleSave = () => {
    toast({
      title: "Transaction Saved",
      description: `₹${scanResult.total} expense recorded successfully.`,
    });
    setScanResult(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Bill</h1>
        <p className="text-muted-foreground">Upload or scan a receipt to auto-capture expenses using AI OCR.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                {isScanning ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <Receipt className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {isScanning ? "Analyzing receipt..." : "Upload a receipt"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isScanning 
                    ? "Our AI is extracting items and amounts from your bill."
                    : "Take a picture of a bill or upload an image to automatically add it as an expense."}
                </p>
              </div>
              
              {!isScanning && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <Button onClick={handleScan} className="bg-gradient-primary">
                    <Camera className="mr-2 h-4 w-4" /> Use Camera
                  </Button>
                  <Button onClick={handleScan} variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {scanResult && (
            <Card className="shadow-card border-success/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Receipt Details
                </CardTitle>
                <CardDescription>
                  {scanResult.vendor} • {scanResult.date} {scanResult.time}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="py-2 px-4 text-left font-medium">Item</th>
                        <th className="py-2 px-4 text-center font-medium">Qty</th>
                        <th className="py-2 px-4 text-right font-medium">Price</th>
                        <th className="py-2 px-4 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2 px-4">{item.name}</td>
                          <td className="py-2 px-4 text-center">{item.qty}</td>
                          <td className="py-2 px-4 text-right">₹{item.price}</td>
                          <td className="py-2 px-4 text-right">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex flex-col items-end justify-end space-y-1 pt-2">
                  <div className="flex items-center justify-between w-full max-w-[200px] text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>₹{(scanResult.total - scanResult.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between w-full max-w-[200px] text-muted-foreground text-sm">
                    <span>Tax</span>
                    <span>₹{scanResult.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between w-full max-w-[200px] font-bold text-lg pt-1 border-t">
                    <span>Total</span>
                    <span>₹{scanResult.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
                <Button variant="ghost" onClick={() => setScanResult(null)}>
                  Discard
                </Button>
                <Button onClick={handleSave} className="bg-gradient-success">
                  Save Transaction
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Items
              </CardTitle>
              <CardDescription>
                Fast-moving products in your area based on recent market data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-sm text-green-500">
                      {item.increase}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="link" className="w-full mt-4 text-primary">
                View More Trends <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
