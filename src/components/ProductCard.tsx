import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Eye, Download, Send, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageEditor } from "./ImageEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductData {
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  data: string;
  categoria: string;
}

interface ProductCardProps {
  product: ProductData;
  clientId?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}

const ProductCard = ({ product, clientId, onDelete, onEdit, onView }: ProductCardProps) => {
  const { toast } = useToast();
  const hasOffer = product.preco_oferta && product.preco_oferta !== product.preco_regular;
  const [editedImage, setEditedImage] = useState<string>('');
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate edited image for WhatsApp format
  const generateEditedImageForWhatsApp = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      canvas.width = 1080;
      canvas.height = 1350;

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Cover the entire canvas
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Add text overlays
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const drawTextWithBackground = (
          text: string, x: number, y: number, width: number, height: number, 
          bgColor: string, textColor: string, fontSize: number
        ) => {
          const radius = 15;
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(x - width/2, y - height/2, width, height, radius);
          ctx.fill();
          
          ctx.fillStyle = textColor;
          ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
          ctx.fillText(text, x, y);
        };

        // Product name
        drawTextWithBackground(
          product.nome.toUpperCase(),
          canvas.width / 2, 150,
          canvas.width * 0.85, 100,
          '#FFD700', '#000000', 48
        );

        // Price
        const priceText = hasOffer ? `POR R$ ${product.preco_oferta}` : `POR R$ ${product.preco_regular}`;
        drawTextWithBackground(
          priceText,
          canvas.width / 2, canvas.height - 120,
          canvas.width * 0.9, 110,
          '#16A34A', '#FFFFFF', 52
        );

        // Old price if on offer
        if (hasOffer) {
          const oldPriceY = canvas.height - 200;
          const oldPriceText = `De R$ ${product.preco_regular}`;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.roundRect(canvas.width / 2 - 200, oldPriceY - 30, 400, 60, 10);
          ctx.fill();
          
          ctx.fillStyle = '#CCCCCC';
          ctx.font = 'bold 32px Arial';
          ctx.fillText(oldPriceText, canvas.width / 2, oldPriceY);
          
          const textMetrics = ctx.measureText(oldPriceText);
          ctx.strokeStyle = '#FF4444';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - textMetrics.width / 2, oldPriceY);
          ctx.lineTo(canvas.width / 2 + textMetrics.width / 2, oldPriceY);
          ctx.stroke();
        }

        const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
        setEditedImage(editedImageData);
        resolve(editedImageData);
      };

      img.src = product.imagem;
    });
  };

  const downloadOriginalImage = () => {
    const link = document.createElement('a');
    link.href = product.imagem;
    link.download = `${product.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_original.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEditedImage = async () => {
    if (!editedImage) {
      await generateEditedImageForWhatsApp();
    }
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `${product.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_editada.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendToWebhook = async () => {
    if (!clientId) {
      toast({
        title: "Erro",
        description: "ID do cliente não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get client webhook URL
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('webhook_url')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      if (!clientData?.webhook_url) {
        toast({
          title: "Webhook não configurado",
          description: "Configure o webhook do cliente no painel administrativo",
          variant: "destructive"
        });
        return;
      }

      // Generate edited image for WhatsApp
      const editedImageData = await generateEditedImageForWhatsApp();
      
      // Send to webhook via edge function - send the edited image
      const { data, error } = await supabase.functions.invoke('send-to-webhook', {
        body: {
          webhookUrl: clientData.webhook_url,
          productData: {
            ...product,
            // Send the edited image instead of the original
            imagem: editedImageData
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Enviado com sucesso!",
        description: "Produto enviado para grupo de oferta",
      });

    } catch (error: any) {
      console.error('Erro ao enviar para webhook:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o produto",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 animate-fade-in-up group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img 
          src={product.imagem} 
          alt={product.nome}
          className="w-full h-auto max-h-64 object-contain group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Offer Badge */}
        {hasOffer && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-accent text-accent-foreground font-semibold px-3 py-1 shadow-lg">
              OFERTA
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="secondary"
            onClick={downloadOriginalImage}
            className="w-8 h-8 bg-black/50 hover:bg-black/70 border-0"
            title="Baixar foto original"
          >
            <Download className="h-4 w-4 text-white" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={downloadEditedImage}
            className="w-8 h-8 bg-black/50 hover:bg-black/70 border-0"
            title="Baixar com texto para WhatsApp"
          >
            <Image className="h-4 w-4 text-white" />
          </Button>
          {onView && (
            <Button
              size="icon"
              variant="secondary"
              onClick={onView}
              className="w-8 h-8 bg-black/50 hover:bg-black/70 border-0"
            >
              <Eye className="h-4 w-4 text-white" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="secondary"
              onClick={onEdit}
              className="w-8 h-8 bg-black/50 hover:bg-black/70 border-0"
            >
              <Edit3 className="h-4 w-4 text-white" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="destructive"
              onClick={onDelete}
              className="w-8 h-8 bg-destructive/80 hover:bg-destructive border-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
          {product.nome}
        </h3>

        {/* Prices */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            {hasOffer ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {product.preco_oferta}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {product.preco_regular}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {product.preco_regular}
              </span>
            )}
          </div>

          {/* Savings calculation */}
          {hasOffer && (
            <div className="text-xs text-accent font-medium">
              Economia de {calculateSavings(product.preco_regular, product.preco_oferta)}
            </div>
          )}
        </div>

        {/* Description */}
        {product.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.descricao}
          </p>
        )}

        {/* Date */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Cadastrado em {formatDate(product.data)}
          </p>
        </div>

        {/* Webhook Button with Confirmation */}
        {clientId && (
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Grupo de Oferta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja enviar o produto "{product.nome}" para o grupo de oferta? 
                    A imagem será enviada no formato editado para WhatsApp.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={sendToWebhook}>
                    Sim, enviar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Card>
  );
};

// Helper function to calculate savings
const calculateSavings = (regular: string, offer: string) => {
  try {
    const regularPrice = parseFloat(regular.replace(/[R$\s.]/g, '').replace(',', '.'));
    const offerPrice = parseFloat(offer.replace(/[R$\s.]/g, '').replace(',', '.'));
    
    if (regularPrice > offerPrice) {
      const savings = regularPrice - offerPrice;
      const percentage = ((savings / regularPrice) * 100).toFixed(0);
      
      return `${percentage}%`;
    }
    return '0%';
  } catch {
    return '0%';
  }
};

export default ProductCard;
