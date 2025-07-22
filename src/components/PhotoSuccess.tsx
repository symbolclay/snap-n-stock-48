import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Camera, LogOut } from "lucide-react";

interface PhotoSuccessProps {
  success: boolean;
  message: string;
  onContinue: () => void;
  onFinish: () => void;
}

const PhotoSuccess = ({ success, message, onContinue, onFinish }: PhotoSuccessProps) => {
  const [showThanks, setShowThanks] = useState(false);

  const handleFinish = () => {
    setShowThanks(true);
    setTimeout(() => {
      onFinish();
    }, 3000);
  };

  if (showThanks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="p-8 text-center animate-fade-in-up">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Obrigado pelas fotos!
              </h2>
              <p className="text-muted-foreground">
                Suas fotos foram enviadas com sucesso.
                <br />
                Aguarde enquanto processamos.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full animate-fade-in-up">
        <div className="space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            success ? 'bg-primary/20' : 'bg-destructive/20'
          }`}>
            {success ? (
              <CheckCircle className="h-10 w-10 text-primary" />
            ) : (
              <AlertCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${
              success ? 'text-foreground' : 'text-destructive'
            }`}>
              {success ? 'Foto enviada!' : 'Erro no envio'}
            </h2>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>

          {success ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Deseja enviar mais fotos?
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={onContinue}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
                
                <Button
                  onClick={handleFinish}
                  variant="outline"
                  className="flex-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
              >
                <Camera className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PhotoSuccess;