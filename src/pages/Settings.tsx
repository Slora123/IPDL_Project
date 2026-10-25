import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mic,
  Bell,
  Shield,
  Smartphone,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import api from "@/lib/api";
// @ts-ignore
import html2pdf from "html2pdf.js";

export default function Settings() {
  const { name, businessName, phone, language, setName, setBusinessName, setPhone, setLanguage } = usePreferences();
  const { t } = useI18n();
  // email always comes from the server-verified user object, never localStorage
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const languages = [
    { value: "en", label: "English", native: "English" },
    { value: "hi", label: "Hindi", native: "हिन्दी" },
    { value: "mr", label: "Marathi", native: "मराठी" },
  ];

  useEffect(() => {
    setSettings({
      // Profile fields — prefer AuthContext.user (server-authoritative) for name/business/phone
      // when they haven't been overridden locally yet; fall back to PreferencesContext.
      name:         user?.name         || name         || "",
      businessName: user?.businessName || businessName || "",
      phone:        user?.phone        || phone        || "",
      // email is only in AuthContext.user — PreferencesContext doesn't store it
      email:        user?.email        || "",
      language:     language           || "en",
      voiceNotifications: true,
      voiceAccuracy: "balanced",
      autoRecord: false,
      dailyReminders: true,
      lowStockAlerts: true,
      profitAlerts: true,
      emailReports: false,
      dataSync: true,
      analyticsSharing: false,
      locationAccess: false,
    });
    setLoading(false);
  }, [user, name, businessName, phone, language]);

  const handleLanguageChange = (newLang: string) => {
    setSettings((prev: any) => ({ ...prev, language: newLang }));
    setLanguage(newLang);
  };

  const handleSaveProfile = async () => {
    try {
      setName(settings.name);
      setBusinessName(settings.businessName);
      setPhone(settings.phone);
      setLanguage(settings.language);
      
      toast({
        title: t('profile_saved', 'settings', 'Profile Saved'),
        description: t('profile_saved_desc', 'settings', 'Your profile has been updated successfully.'),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('error', 'common', 'Error'),
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Use the correct token key — api already has the Authorization header set
      // by AuthContext, but we pass it explicitly as a fallback safety measure.
      const token = localStorage.getItem('trackify_token');
      await api.put(`/api/user/settings`, {
        voiceNotifications: settings.voiceNotifications,
        voiceAccuracy: settings.voiceAccuracy,
        autoRecord: settings.autoRecord,
        dailyReminders: settings.dailyReminders,
        lowStockAlerts: settings.lowStockAlerts,
        profitAlerts: settings.profitAlerts,
        emailReports: settings.emailReports,
        dataSync: settings.dataSync,
        analyticsSharing: settings.analyticsSharing,
        locationAccess: settings.locationAccess,
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      toast({
        title: t('settings_saved', 'settings', 'Settings Saved'),
        description: t('settings_saved_desc', 'settings', 'Your preferences have been updated successfully.'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('error', 'common', 'Error'),
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      toast({
        title: "Exporting Data",
        description: "Preparing your business transactions report as PDF...",
      });
      const res = await api.get('/api/transactions');
      const txs = Array.isArray(res.data) ? res.data : [];

      const printContainer = document.createElement('div');
      printContainer.style.padding = '24px';
      printContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      printContainer.style.color = '#111827';
      printContainer.style.backgroundColor = '#ffffff';

      printContainer.innerHTML = `
        <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1e3a8a;">Trackify Business Account Export</h1>
          <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0;">
            Business: ${businessName || 'Trackify'} | Owner: ${name || 'User'} | Email: ${user?.email || '—'}
          </p>
          <p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">
            Export Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Transactions Record (${txs.length} total)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px 10px;">Date</th>
              <th style="padding: 8px 10px;">Item</th>
              <th style="padding: 8px 10px;">Category</th>
              <th style="padding: 8px 10px;">Type</th>
              <th style="padding: 8px 10px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${txs.slice(0, 50).map((t: any, i: number) => `
              <tr style="border-bottom: 1px solid #e5e7eb; background-color: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding: 6px 10px;">${t.date} ${t.time || ''}</td>
                <td style="padding: 6px 10px; font-weight: 500;">${t.item}</td>
                <td style="padding: 6px 10px;">${t.category}</td>
                <td style="padding: 6px 10px; text-transform: capitalize;">${t.type}</td>
                <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: ${t.type === 'income' ? '#15803d' : '#dc2626'};">
                  ${t.type === 'income' ? '+' : '-'}₹${Number(t.amount || 0).toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(printContainer);
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `Trackify_Account_Data_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(printContainer).save();
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }

      toast({
        title: "Export Complete!",
        description: "Your business data PDF has been downloaded.",
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message || "Could not export business data.",
      });
    }
  };

  const handleResetVoice = () => {
    toast({
      title: "Voice Settings Reset",
      description: "Voice recognition has been recalibrated for better accuracy.",
    });
  };

  if (loading || !settings) {
    return <div className="p-6">{t('loading', 'common', 'Loading...')}</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('header_title', 'settings', 'Settings & Preferences')}</h1>
          <p className="text-muted-foreground">
            {t('header_desc', 'settings', 'Manage your profile, language, notification preferences, and business data')}
          </p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-success">
          <Save className="mr-2 h-4 w-4" />
          {t('save', 'common', 'Save Changes')}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto w-full sm:grid sm:grid-cols-5 gap-1 sm:gap-0">
          <TabsTrigger value="profile" className="flex-1 text-xs sm:text-sm">{t('tab_profile', 'settings', 'Profile')}</TabsTrigger>
          <TabsTrigger value="voice" className="flex-1 text-xs sm:text-sm">{t('tab_voice', 'settings', 'Voice')}</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 text-xs sm:text-sm">{t('tab_notifications', 'settings', 'Notifications')}</TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1 text-xs sm:text-sm">{t('tab_data', 'settings', 'Privacy')}</TabsTrigger>
          <TabsTrigger value="data" className="flex-1 text-xs sm:text-sm">{t('data_title', 'settings', 'Data')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('tab_profile', 'settings', 'Profile')}
              </CardTitle>
              <CardDescription>{t('header_desc', 'settings', 'Update your personal and business details')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name', 'settings', 'Name')}</Label>
                  <Input
                    id="name"
                    value={settings.name || ''}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">{t('business_name', 'settings', 'Business Name')}</Label>
                <Input
                  id="businessName"
                  value={settings.businessName || ''}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email', 'settings', 'Email Address')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone', 'settings', 'Phone Number')}</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t('primary_language', 'settings', 'Primary Language')}</Label>
                <select
                  id="language"
                  value={settings.language || "en"}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.native} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleSaveProfile} className="mt-4">
                {t('save_profile', 'settings', 'Save Profile')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {t('voice_settings_title', 'settings', 'Voice Recognition Settings')}
              </CardTitle>
              <CardDescription>{t('voice_settings_desc', 'settings', 'Configure voice input and accuracy preferences')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('voice_notifications', 'settings', 'Voice Notifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('voice_notifications_desc', 'settings', 'Hear audio confirmations for transactions')}
                  </p>
                </div>
                <Switch
                  checked={settings.voiceNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, voiceNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Record Transactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start recording when mic button is pressed
                  </p>
                </div>
                <Switch
                  checked={settings.autoRecord}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoRecord: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Voice Accuracy Level</Label>
                <select
                  value={settings.voiceAccuracy || "balanced"}
                  onChange={(e) => setSettings({ ...settings, voiceAccuracy: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="high">High Accuracy (Slower)</option>
                  <option value="fast">Fast Response (Lower Accuracy)</option>
                </select>
              </div>

              <div className="pt-4">
                <Button onClick={handleResetVoice} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recalibrate Voice Recognition
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Business Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily tips and reminders for business management
                  </p>
                </div>
                <Switch
                  checked={settings.dailyReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, dailyReminders: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when inventory is running low
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, lowStockAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profit Milestone Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate when you reach profit goals
                  </p>
                </div>
                <Switch
                  checked={settings.profitAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, profitAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Email Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed business reports via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailReports}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailReports: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your data privacy and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cloud Data Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync your data across devices securely
                  </p>
                </div>
                <Switch
                  checked={settings.dataSync}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, dataSync: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anonymous Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve VoicePay by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.analyticsSharing}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, analyticsSharing: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Location Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Used for local business insights and weather-based tips
                  </p>
                </div>
                <Switch
                  checked={settings.locationAccess}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, locationAccess: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Security Actions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Two-Factor Auth
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export, import, and manage your business data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportData} variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <div className="font-medium">Export Data (PDF)</div>
                      <div className="text-sm text-muted-foreground">
                        Download all your transactions and account data as PDF
                      </div>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <div className="font-medium">Import Data</div>
                      <div className="text-sm text-muted-foreground">
                        Import transactions from Excel or CSV
                      </div>
                    </div>
                  </div>
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-destructive">Danger Zone</Label>
                <Card className="border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-destructive">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Storage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">Real Data</div>
                  <div className="text-sm text-muted-foreground">From Database</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">SQLite</div>
                  <div className="text-sm text-muted-foreground">Local Storage</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">Active</div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}