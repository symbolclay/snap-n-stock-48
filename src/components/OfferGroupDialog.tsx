import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle, X } from "lucide-react";

interface OfferGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  imageData: string;
}

const OfferGroupDialog = ({ isOpen, onClose, onConfirm, onCancel, imageData }: OfferGroupDialogProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSendClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSend = () => {
    setShowConfirmation(false);
    onConfirm();
    onClose();
  };

  const handleCancelSend = () => {
    setShowConfirmation(false);
    onCancel();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Enviar para Grupo de Oferta
              </DialogTitle>
              <DialogDescription>
                Sua foto foi capturada com sucesso! Deseja enviar para o grupo de oferta do WhatsApp?
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center my-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageData} 
                  alt="Foto capturada" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Não, Continuar sem Enviar
              </Button>
              <Button
                onClick={handleSendClick}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar para Grupo de Oferta
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Envio
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja enviar esta foto para o grupo de oferta? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center my-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageData} 
                  alt="Foto capturada" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCancelSend}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSend}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Sim, Enviar Agora
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OfferGroupDialog;