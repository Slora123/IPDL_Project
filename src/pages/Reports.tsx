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
// @ts-ignore
import html2pdf from "html2pdf.js";

const API_URL = 'http://localhost:3000';

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

    const element = document.getElementById('report-content');
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     `${generatedReport.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      
      html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Downloaded!",
        description: `Report PDF generated successfully.`,
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>{generatedReport.reportName}</span>
                <Badge className="bg-success text-success-foreground">Ready</Badge>
              </CardTitle>
              <CardDescription>
                {generatedReport.period || generatedReport.date || "Generated just now"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* The actual printable report element */}
            <div id="report-content" className="bg-background text-foreground p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 w-full overflow-hidden">
              
              {/* Header for PDF */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{generatedReport.reportName}</h2>
                <p className="text-muted-foreground">{generatedReport.period || generatedReport.date || new Date().toLocaleDateString()}</p>
              </div>

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

              {/* Detailed Data Tables */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Detailed Breakdown</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      {generatedReport.transactions && (
                        <tr>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Time</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Item</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Category</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Amount</th>
                        </tr>
                      )}
                      {generatedReport.dailyBreakdown && (
                        <tr>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Date</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Income</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Expenses</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Profit</th>
                        </tr>
                      )}
                      {generatedReport.categories && (
                        <tr>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Category</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Income</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Expenses</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Net Amount</th>
                        </tr>
                      )}
                      {generatedReport.languageBreakdown && (
                        <tr>
                          <th className="px-1.5 py-2 sm:p-3 font-medium">Language</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Count</th>
                          <th className="px-1.5 py-2 sm:p-3 font-medium text-right">Percentage</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y">
                      {generatedReport.transactions?.map((t: any, i: number) => (
                        <tr key={i} className="bg-card">
                          <td className="px-1.5 py-2 sm:p-3">{t.time}</td>
                          <td className="px-1.5 py-2 sm:p-3">{t.item}</td>
                          <td className="px-1.5 py-2 sm:p-3">{t.category}</td>
                          <td className={`px-1.5 py-2 sm:p-3 text-right font-medium ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount}
                          </td>
                        </tr>
                      ))}
                      {generatedReport.dailyBreakdown?.map((d: any, i: number) => (
                        <tr key={i} className="bg-card">
                          <td className="px-1.5 py-2 sm:p-3">{d.name || d.date}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right text-success">₹{d.income || 0}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right text-destructive">₹{d.expense || d.expenses || 0}</td>
                          <td className={`px-1.5 py-2 sm:p-3 text-right font-medium ${(d.profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            ₹{d.profit || 0}
                          </td>
                        </tr>
                      ))}
                      {generatedReport.categories?.map((c: any, i: number) => (
                        <tr key={i} className="bg-card">
                          <td className="px-1.5 py-2 sm:p-3 font-medium">{c.category}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right text-success">₹{c.totalIncome || 0}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right text-destructive">₹{c.totalExpenses || 0}</td>
                          <td className={`px-1.5 py-2 sm:p-3 text-right font-medium ${(c.netAmount || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            ₹{c.netAmount || 0}
                          </td>
                        </tr>
                      ))}
                      {generatedReport.languageBreakdown?.map((l: any, i: number) => (
                        <tr key={i} className="bg-card">
                          <td className="px-1.5 py-2 sm:p-3 capitalize">{l.language}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right">{l.count}</td>
                          <td className="px-1.5 py-2 sm:p-3 text-right">{l.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!generatedReport.transactions && !generatedReport.dailyBreakdown && !generatedReport.categories && !generatedReport.languageBreakdown) && (
                    <div className="p-8 text-center text-muted-foreground">
                      No detailed data available for this report.
                    </div>
                  )}
                </div>
              </div>
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