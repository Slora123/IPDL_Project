import frontImage from "@/pages/front.jpeg";
import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useI18n } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setLanguage } = usePreferences();
  const { t, language } = useI18n();
  const [localLanguage, setLocalLanguage] = useState(language);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });

  const navigate = useNavigate();
  const { login, testLogin, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const languages = [
    { value: "en", label: "English", flag: "🇬🇧" },
    { value: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { value: "mr", label: "मराठी", flag: "🇮🇳" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex flex-col lg:flex-row items-center justify-center p-4 gap-8">
      {/* Hero Image Section */}
      <div className="flex-1 flex items-center justify-center w-full lg:max-w-lg">
        <img
          src={frontImage}
          alt="Finance Tracking"
          className="rounded-2xl shadow-lg w-full h-auto object-cover"
        />
      </div>

      {/* Auth Form Section */}
      <div className="flex-1 w-full max-w-md">
        <Card className="shadow-floating">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Welcome</CardTitle>
            </div>
            <CardDescription>
              Sign in with your Google account to manage your business expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-6">
              <Label htmlFor="lang-select">{t("language")}</Label>
              <select
                id="lang-select"
                value={localLanguage}
                onChange={(e) => {
                  setLocalLanguage(e.target.value);
                  setLanguage(e.target.value);
                }}
                className="w-full px-3 py-2 border border-input rounded-md bg-background mt-1"
                disabled={isLoading}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      login(credentialResponse.credential);
                    }
                  }}
                  onError={() => {
                    setError("Login Failed");
                  }}
                  useOneTap
                />
              </div>
            </div>

            <div className="mt-8">
              <Separator className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
