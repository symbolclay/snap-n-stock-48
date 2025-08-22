import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Download } from "lucide-react";
import { ImageEditor } from "./ImageEditor";
import { supabase } from "@/integrations/supabase/client";

interface ProductData {
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  data: string;
  categoria: string;
}

interface SharePreviewProps {
  productData: ProductData;
  onBack: () => void;
  onContinue: () => void;
  clientId?: string;
}

const SharePreview = ({ productData, onBack, onContinue, clientId }: SharePreviewProps) => {
  const [feedImage, setFeedImage] = useState<string>("");
  const [storyImage, setStoryImage] = useState<string>("");
  const [hasWebhook, setHasWebhook] = useState<boolean>(false);

  useEffect(() => {
    const checkWebhook = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('webhook_url')
          .eq('id', clientId)
          .single();

        if (!error && data?.webhook_url) {
          setHasWebhook(true);
        }
      } catch (error) {
        console.error('Erro ao verificar webhook:', error);
      }
    };

    checkWebhook();
  }, [clientId]);

  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    link.click();
  };

  const shareToWhatsApp = (imageData: string, format: string) => {
    // Converte a imagem para blob e cria URL para compartilhar
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        if (navigator.share) {
          const file = new File([blob], `produto-${format}.png`, { type: 'image/png' });
          navigator.share({
            title: `${productData.nome} - ${format}`,
            text: `Confira este produto: ${productData.nome}`,
            files: [file]
          });
        } else {
          // Fallback: download da imagem
          downloadImage(imageData, `produto-${format}.png`);
        }
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Compartilhar Produto</h2>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Feed Format */}
        <Card className="p-4 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Formato Feed (4:5)</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => feedImage && downloadImage(feedImage, 'produto-feed.png')}
                  disabled={!feedImage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
            
            <div className="max-w-sm mx-auto">
              <ImageEditor
                originalImage={productData.imagem}
                productName={productData.nome}
                regularPrice={productData.preco_regular.replace(/[^\d,]/g, '').replace(',', '.')}
                offerPrice={productData.preco_oferta ? productData.preco_oferta.replace(/[^\d,]/g, '').replace(',', '.') : undefined}
                onImageGenerated={setFeedImage}
                format="web"
              />
            </div>
          </div>
        </Card>

        {/* Story Format */}
        <Card className="p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Formato Story (9:16)</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => storyImage && downloadImage(storyImage, 'produto-story.png')}
                  disabled={!storyImage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
            
            <div className="max-w-xs mx-auto">
              <ImageEditor
                originalImage={productData.imagem}
                productName={productData.nome}
                regularPrice={productData.preco_regular.replace(/[^\d,]/g, '').replace(',', '.')}
                offerPrice={productData.preco_oferta ? productData.preco_oferta.replace(/[^\d,]/g, '').replace(',', '.') : undefined}
                onImageGenerated={setStoryImage}
                format="mobile"
              />
            </div>
          </div>
        </Card>

        {/* Product Info */}
        <Card className="p-4 animate-fade-in-up bg-secondary/30" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-2">
            <h4 className="font-semibold text-primary">{productData.nome}</h4>
            <div className="flex items-center gap-2">
              {productData.preco_oferta && (
                <span className="text-sm text-muted-foreground line-through">
                  {productData.preco_regular}
                </span>
              )}
              <span className="font-semibold text-primary">
                {productData.preco_oferta || productData.preco_regular}
              </span>
            </div>
            {productData.descricao && (
              <p className="text-sm text-muted-foreground">{productData.descricao}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0 fixed bottom-0 left-0 right-0 z-10">
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
        >
          Continuar Adicionando Produtos
        </Button>
      </div>
    </div>
  );
};

export default SharePreview;