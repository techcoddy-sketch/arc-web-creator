import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, UserCircle2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

type Mode = "idle" | "email" | "otp";

export function QuickAuth() {
  const [mode, setMode] = useState<Mode>("idle");
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const reset = () => {
    setError("");
    setInfo("");
  };

  const handleGoogle = async () => {
    reset();
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Could not start Google sign-in.");
    } finally {
      setLoading(null);
    }
  };

  const handleAnonymous = async () => {
    reset();
    setLoading("anon");
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setError(
          error.message.includes("disabled")
            ? "Anonymous sign-in is disabled. Enable it in Supabase → Authentication → Providers."
            : error.message
        );
      }
    } catch {
      setError("Could not start guest session.");
    } finally {
      setLoading(null);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    try {
      const value = emailSchema.parse(email.trim());
      setLoading("otp");
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMode("otp");
        setInfo(`We sent a 6-digit code to ${value}`);
      }
    } catch (err) {
      setError(err instanceof z.ZodError ? err.errors[0].message : "Could not send code.");
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading("verify");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "email",
      });
      if (error) setError(error.message);
    } catch {
      setError("Could not verify code.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {mode === "idle" && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl"
            onClick={handleGoogle}
            disabled={!!loading}
          >
            {loading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl"
            onClick={() => setMode("email")}
            disabled={!!loading}
          >
            <Mail className="mr-2 h-4 w-4" />
            Continue with Email
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-11 rounded-xl text-muted-foreground"
            onClick={handleAnonymous}
            disabled={!!loading}
          >
            {loading === "anon" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCircle2 className="mr-2 h-4 w-4" />
            )}
            Continue as guest
          </Button>
        </>
      )}

      {mode === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="quick-email">Email</Label>
            <Input
              id="quick-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={!!loading}
            />
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl" disabled={!!loading}>
            {loading === "otp" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send code
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => {
              setMode("idle");
              reset();
            }}
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Back
          </Button>
        </form>
      )}

      {mode === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="quick-otp">Verification code</Label>
            <Input
              id="quick-otp"
              type="text"
              inputMode="numeric"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              disabled={!!loading}
              className="text-center text-2xl tracking-widest h-12"
            />
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl" disabled={!!loading || otp.length < 6}>
            {loading === "verify" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & continue
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => {
              setMode("email");
              setOtp("");
              reset();
            }}
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Use a different email
          </Button>
        </form>
      )}

      {info && (
        <Alert>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.74 4.4-5.5 4.4-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.84 3.66 14.66 2.7 12 2.7 6.98 2.7 2.9 6.78 2.9 12s4.08 9.3 9.1 9.3c5.26 0 8.74-3.7 8.74-8.9 0-.6-.06-1.06-.14-1.5H12z"/>
    </svg>
  );
}
