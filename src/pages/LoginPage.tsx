import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoFleur from "@/assets/logo-fleur-2.webp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const APP_VERSION = "2.1.1"; // incrementar +1 a cada update

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(
        error.message === "Sua conta está desabilitada. Entre em contato com a direção."
          ? error.message
          : "Email ou senha incorretos",
      );
    } else {
      toast.success("Bem-vindo ao Fleur! 🌸");
      navigate("/agenda");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast.error("Erro ao enviar email de recuperação");
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg">
            <img src={logoFleur} alt="Fleur" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Fleur</h1>
        </div>

        {/* Form */}
        <div className="bg-card rounded-3xl border-2 border-border p-8 shadow-xl">
          <h2 className="text-xl font-bold text-foreground mb-6">{isForgotPassword ? "Recuperar Senha" : "Entrar"}</h2>

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full rounded-2xl" disabled={isLoading}>
              {isLoading ? "Carregando..." : isForgotPassword ? "Enviar Email" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Button
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => setIsForgotPassword(!isForgotPassword)}
            >
              {isForgotPassword ? "Voltar ao login" : "Esqueci minha senha"}
            </Button>
            <div>
              <Button variant="link" className="text-sm text-primary" asChild>
                <Link to="/conheca">Conheça a Agenda Fleur 🌸</Link>
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.
          <br />
          Versão {APP_VERSION}
        </p>
      </div>
    </div>
  );
}
