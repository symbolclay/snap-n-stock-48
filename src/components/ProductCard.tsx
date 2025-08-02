import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Eye, Download, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = product.imagem;
    link.download = `${product.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
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

      // Send to webhook via edge function - send the image data from product.imagem
      const { data, error } = await supabase.functions.invoke('send-to-webhook', {
        body: {
          webhookUrl: clientData.webhook_url,
          productData: {
            ...product,
            // Ensure we're sending the edited image
            imagem: product.imagem
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
            onClick={downloadImage}
            className="w-8 h-8 bg-black/50 hover:bg-black/70 border-0"
            title="Baixar imagem"
          >
            <Download className="h-4 w-4 text-white" />
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

        {/* Webhook Button */}
        {clientId && (
          <div className="pt-2">
            <Button 
              onClick={sendToWebhook}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar para Grupo de Oferta
            </Button>
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