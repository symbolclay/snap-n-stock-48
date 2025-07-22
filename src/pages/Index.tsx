import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Package2, Sparkles, Archive } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import ProductForm from "@/components/ProductForm";
import ProductGrid from "@/components/ProductGrid";
import { useToast } from "@/hooks/use-toast";

interface ProductData {
  id: string;
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  data: string;
}

type AppState = 'home' | 'camera' | 'form' | 'products';

const Index = () => {
  const { toast } = useToast();
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [products, setProducts] = useState<ProductData[]>([]);

  // Load products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('ai-products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error('Error loading products:', error);
      }
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('ai-products', JSON.stringify(products));
  }, [products]);

  const handleStartCamera = () => {
    // Check camera permission
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Câmera não suportada",
        description: "Seu navegador não suporta acesso à câmera",
        variant: "destructive"
      });
      return;
    }

    setCurrentState('camera');
  };

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setCurrentState('form');
  };

  const handleProductSave = (productData: Omit<ProductData, 'id'>) => {
    const newProduct: ProductData = {
      ...productData,
      id: Date.now().toString()
    };

    setProducts(prev => [newProduct, ...prev]);
    
    // Auto-return to camera for next product
    setTimeout(() => {
      setCurrentState('camera');
    }, 1000);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleClearAllProducts = () => {
    setProducts([]);
    toast({
      title: "Produtos removidos",
      description: "Todos os produtos foram excluídos"
    });
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      toast({
        title: "Nenhum produto",
        description: "Não há produtos para exportar"
      });
      return;
    }

    try {
      const dataStr = JSON.stringify(products, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `produtos-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Produtos exportados",
        description: "Arquivo JSON baixado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os produtos",
        variant: "destructive"
      });
    }
  };

  const handleCloseCamera = () => {
    setCurrentState('home');
  };

  const handleCloseForm = () => {
    setCurrentState('home');
  };

  const handleViewProducts = () => {
    setCurrentState('products');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
  };

  // Render different states
  if (currentState === 'camera') {
    return (
      <CameraCapture
        onCapture={handleImageCapture}
        onClose={handleCloseCamera}
      />
    );
  }

  if (currentState === 'form') {
    return (
      <ProductForm
        imageData={capturedImage}
        onSave={handleProductSave}
        onClose={handleCloseForm}
      />
    );
  }

  if (currentState === 'products') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="hover:bg-secondary"
            >
              ← Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Meus Produtos</h1>
            </div>
            <div className="w-16" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <ProductGrid
            products={products}
            onDeleteProduct={handleDeleteProduct}
            onClearAll={handleClearAllProducts}
            onExport={handleExportProducts}
          />
        </div>
      </div>
    );
  }

  // Home state
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sistema IA de Produtos
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Capture produtos com a câmera e deixe a IA te orientar para fotos perfeitas
            </p>
          </div>
        </div>

        {/* Stats */}
        {products.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{products.length}</p>
                <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">
                  {products.reduce((sum, product) => {
                    try {
                      const price = product.preco_oferta || product.preco_regular;
                      const value = parseFloat(price.replace(/[R$\s.]/g, '').replace(',', '.'));
                      return sum + (isNaN(value) ? 0 : value);
                    } catch {
                      return sum;
                    }
                  }, 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Actions */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Primary Action - Camera */}
          <Button
            onClick={handleStartCamera}
            variant="gradient"
            size="xl"
            className="w-full h-16 text-lg rounded-2xl shadow-lg"
          >
            <Camera className="h-6 w-6 mr-3" />
            Tirar Foto do Produto
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleViewProducts}
              variant="outline"
              size="lg"
              className="h-14 border-primary/30 hover:bg-primary/10 rounded-xl"
              disabled={products.length === 0}
            >
              <Package2 className="h-5 w-5 mr-3" />
              Ver Produtos ({products.length})
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Card className="p-4 text-center bg-card/30 border-border/50">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">IA Orientadora</h3>
            <p className="text-sm text-muted-foreground">
              Moldura inteligente guia você para fotos perfeitas
            </p>
          </Card>

          <Card className="p-4 text-center bg-card/30 border-border/50">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Validação em Tempo Real</h3>
            <p className="text-sm text-muted-foreground">
              Sistema detecta qualidade da foto automaticamente
            </p>
          </Card>

          <Card className="p-4 text-center bg-card/30 border-border/50">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-glow/10 flex items-center justify-center">
              <Package2 className="h-6 w-6 text-primary-glow" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Cadastro Rápido</h3>
            <p className="text-sm text-muted-foreground">
              Interface otimizada para cadastros em sequência
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-xs text-muted-foreground">
            Sistema otimizado para dispositivos móveis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;