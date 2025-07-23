import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Save, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductData {
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  data: string;
}

interface ProductFormProps {
  imageData: string;
  productData?: ProductData;
  onSave: (product: ProductData) => void;
  onClose: () => void;
}

const ProductForm = ({ imageData, productData, onSave, onClose }: ProductFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: productData?.nome || "",
    preco_regular: productData?.preco_regular || "",
    preco_oferta: productData?.preco_oferta || "",
    descricao: productData?.descricao || ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Converte para formato de moeda
    const formatted = (parseFloat(numbers) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    return numbers ? formatted : '';
  };

  const handlePriceChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    handleInputChange(field, formatted);
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.preco_regular.trim()) {
      toast({
        title: "Preço obrigatório", 
        description: "Digite o preço regular do produto",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const productData: ProductData = {
        ...formData,
        imagem: imageData,
        data: new Date().toISOString()
      };

      // Simula processamento
      await new Promise(resolve => setTimeout(resolve, 800));

      onSave(productData);

      toast({
        title: "Produto salvo!",
        description: "Produto adicionado com sucesso"
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {productData ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Image Preview */}
        <Card className="p-4 animate-fade-in-up">
          <div className="aspect-square rounded-xl overflow-hidden bg-secondary/20">
            <img 
              src={imageData} 
              alt="Produto capturado"
              className="w-full h-full object-cover"
            />
          </div>
        </Card>

        {/* Form */}
        <div className="space-y-4 animate-fade-in-up pb-6" style={{ animationDelay: '0.1s' }}>
          {/* Nome do Produto */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-foreground font-medium">
              Nome do Produto *
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Café Premium Torrado"
              className="bg-secondary/50 border-border focus:border-primary transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_regular" className="text-foreground font-medium">
                Preço Regular *
              </Label>
              <Input
                id="preco_regular"
                value={formData.preco_regular}
                onChange={(e) => handlePriceChange('preco_regular', e.target.value)}
                placeholder="R$ 0,00"
                className="bg-secondary/50 border-border focus:border-primary transition-colors"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_oferta" className="text-foreground font-medium">
                Preço Oferta
              </Label>
              <Input
                id="preco_oferta"
                value={formData.preco_oferta}
                onChange={(e) => handlePriceChange('preco_oferta', e.target.value)}
                placeholder="R$ 0,00"
                className="bg-secondary/50 border-border focus:border-primary transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-foreground font-medium">
              Descrição (opcional)
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Detalhes do produto, peso, características..."
              className="bg-secondary/50 border-border focus:border-primary transition-colors resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0 fixed bottom-0 left-0 right-0 z-10">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {productData ? 'Atualizar Produto' : 'Salvar Produto'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;