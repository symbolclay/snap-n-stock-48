import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ImageEditorProps {
  originalImage: string;
  productName: string;
  category: string;
  regularPrice: string;
  offerPrice?: string;
  onImageGenerated: (editedImage: string) => void;
  format?: 'mobile' | 'web'; // 1080x1920 ou 1080x1350
}

interface ColorTheme {
  productBg: string;
  productText: string;
  categoryBg: string;
  categoryText: string;
  priceBg: string;
  priceText: string;
}

const defaultTheme: ColorTheme = {
  productBg: '#FFD700',
  productText: '#000000',
  categoryBg: '#DC2626',
  categoryText: '#FFFFFF',
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
      categoryBg: '#1E40AF',
      categoryText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  },
  {
    name: 'Roxo',
    theme: {
      productBg: '#8B5CF6',
      productText: '#FFFFFF',
      categoryBg: '#7C3AED',
      categoryText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  },
  {
    name: 'Laranja',
    theme: {
      productBg: '#F97316',
      productText: '#FFFFFF',
      categoryBg: '#EA580C',
      categoryText: '#FFFFFF',
      priceBg: '#059669',
      priceText: '#FFFFFF',
    }
  }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({
  originalImage,
  productName,
  category,
  regularPrice,
  offerPrice,
  onImageGenerated,
  format = 'mobile'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(defaultTheme);
  const [isGenerating, setIsGenerating] = useState(false);

  const dimensions = format === 'mobile' 
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1350 };

  const generateEditedImage = async () => {
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
      // Limpar canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calcular dimensões da imagem para centralizar
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // Imagem é mais larga
        drawHeight = canvas.height * 0.6; // 60% da altura do canvas
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = canvas.height * 0.2; // 20% do topo
      } else {
        // Imagem é mais alta
        drawWidth = canvas.width * 0.8; // 80% da largura do canvas
        drawHeight = drawWidth / imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = canvas.height * 0.2; // 20% do topo
      }

      // Desenhar imagem do produto
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Configurações de texto
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Função para desenhar texto com fundo
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
        // Fundo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Texto
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillText(text, x, y);
      };

      // Nome do produto (topo)
      const productTextWidth = canvas.width * 0.7;
      const productTextHeight = 100;
      drawTextWithBackground(
        productName.toUpperCase(),
        canvas.width / 2,
        120,
        productTextWidth,
        productTextHeight,
        colorTheme.productBg,
        colorTheme.productText,
        48
      );

      // Categoria
      const categoryTextWidth = canvas.width * 0.6;
      const categoryTextHeight = 80;
      drawTextWithBackground(
        category.toUpperCase(),
        canvas.width / 2,
        220,
        categoryTextWidth,
        categoryTextHeight,
        colorTheme.categoryBg,
        colorTheme.categoryText,
        36
      );

      // Preço (parte inferior)
      const priceY = canvas.height - 120;
      const priceText = offerPrice 
        ? `POR R$ ${offerPrice}` 
        : `POR R$ ${regularPrice}`;
      
      const priceTextWidth = canvas.width * 0.8;
      const priceTextHeight = 100;
      drawTextWithBackground(
        priceText,
        canvas.width / 2,
        priceY,
        priceTextWidth,
        priceTextHeight,
        colorTheme.priceBg,
        colorTheme.priceText,
        52
      );

      // Se tem preço de oferta, mostrar preço riscado
      if (offerPrice) {
        ctx.fillStyle = '#666666';
        ctx.font = '32px Arial';
        const oldPriceText = `De R$ ${regularPrice}`;
        const oldPriceY = priceY - 80;
        
        ctx.fillText(oldPriceText, canvas.width / 2, oldPriceY);
        
        // Linha riscando o preço antigo
        const textMetrics = ctx.measureText(oldPriceText);
        const lineY = oldPriceY;
        const lineStartX = canvas.width / 2 - textMetrics.width / 2;
        const lineEndX = canvas.width / 2 + textMetrics.width / 2;
        
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 3;
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
  };

  useEffect(() => {
    generateEditedImage();
  }, [originalImage, productName, category, regularPrice, offerPrice, colorTheme, format]);

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
        <div className="grid grid-cols-3 gap-4 text-sm">
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
            <Label>Categoria</Label>
            <div 
              className="w-full h-8 rounded border flex items-center justify-center text-xs font-bold"
              style={{ 
                backgroundColor: colorTheme.categoryBg, 
                color: colorTheme.categoryText 
              }}
            >
              {category}
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