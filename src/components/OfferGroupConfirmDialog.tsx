import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";

interface ProductData {
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
}

interface OfferGroupConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: ProductData | null;
  isLoading?: boolean;
}

const OfferGroupConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productData,
  isLoading = false
}: OfferGroupConfirmDialogProps) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar para Grupo de Oferta
          </DialogTitle>
          <DialogDescription>
            Deseja enviar este produto para o grupo de oferta no WhatsApp?
          </DialogDescription>
        </DialogHeader>
        
        {productData && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex gap-3">
                <img 
                  src={productData.imagem} 
                  alt={productData.nome}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{productData.nome}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {productData.preco_oferta && (
                      <span className="text-xs text-muted-foreground line-through">
                        {productData.preco_regular}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-primary">
                      {productData.preco_oferta || productData.preco_regular}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ O produto será enviado automaticamente para o grupo de oferta com a imagem editada e informações do produto.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="confirm-send"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="confirm-send" className="text-sm text-muted-foreground">
                Confirmo que desejo enviar este produto para o grupo de oferta
              </label>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferGroupConfirmDialog;