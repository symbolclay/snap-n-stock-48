import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CameraCapture from "@/components/CameraCapture";
import ProductForm from "@/components/ProductForm";
import ProductGrid from "@/components/ProductGrid";
import PhotoSuccess from "@/components/PhotoSuccess";
import SharePreview from "@/components/SharePreview";
import OfferGroupConfirmDialog from "@/components/OfferGroupConfirmDialog";
import { Button } from "@/components/ui/button";
import { Camera, Grid, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateEditedImageForFeed, generateEditedImageForStory } from "@/lib/imageGenerator";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  client_id: string;
}

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
  categoria: string;
}

const CampaignPage = () => {
  const { campaignSlug } = useParams();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'welcome' | 'camera' | 'form' | 'grid' | 'success' | 'edit' | 'share'>('welcome');
  const [savedProduct, setSavedProduct] = useState<ProductData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [lastSaveSuccess, setLastSaveSuccess] = useState(false);
  const [lastSaveMessage, setLastSaveMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [showOfferGroupDialog, setShowOfferGroupDialog] = useState(false);
  const [pendingOfferProduct, setPendingOfferProduct] = useState<ProductData | null>(null);
  const [sendingToOfferGroup, setSendingToOfferGroup] = useState(false);

  useEffect(() => {
    if (!campaignSlug) return;
    
    const fetchCampaign = async () => {
      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select(`
            *,
            clients (
              id,
              name,
              slug
            )
          `)
          .eq('slug', campaignSlug)
          .single();

        if (campaignError) {
          toast({
            title: "Campanha não encontrada",
            description: "Verifique se o link está correto",
            variant: "destructive"
          });
          return;
        }

        setCampaign(campaignData);
        setClient(campaignData.clients);
        loadProducts(campaignData.id);
      } catch (error) {
        console.error('Erro ao buscar campanha:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignSlug, toast]);

  const loadProducts = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: ProductData[] = data.map((product: any) => ({
        id: product.id,
        nome: product.nome,
        preco_regular: product.preco_regular,
        preco_oferta: product.preco_oferta || "",
        descricao: product.descricao || "",
        imagem: product.imagem,
        data: product.created_at,
        categoria: product.categoria || "CATEGORIA"
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

  const sendToOfferGroup = async (productData: ProductData) => {
    if (!client?.id) return;
    
    setSendingToOfferGroup(true);

    try {
      // Buscar webhook URL do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('webhook_url')
        .eq('id', client.id)
        .single();

      if (clientError || !clientData?.webhook_url) {
        console.log('Cliente não tem webhook configurado');
        toast({
          title: "Aviso",
          description: "Cliente não tem webhook configurado para grupo de oferta",
          variant: "destructive"
        });
        return;
      }

      // Gerar imagem de feed editada
      const feedImageData = await generateEditedImageForFeed({
        nome: productData.nome,
        preco_regular: productData.preco_regular,
        preco_oferta: productData.preco_oferta || undefined,
        imagem: productData.imagem
      });

      // Gerar imagem de story editada
      const storyImageData = await generateEditedImageForStory({
        nome: productData.nome,
        preco_regular: productData.preco_regular,
        preco_oferta: productData.preco_oferta || undefined,
        imagem: productData.imagem
      });

      // Chamar edge function para enviar webhook
      const { error: webhookError } = await supabase.functions.invoke('send-to-webhook', {
        body: {
          webhookUrl: clientData.webhook_url,
          productData: {
            ...productData,
            imagem: feedImageData // Usar imagem editada
          },
          storyImageData: storyImageData // Adicionar imagem de story
        }
      });

      if (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
        toast({
          title: "Erro",
          description: "Não foi possível enviar para o grupo de oferta",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Produto enviado para o grupo de oferta com sucesso!",
        });
        setShowOfferGroupDialog(false);
      }
    } catch (error) {
      console.error('Erro ao processar envio para grupo de oferta:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar envio para grupo de oferta",
        variant: "destructive"
      });
    } finally {
      setSendingToOfferGroup(false);
    }
  };

  const handleOfferGroupConfirm = async () => {
    if (pendingOfferProduct) {
      await sendToOfferGroup(pendingOfferProduct);
    }
  };

  const handleOfferGroupClose = () => {
    setShowOfferGroupDialog(false);
    setPendingOfferProduct(null);
  };

  const handleSaveProduct = async (productData: ProductData) => {
    if (!campaign) return;

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
            imagem: productData.imagem,
            categoria: productData.categoria
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        // Recarregar produtos
        await loadProducts(campaign.id);
        
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
            campaign_id: campaign.id,
            client_id: campaign.client_id,
            nome: productData.nome,
            preco_regular: productData.preco_regular,
            preco_oferta: productData.preco_oferta || null,
            descricao: productData.descricao || null,
            imagem: productData.imagem,
            categoria: productData.categoria
          });

        if (error) throw error;

        // Recarregar produtos
        await loadProducts(campaign.id);
        
        // Verificar se cliente tem webhook configurado antes de mostrar o popup
        if (!editingProduct) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('webhook_url')
            .eq('id', campaign.client_id)
            .single();
          
          // Só mostrar popup se tiver webhook configurado
          if (clientData?.webhook_url) {
            setPendingOfferProduct(productData);
            setShowOfferGroupDialog(true);
          }
        }
        
        // Salvar produto para tela de compartilhamento
        setSavedProduct(productData);
        setCurrentView('share');
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
    setCurrentView('welcome');
  };

  const handleFinishPhotos = () => {
    setCurrentView('welcome');
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      if (campaign) {
        await loadProducts(campaign.id);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  };

  const handleClearAll = async () => {
    if (!campaign) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('campaign_id', campaign.id);

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
    
    const exportFileDefaultName = `produtos_${campaign?.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
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

  if (!campaign || !client) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">{client.name} • Upload de Produtos</p>
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
              variant={currentView === 'camera' || currentView === 'welcome' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('welcome')}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Câmera
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-full overflow-x-hidden">
        {currentView === 'welcome' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Bem-vindo à Campanha!</h2>
              <p className="text-muted-foreground max-w-md">
                Tire fotos dos seus produtos e adicione as informações necessárias para esta campanha.
                {products.length > 0 && ` Você já tem ${products.length} produto${products.length === 1 ? '' : 's'} cadastrado${products.length === 1 ? '' : 's'}.`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setCurrentView('camera')}
                size="lg"
                className="flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Tirar Foto
              </Button>
              
              {products.length > 0 && (
                <Button
                  onClick={() => setCurrentView('grid')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Grid className="w-5 h-5" />
                  Ver Produtos ({products.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {currentView === 'camera' && (
          <CameraCapture onCapture={handlePhotoCapture} onClose={() => setCurrentView('welcome')} />
        )}

        {currentView === 'form' && (
          <ProductForm
            imageData={capturedImage}
            onSave={handleSaveProduct}
            onClose={() => {
              setCurrentView('welcome');
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
            onRetakePhoto={() => {
              setCurrentView('camera');
            }}
          />
        )}

        {currentView === 'grid' && (
          <ProductGrid
            products={products}
            clientId={client?.id}
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

        {currentView === 'share' && savedProduct && (
          <SharePreview
            productData={savedProduct}
            onBack={() => setCurrentView('welcome')}
            onContinue={() => setCurrentView('welcome')}
            clientId={client?.id}
          />
        )}

        <OfferGroupConfirmDialog
          isOpen={showOfferGroupDialog}
          onClose={handleOfferGroupClose}
          onConfirm={handleOfferGroupConfirm}
          productData={pendingOfferProduct}
          isLoading={sendingToOfferGroup}
        />
      </div>
    </div>
  );
};

export default CampaignPage;