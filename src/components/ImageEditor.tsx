import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ImageEditorProps {
  originalImage: string;
  productName: string;
  regularPrice: string;
  offerPrice?: string;
  onImageGenerated: (editedImage: string) => void;
  format?: 'mobile' | 'web'; // 1080x1920 ou 1080x1350
  debounceMs?: number;
}

interface ColorTheme {
  productBg: string;
  productText: string;
  priceBg: string;
  priceText: string;
}

const defaultTheme: ColorTheme = {
  productBg: '#FFD700',
  productText: '#000000',
  priceBg: '#16A34A',
  priceText: '#FFFFFF',
};

const colorPresets = [
  {
    name: 'Padrão',
    theme: defaultTheme
  },
  {
    name: 'Azul',
    theme: {
      productBg: '#3B82F6',
      productText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  },
  {
    name: 'Roxo',
    theme: {
      productBg: '#8B5CF6',
      productText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  },
  {
    name: 'Laranja',
    theme: {
      productBg: '#F97316',
      productText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({
  originalImage,
  productName,
  regularPrice,
  offerPrice,
  onImageGenerated,
  format = 'mobile',
  debounceMs = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(defaultTheme);
  const [isGenerating, setIsGenerating] = useState(false);

  const dimensions = format === 'mobile' 
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1350 };

  const generateEditedImage = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar dimensões do canvas
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Criar imagem
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calcular dimensões para cobrir todo o canvas (sem espaços em branco)
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // Imagem é mais larga - usar altura total
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        // Imagem é mais alta - usar largura total
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }

      // Desenhar imagem de fundo cobrindo todo o canvas
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Configurações de texto
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Função para desenhar texto com fundo arredondado
      const drawTextWithBackground = (
        text: string, 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        bgColor: string, 
        textColor: string, 
        fontSize: number
      ) => {
        const radius = 15;
        
        // Fundo arredondado
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(x - width/2, y - height/2, width, height, radius);
        ctx.fill();
        
        // Texto
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
        ctx.fillText(text, x, y);
      };

      // Nome do produto (topo)
      const productTextWidth = canvas.width * 0.85;
      const productTextHeight = format === 'mobile' ? 120 : 100;
      const productY = format === 'mobile' ? 150 : 120;
      drawTextWithBackground(
        productName.toUpperCase(),
        canvas.width / 2,
        productY,
        productTextWidth,
        productTextHeight,
        colorTheme.productBg,
        colorTheme.productText,
        format === 'mobile' ? 56 : 48
      );


      // Preço (parte inferior) - ajustar posição para story
      const priceY = format === 'mobile' ? canvas.height - 300 : canvas.height - 120;
      const priceText = offerPrice 
        ? `POR R$ ${offerPrice}` 
        : `POR R$ ${regularPrice}`;
      
      const priceTextWidth = canvas.width * 0.9;
      const priceTextHeight = format === 'mobile' ? 130 : 110;
      drawTextWithBackground(
        priceText,
        canvas.width / 2,
        priceY,
        priceTextWidth,
        priceTextHeight,
        colorTheme.priceBg,
        colorTheme.priceText,
        format === 'mobile' ? 60 : 52
      );

      // Se tem preço de oferta, mostrar preço riscado acima
      if (offerPrice) {
        const oldPriceY = priceY - (format === 'mobile' ? 100 : 80);
        const oldPriceText = `De R$ ${regularPrice}`;
        
        // Fundo semi-transparente para o preço antigo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(
          canvas.width / 2 - 200, 
          oldPriceY - 30, 
          400, 
          60, 
          10
        );
        ctx.fill();
        
        // Texto do preço antigo
        ctx.fillStyle = '#CCCCCC';
        ctx.font = `bold ${format === 'mobile' ? 36 : 32}px Arial`;
        ctx.fillText(oldPriceText, canvas.width / 2, oldPriceY);
        
        // Linha riscando o preço antigo
        const textMetrics = ctx.measureText(oldPriceText);
        const lineY = oldPriceY;
        const lineStartX = canvas.width / 2 - textMetrics.width / 2;
        const lineEndX = canvas.width / 2 + textMetrics.width / 2;
        
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineEndX, lineY);
        ctx.stroke();
      }

      // Converter para base64 e chamar callback
      const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
      onImageGenerated(editedImageData);
      setIsGenerating(false);
    };

    img.src = originalImage;
  }, [originalImage, productName, regularPrice, offerPrice, colorTheme, format, onImageGenerated]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateEditedImage();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [generateEditedImage, debounceMs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {colorPresets.map((preset) => (
          <Button
            key={preset.name}
            variant={colorTheme === preset.theme ? "default" : "outline"}
            size="sm"
            onClick={() => setColorTheme(preset.theme)}
            className="text-xs"
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>Produto</Label>
            <div 
              className="w-full h-8 rounded border flex items-center justify-center text-xs font-bold"
              style={{ 
                backgroundColor: colorTheme.productBg, 
                color: colorTheme.productText 
              }}
            >
              {productName.substring(0, 15)}...
            </div>
          </div>
          
          <div>
            <Label>Preço</Label>
            <div 
              className="w-full h-8 rounded border flex items-center justify-center text-xs font-bold"
              style={{ 
                backgroundColor: colorTheme.priceBg, 
                color: colorTheme.priceText 
              }}
            >
              R$ {offerPrice || regularPrice}
            </div>
          </div>
        </div>
      </Card>

      <canvas
        ref={canvasRef}
        className="w-full max-w-sm mx-auto border rounded-lg"
        style={{
          aspectRatio: format === 'mobile' ? '9/16' : '4/5'
        }}
      />

      {isGenerating && (
        <div className="text-center text-sm text-muted-foreground">
          Gerando imagem editada...
        </div>
      )}
    </div>
  );
};