import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  PieChart,
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  Loader2
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API_URL = "" || 'http://localhost:3000';

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const { toast } = useToast();

  const quickReports = [
    { id: "today-summary", name: "Today's Summary", icon: Calendar, description: "Quick overview of today's transactions" },
    { id: "weekly-pl", name: "Weekly P&L", icon: TrendingUp, description: "7-day profit and loss summary" },
    { id: "category-breakdown", name: "Category Breakdown", icon: PieChart, description: "Current month category analysis" },
    { id: "voice-accuracy", name: "Voice Accuracy", icon: BarChart3, description: "Voice recognition accuracy report" }
  ];

  const generateReport = async (reportId: string) => {
    setLoading(reportId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/reports/generate/${reportId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedReport(response.data);
      toast({
        title: "Report Generated!",
        description: `${response.data.reportName} has been created successfully.`,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to generate report",
      });
    } finally {
      setLoading(null);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const dataStr = JSON.stringify(generatedReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedReport.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: `Report saved successfully.`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive business reports
          </p>
        </div>
        <div className="flex gap-2">
          {generatedReport && (
            <Button size="sm" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {/* Quick Reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickReports.map((report) => (
            <Card key={report.id} className="shadow-card hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">{report.name}</h3>
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => generateReport(report.id)}
                  disabled={loading === report.id}
                >
                  {loading === report.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Report Display */}
      {generatedReport && (
        <Card className="shadow-card border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{generatedReport.reportName}</span>
              <Badge className="bg-success text-success-foreground">Ready</Badge>
            </CardTitle>
            <CardDescription>
              {generatedReport.period || generatedReport.date || "Generated just now"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Display report summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedReport.totalIncome !== undefined && (
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-success">₹{generatedReport.totalIncome.toLocaleString()}</p>
                  </div>
                )}
                {generatedReport.totalExpenses !== undefined && (
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-destructive">₹{generatedReport.totalExpenses.toLocaleString()}</p>
                  </div>
                )}
                {generatedReport.netProfit !== undefined && (
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold">₹{generatedReport.netProfit.toLocaleString()}</p>
                  </div>
                )}
                {generatedReport.totalTransactions !== undefined && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{generatedReport.totalTransactions}</p>
                  </div>
                )}
              </div>

              {/* Show raw data in expandable section */}
              <details className="mt-4">
                <summary className="cursor-pointer font-medium text-sm text-muted-foreground hover:text-foreground">
                  View Detailed Data
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(generatedReport, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!generatedReport && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Generated Yet</h3>
            <p className="text-muted-foreground">
              Click "Generate" on any quick report above to create your first report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}