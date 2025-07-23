import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CameraCapture from "@/components/CameraCapture";
import ProductForm from "@/components/ProductForm";
import ProductGrid from "@/components/ProductGrid";
import PhotoSuccess from "@/components/PhotoSuccess";
import { Button } from "@/components/ui/button";
import { Camera, Grid, ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  slug: string;
}

interface ProductData {
  id: string;
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  data: string;
}

const ClientPage = () => {
  const { clientSlug } = useParams();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'camera' | 'form' | 'grid' | 'success' | 'edit'>('camera');
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [lastSaveSuccess, setLastSaveSuccess] = useState(false);
  const [lastSaveMessage, setLastSaveMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    if (!clientSlug) return;
    
    const fetchClient = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('slug', clientSlug)
          .single();

        if (error) {
          toast({
            title: "Cliente não encontrado",
            description: "Verifique se o link está correto",
            variant: "destructive"
          });
          return;
        }

        setClient(data);
        loadProducts(data.id);
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientSlug, toast]);

  const loadProducts = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: ProductData[] = data.map(product => ({
        id: product.id,
        nome: product.nome,
        preco_regular: product.preco_regular,
        preco_oferta: product.preco_oferta || "",
        descricao: product.descricao || "",
        imagem: product.imagem,
        data: product.created_at
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handlePhotoCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setCurrentView('form');
  };

  const handleSaveProduct = async (productData: ProductData) => {
    if (!client) return;

    try {
      if (editingProduct) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update({
            nome: productData.nome,
            preco_regular: productData.preco_regular,
            preco_oferta: productData.preco_oferta || null,
            descricao: productData.descricao || null,
            imagem: productData.imagem
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        // Recarregar produtos
        await loadProducts(client.id);
        
        // Mostrar tela de sucesso
        setLastSaveSuccess(true);
        setLastSaveMessage("Produto atualizado com sucesso!");
        setCurrentView('success');
        setEditingProduct(null);
      } else {
        // Inserir novo produto
        const { error } = await supabase
          .from('products')
          .insert({
            client_id: client.id,
            nome: productData.nome,
            preco_regular: productData.preco_regular,
            preco_oferta: productData.preco_oferta || null,
            descricao: productData.descricao || null,
            imagem: productData.imagem
          });

        if (error) throw error;

        // Recarregar produtos
        await loadProducts(client.id);
        
        // Mostrar tela de sucesso
        setLastSaveSuccess(true);
        setLastSaveMessage("Sua foto foi enviada com sucesso!");
        setCurrentView('success');
      }
      
      setCapturedImage("");
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      
      // Mostrar tela de erro
      setLastSaveSuccess(false);
      setLastSaveMessage("Não foi possível processar. Tente novamente.");
      setCurrentView('success');
    }
  };

  const handleContinuePhotos = () => {
    setCurrentView('camera');
  };

  const handleFinishPhotos = () => {
    setCurrentView('camera');
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      if (client) {
        await loadProducts(client.id);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  };

  const handleClearAll = async () => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('client_id', client.id);

      if (error) throw error;

      setProducts([]);
      toast({
        title: "Produtos removidos",
        description: "Todos os produtos foram excluídos"
      });
    } catch (error) {
      console.error('Erro ao limpar produtos:', error);
    }
  };

  const handleEditProduct = (product: ProductData) => {
    setEditingProduct(product);
    setCapturedImage(product.imagem);
    setCurrentView('edit');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `produtos_${client?.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
            <p className="text-sm text-muted-foreground">Upload de Produtos</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="h-4 w-4" />
              Produtos ({products.length})
            </Button>
            
            <Button
              variant={currentView === 'camera' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('camera')}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Câmera
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'camera' && (
          <CameraCapture onCapture={handlePhotoCapture} onClose={() => setCurrentView('camera')} />
        )}

        {currentView === 'form' && (
          <ProductForm
            imageData={capturedImage}
            onSave={handleSaveProduct}
            onClose={() => {
              setCurrentView('camera');
              setCapturedImage("");
            }}
          />
        )}

        {currentView === 'edit' && editingProduct && (
          <ProductForm
            imageData={capturedImage}
            productData={editingProduct}
            onSave={handleSaveProduct}
            onClose={() => {
              setCurrentView('grid');
              setCapturedImage("");
              setEditingProduct(null);
            }}
          />
        )}

        {currentView === 'grid' && (
          <ProductGrid
            products={products}
            onDeleteProduct={handleDeleteProduct}
            onClearAll={handleClearAll}
            onExport={handleExport}
            onEditProduct={handleEditProduct}
          />
        )}

        {currentView === 'success' && (
          <PhotoSuccess
            success={lastSaveSuccess}
            message={lastSaveMessage}
            onContinue={handleContinuePhotos}
            onFinish={handleFinishPhotos}
          />
        )}
      </div>
    </div>
  );
};

export default ClientPage;