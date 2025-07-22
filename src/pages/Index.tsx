import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Users, Settings } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex flex-col items-center justify-center p-6">
      {/* Logo/Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary/30">
          <Package className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Sistema de Cadastro
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Gerencie clientes e produtos com links específicos para cada cliente
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Link to="/admin" className="block">
          <Button className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl">
            <Settings className="h-6 w-6 mr-3" />
            Painel Administrativo
          </Button>
        </Link>
        
        <div className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Clientes acessam via link específico
          </p>
        </div>
      </div>
    </div>
  );
}