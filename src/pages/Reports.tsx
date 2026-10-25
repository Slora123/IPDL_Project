import { useState, useEffect } from "react";
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
  Loader2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nContext";
import { usePreferences } from "@/contexts/PreferencesContext";
// @ts-ignore
import html2pdf from "html2pdf.js";

export default function Reports() {
  const { t, tCategory } = useI18n();
  const { businessName, name } = usePreferences();
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [activeReportId, setActiveReportId] = useState<string>("today-summary");
  const { toast } = useToast();

  const quickReports = [
    {
      id: "today-summary",
      name: t("todays_summary", "reports", "Today's Summary"),
      icon: Calendar,
      description: "Quick overview of today's income, expenses, and transactions",
    },
    {
      id: "weekly-pl",
      name: t("weekly_pl", "reports", "Weekly P&L"),
      icon: TrendingUp,
      description: "7-day profit and loss statement with daily breakdown",
    },
    {
      id: "category-breakdown",
      name: t("category_report", "reports", "Category Breakdown"),
      icon: PieChart,
      description: "Comprehensive income and spending breakdown by category",
    },
    {
      id: "voice-accuracy",
      name: "Voice & Channel Accuracy",
      icon: BarChart3,
      description: "Voice recognition usage and language distribution report",
    },
  ];

  const generateReport = async (reportId: string, scrollToReport = true) => {
    setLoading(reportId);
    setActiveReportId(reportId);
    try {
      const response = await api.post(`/api/reports/generate/${reportId}`, {});
      setGeneratedReport(response.data);

      if (scrollToReport) {
        setTimeout(() => {
          document.getElementById('report-display')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: t('error', 'common', 'Error'),
        description: error.response?.data?.error || "Failed to generate report",
      });
    } finally {
      setLoading(null);
    }
  };

  // Automatically load today's summary report on mount so the user immediately views it
  useEffect(() => {
    generateReport("today-summary", false);
  }, []);

  const downloadReport = () => {
    if (!generatedReport) return;

    const element = document.getElementById('report-content');
    if (element) {
      const cleanName = (generatedReport.reportName || 'Business_Report')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      html2pdf().set(opt).from(element).save();

      toast({
        title: t('download_pdf', 'reports', 'Downloaded!'),
        description: "Report PDF generated and downloaded successfully.",
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title', 'reports', 'Reports & Analytics')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', 'reports', 'Generate, preview, and download comprehensive business reports')}
          </p>
        </div>
        <div className="flex gap-2">
          {generatedReport && (
            <Button size="sm" onClick={downloadReport} className="bg-primary hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              {t('download_pdf', 'reports', 'Download PDF')}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Reports Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('quick_reports', 'reports', 'Quick Reports')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickReports.map((report) => {
            const isCurrent = activeReportId === report.id;
            return (
              <Card
                key={report.id}
                className={`shadow-card hover:shadow-lg transition-all cursor-pointer group ${
                  isCurrent ? 'border-2 border-primary bg-primary/5' : ''
                }`}
                onClick={() => generateReport(report.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium mb-1 flex items-center justify-center gap-1.5">
                    {report.name}
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">{report.description}</p>
                  <Button
                    size="sm"
                    variant={isCurrent ? "default" : "outline"}
                    className="w-full text-xs sm:text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateReport(report.id);
                    }}
                    disabled={loading === report.id}
                  >
                    {loading === report.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('generating', 'reports', 'Generating...')}
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        {isCurrent ? "Viewing Report" : t('continue', 'common', 'Generate & View')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Generated Report Display */}
      {generatedReport && (
        <div id="report-display" className="space-y-4 pt-2">
          <Card className="shadow-card border-2 border-primary/50">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>{generatedReport.reportName}</span>
                  <Badge className="bg-success text-success-foreground">{t('done', 'common', 'Ready')}</Badge>
                </CardTitle>
                <CardDescription>
                  {generatedReport.period || generatedReport.date || "Generated just now"}
                </CardDescription>
              </div>
              <Button size="sm" onClick={downloadReport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t('download_pdf', 'reports', 'Download PDF')}
              </Button>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Printable report container */}
              <div
                id="report-content"
                className="bg-card text-card-foreground p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 w-full overflow-hidden border shadow-sm"
              >
                {/* Header for PDF */}
                <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{generatedReport.reportName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {generatedReport.period || generatedReport.date || new Date().toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-primary">{businessName || 'Trackify Business'}</p>
                    <p className="text-xs text-muted-foreground">{name ? `Owner: ${name}` : 'Business Financial Statement'}</p>
                  </div>
                </div>

                {/* Display report summary metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {generatedReport.totalIncome !== undefined && (
                    <div className="text-center p-3.5 bg-success/10 rounded-lg border border-success/20">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('todays_income', 'dashboard', 'Total Income')}</p>
                      <p className="text-xl sm:text-2xl font-bold text-success">₹{(Number(generatedReport.totalIncome) || 0).toLocaleString()}</p>
                    </div>
                  )}
                  {generatedReport.totalExpenses !== undefined && (
                    <div className="text-center p-3.5 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('todays_expenses', 'dashboard', 'Total Expenses')}</p>
                      <p className="text-xl sm:text-2xl font-bold text-destructive">₹{(Number(generatedReport.totalExpenses) || 0).toLocaleString()}</p>
                    </div>
                  )}
                  {generatedReport.netProfit !== undefined && (
                    <div className="text-center p-3.5 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('net_profit', 'dashboard', 'Net Profit')}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${(Number(generatedReport.netProfit) || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ₹{(Number(generatedReport.netProfit) || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {generatedReport.totalTransactions !== undefined && (
                    <div className="text-center p-3.5 bg-muted rounded-lg border border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('transactions', 'dashboard', 'Transactions')}</p>
                      <p className="text-xl sm:text-2xl font-bold">{generatedReport.totalTransactions}</p>
                    </div>
                  )}
                </div>

                {/* Detailed Data Tables */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">{t('category_breakdown', 'dashboard', 'Detailed Breakdown')}</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-muted/70 text-muted-foreground border-b font-semibold">
                        {generatedReport.transactions && (
                          <tr>
                            <th className="px-3 py-2.5 font-medium">{t('time', 'common', 'Time')}</th>
                            <th className="px-3 py-2.5 font-medium">{t('item', 'scan', 'Item')}</th>
                            <th className="px-3 py-2.5 font-medium">{t('category', 'common', 'Category')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('amount', 'common', 'Amount')}</th>
                          </tr>
                        )}
                        {generatedReport.dailyBreakdown && (
                          <tr>
                            <th className="px-3 py-2.5 font-medium">{t('date', 'common', 'Date')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('income', 'common', 'Income')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('expense', 'common', 'Expenses')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('net_profit', 'dashboard', 'Profit')}</th>
                          </tr>
                        )}
                        {generatedReport.categories && (
                          <tr>
                            <th className="px-3 py-2.5 font-medium">{t('category', 'common', 'Category')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('income', 'common', 'Income')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('expense', 'common', 'Expenses')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('total', 'common', 'Net Amount')}</th>
                          </tr>
                        )}
                        {generatedReport.languageBreakdown && (
                          <tr>
                            <th className="px-3 py-2.5 font-medium">{t('language', 'common', 'Language')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">{t('subtotal', 'common', 'Count')}</th>
                            <th className="px-3 py-2.5 font-medium text-right">%</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-border">
                        {generatedReport.transactions?.map((tr: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 text-muted-foreground">{tr.time}</td>
                            <td className="px-3 py-2.5 font-medium">{tr.item}</td>
                            <td className="px-3 py-2.5">{tCategory(tr.category)}</td>
                            <td className={`px-3 py-2.5 text-right font-semibold ${tr.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                              {tr.type === 'income' ? '+' : '-'}₹{(Number(tr.amount) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {generatedReport.dailyBreakdown?.map((d: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 font-medium">{d.name} ({d.date})</td>
                            <td className="px-3 py-2.5 text-right text-success font-medium">₹{(Number(d.income) || 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right text-destructive font-medium">₹{(Number(d.expense) || 0).toLocaleString()}</td>
                            <td className={`px-3 py-2.5 text-right font-semibold ${(d.profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              ₹{(Number(d.profit) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {generatedReport.categories?.map((c: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 font-medium">{tCategory(c.category)}</td>
                            <td className="px-3 py-2.5 text-right text-success">₹{(Number(c.totalIncome) || 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right text-destructive">₹{(Number(c.totalExpenses) || 0).toLocaleString()}</td>
                            <td className={`px-3 py-2.5 text-right font-semibold ${(c.netAmount || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              ₹{(Number(c.netAmount) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {generatedReport.languageBreakdown?.map((l: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 capitalize font-medium">{l.language}</td>
                            <td className="px-3 py-2.5 text-right">{l.count}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">{l.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Empty states if arrays are empty */}
                    {generatedReport.transactions && generatedReport.transactions.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('no_expense_data', 'spending', 'No transactions recorded for this period yet.')}
                      </div>
                    )}
                    {generatedReport.categories && generatedReport.categories.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('no_expense_data', 'spending', 'No category data recorded yet.')}
                      </div>
                    )}
                    {(!generatedReport.transactions && !generatedReport.dailyBreakdown && !generatedReport.categories && !generatedReport.languageBreakdown) && (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('no_expense_data', 'spending', 'No detailed data available for this report.')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer in PDF */}
                <div className="pt-4 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Generated with Trackify Finance Tracker</span>
                  <span>{new Date().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty fallback state if loading failed completely */}
      {!generatedReport && !loading && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('reports', 'common', 'Select a report to view and download')}</h3>
            <p className="text-muted-foreground">
              {t('subtitle', 'reports', 'Generate and download comprehensive business reports')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}