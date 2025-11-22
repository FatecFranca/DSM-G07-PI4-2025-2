import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

export default function Recover() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement password recovery endpoint in backend
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A recuperação de senha ainda não está disponível. Entre em contato com o suporte.",
      variant: "destructive",
    });
    
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-secondary text-secondary-foreground rounded-full">
                <Zap className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">E-mail Enviado</CardTitle>
            <CardDescription>
              Enviamos um link de redefinição de senha para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Voltar para o login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-full">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu e-mail para receber um link de redefinição de senha
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRecover}>
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
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Link"}
            </Button>
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-primary hover:underline text-sm"
              >
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

