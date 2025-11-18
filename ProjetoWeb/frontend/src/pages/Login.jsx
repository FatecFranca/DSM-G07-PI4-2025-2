import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.login(email, password);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
      navigate("/dashboard");
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer login";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-full">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Relógio de Energia</CardTitle>
          <CardDescription>
            Entre na sua conta para gerenciar seu consumo de energia
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center space-y-2">
              <Link 
                to="/register" 
                className="text-primary hover:underline text-sm"
              >
                Não tem uma conta? Cadastre-se
              </Link>

            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

