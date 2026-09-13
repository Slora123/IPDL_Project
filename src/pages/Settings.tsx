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
import axios from "axios";

const API_URL = "" || 'http://localhost:3000';

export default function Settings() {
  const { name, businessName, phone, language, setName, setBusinessName, setPhone, setLanguage } = usePreferences();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const languages = [
    { value: "en", label: "English", native: "English" },
    { value: "hi", label: "Hindi", native: "हिन्दी" },
  ];

  useEffect(() => {
    setSettings({
      name: name || "",
      businessName: businessName || "",
      phone: phone || "",
      language: language || "en",
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
  }, [name, businessName, phone, language]);

  const handleSaveProfile = async () => {
    try {
      setName(settings.name);
      setBusinessName(settings.businessName);
      setPhone(settings.phone);
      setLanguage(settings.language);
      
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/user/settings`, {
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
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your business data export will be ready in a few minutes.",
    });
  };

  const handleResetVoice = () => {
    toast({
      title: "Voice Settings Reset",
      description: "Voice recognition has been recalibrated for better accuracy.",
    });
  };

  if (loading || !settings) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Customize your VoicePay experience
          </p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-success">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal and business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={settings.name || ''}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName || ''}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Primary Language</Label>
                <select
                  id="language"
                  value={settings.language || "en"}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
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
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Recognition Settings
              </CardTitle>
              <CardDescription>Configure voice input and accuracy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Hear audio confirmations for transactions
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
                      <div className="font-medium">Export Data</div>
                      <div className="text-sm text-muted-foreground">
                        Download all your transactions and reports
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