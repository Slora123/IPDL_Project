// src/pages/AuthPage.tsx
// Single auth page with Login / Register tabs.
// Matches the existing dark design system (bg-background, card, gradients).

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Redirect to wherever the user was trying to go, or dashboard
  const from = (location.state as { from?: string })?.from || '/';

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState('');
  const [showLoginPw,   setShowLoginPw]   = useState(false);

  // ── Register state ───────────────────────────────────────────────────────
  const [regName,         setRegName]         = useState('');
  const [regEmail,        setRegEmail]         = useState('');
  const [regPassword,     setRegPassword]     = useState('');
  const [regConfirm,      setRegConfirm]      = useState('');
  const [regBusiness,     setRegBusiness]     = useState('');
  const [regPhone,        setRegPhone]        = useState('');
  const [regLoading,      setRegLoading]      = useState(false);
  const [regError,        setRegError]        = useState('');
  const [showRegPw,       setShowRegPw]       = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast({ title: 'Welcome back!', description: 'You are now logged in.' });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed. Please try again.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      setRegError('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    setRegLoading(true);
    try {
      await register(regName, regEmail, regPassword, regBusiness, regPhone);
      toast({ title: 'Account created!', description: `Welcome, ${regName}!` });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trackify</h1>
          <p className="text-xs text-muted-foreground">Smart Finance Tracker</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-xl">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* ── LOGIN TAB ───────────────────────────────────────────────── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      disabled={loginLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowLoginPw(v => !v)}
                      tabIndex={-1}
                      aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {loginError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                  ) : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            {/* ── REGISTER TAB ────────────────────────────────────────────── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="reg-name"
                      placeholder="Ravi Patel"
                      autoComplete="name"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      disabled={regLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone</Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="9876543210"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      disabled={regLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    disabled={regLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-business">Business / Shop Name</Label>
                  <Input
                    id="reg-business"
                    placeholder="Patel Grocery Mart"
                    value={regBusiness}
                    onChange={e => setRegBusiness(e.target.value)}
                    disabled={regLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPw ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      disabled={regLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowRegPw(v => !v)}
                      tabIndex={-1}
                      aria-label={showRegPw ? 'Hide password' : 'Show password'}
                    >
                      {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm Password <span className="text-destructive">*</span></Label>
                  <Input
                    id="reg-confirm"
                    type={showRegPw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    disabled={regLoading}
                  />
                </div>

                {regError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {regError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={regLoading}>
                  {regLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
                  ) : 'Create Account'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your password is securely hashed and never stored in plain text.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
