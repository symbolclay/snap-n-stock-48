import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Link2, Eye, Edit, Trash2, ExternalLink, Tag, Search, Download, Archive, ChevronDown, ChevronRight, Calendar, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

interface Product {
  id: string;
  nome: string;
  preco_regular: string;
  preco_oferta: string;
  descricao: string;
  imagem: string;
  tags: { google: boolean; meta: boolean };
  created_at: string;
  campaign_id: string;
}

const AdminPage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [clientForNewCampaign, setClientForNewCampaign] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === "Fotos@Symbol") {
      setIsAuthenticated(true);
      setPassword("");
      toast({
        title: "Acesso autorizado",
        description: "Bem-vindo ao painel administrativo"
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Tente novamente",
        variant: "destructive"
      });
      setPassword("");
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      
      // Carregar campanhas para todos os clientes
      if (data && data.length > 0) {
        loadAllCampaigns();
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadAllCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          products(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const campaignsWithCount = (data || []).map(campaign => ({
        ...campaign,
        product_count: campaign.products?.[0]?.count || 0
      }));
      
      setCampaigns(campaignsWithCount);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  const loadProducts = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []).map(product => ({
        id: product.id,
        nome: product.nome,
        preco_regular: product.preco_regular,
        preco_oferta: product.preco_oferta || "",
        descricao: product.descricao || "",
        imagem: product.imagem,
        tags: (product.tags as any) || { google: false, meta: false },
        created_at: product.created_at,
        campaign_id: product.campaign_id
      })));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const createClient = async () => {
    if (!newClientName.trim()) return;

    const slug = newClientName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    try {
      const { error } = await supabase
        .from('clients')
        .insert({ name: newClientName, slug });

      if (error) throw error;

      toast({
        title: "Cliente criado!",
        description: "Novo cliente adicionado com sucesso"
      });

      setNewClientName("");
      setShowNewClientDialog(false);
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message.includes('duplicate') 
          ? "Já existe um cliente com esse nome" 
          : "Não foi possível criar o cliente",
        variant: "destructive"
      });
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim() || !clientForNewCampaign) return;

    const slug = newCampaignName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({ 
          client_id: clientForNewCampaign.id,
          name: newCampaignName, 
          slug 
        });

      if (error) throw error;

      toast({
        title: "Campanha criada!",
        description: "Nova campanha adicionada com sucesso"
      });

      setNewCampaignName("");
      setClientForNewCampaign(null);
      setShowNewCampaignDialog(false);
      loadAllCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message.includes('duplicate') 
          ? "Já existe uma campanha com esse nome para este cliente" 
          : "Não foi possível criar a campanha",
        variant: "destructive"
      });
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Cliente removido",
        description: "Cliente e todas as campanhas foram excluídas"
      });

      loadClients();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campanha removida",
        description: "Campanha e todos os produtos foram excluídos"
      });

      loadAllCampaigns();
    } catch (error) {
      console.error('Erro ao deletar campanha:', error);
    }
  };

  const updateProductTags = async (productId: string, tags: { google: boolean; meta: boolean }) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ tags })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Tags atualizadas",
        description: "Tags do produto foram salvas"
      });

      if (selectedCampaign) {
        loadProducts(selectedCampaign.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto removido",
        description: "Produto foi excluído"
      });

      if (selectedCampaign) {
        loadProducts(selectedCampaign.id);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  };

  const viewCampaignProducts = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    await loadProducts(campaign.id);
    setShowProductsDialog(true);
  };

  const openTagsDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowTagsDialog(true);
  };

  const copyCampaignLink = (campaign: Campaign) => {
    const link = `${window.location.origin}/client/${campaign.slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link da campanha copiado para a área de transferência"
    });
  };

  const downloadImage = async (imageUrl: string, productName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: `Baixando foto de ${productName}`
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive"
      });
    }
  };

  const downloadAllImages = async (campaignName: string) => {
    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setTimeout(() => {
          downloadImage(product.imagem, `${campaignName}_${product.nome}_${i + 1}`);
        }, i * 500);
      }
      
      toast({
        title: "Downloads iniciados",
        description: `Baixando ${products.length} fotos de ${campaignName}`
      });
    } catch (error) {
      toast({
        title: "Erro nos downloads",
        description: "Não foi possível baixar todas as imagens",
        variant: "destructive"
      });
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCampaignsForClient = (clientId: string) => {
    return campaigns.filter(campaign => campaign.client_id === clientId);
  };

  const getTotalPhotosForClient = (clientId: string) => {
    return getCampaignsForClient(clientId).reduce((total, campaign) => 
      total + (campaign.product_count || 0), 0
    );
  };

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-muted-foreground">Digite a senha para acessar</p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin} className="w-full">
                Entrar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie clientes e campanhas</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowNewClientDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 pb-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients and Campaigns Hierarchy */}
      <div className="p-6 pt-0">
        <div className="space-y-4">
          {filteredClients.map((client) => {
            const clientCampaigns = getCampaignsForClient(client.id);
            const totalPhotos = getTotalPhotosForClient(client.id);
            const isExpanded = expandedClients.has(client.id);

            return (
              <Card key={client.id} className="p-6">
                <div className="space-y-4">
                  {/* Client Header */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleClientExpansion(client.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart className="h-4 w-4" />
                            {clientCampaigns.length} campanhas
                          </span>
                          <span className="flex items-center gap-1">
                            <Archive className="h-4 w-4" />
                            {totalPhotos} fotos
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClientForNewCampaign(client);
                          setShowNewCampaignDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Campanha
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Campaigns List */}
                  {isExpanded && (
                    <div className="ml-8 space-y-3 border-l-2 border-border pl-4">
                      {clientCampaigns.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">
                          Nenhuma campanha ainda. Clique em "Nova Campanha" para criar.
                        </p>
                      ) : (
                        clientCampaigns.map((campaign) => (
                          <Card key={campaign.id} className="p-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{campaign.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span>{campaign.product_count || 0} fotos</span>
                                  <span>{new Date(campaign.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyCampaignLink(campaign)}
                                >
                                  <Link2 className="h-4 w-4 mr-1" />
                                  Copiar Link
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewCampaignProducts(campaign)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Fotos
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/client/${campaign.slug}`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteCampaign(campaign.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome do cliente"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createClient()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createClient}>
                Criar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Criar Nova Campanha
              {clientForNewCampaign && (
                <span className="text-sm font-normal text-muted-foreground block mt-1">
                  para {clientForNewCampaign.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da campanha"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCampaign()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCampaignDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createCampaign}>
                Criar Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Fotos - {selectedCampaign?.name} ({products.length})</span>
              {products.length > 0 && (
                <Button
                  onClick={() => selectedCampaign && downloadAllImages(selectedCampaign.name)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Baixar Todas
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="space-y-3">
                  <img
                    src={product.imagem}
                    alt={product.nome}
                    className="w-full h-40 object-cover rounded"
                  />
                  
                  <div>
                    <h4 className="font-semibold">{product.nome}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-sm font-medium">{product.preco_regular}</span>
                      {product.preco_oferta && (
                        <Badge variant="secondary">{product.preco_oferta}</Badge>
                      )}
                    </div>
                    {product.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{product.descricao}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(product.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={product.tags.google ? "default" : "outline"}>
                      Google: {product.tags.google ? "Sim" : "Não"}
                    </Badge>
                    <Badge variant={product.tags.meta ? "default" : "outline"}>
                      Meta: {product.tags.meta ? "Sim" : "Não"}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(product.imagem, product.nome)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTagsDialog(product)}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Tags
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tags - {selectedProduct?.nome}</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="google"
                  checked={selectedProduct.tags.google}
                  onCheckedChange={(checked) => {
                    const newTags = { ...selectedProduct.tags, google: !!checked };
                    setSelectedProduct({ ...selectedProduct, tags: newTags });
                  }}
                />
                <label htmlFor="google" className="text-sm font-medium">
                  Produto está em anúncio no Google Ads
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meta"
                  checked={selectedProduct.tags.meta}
                  onCheckedChange={(checked) => {
                    const newTags = { ...selectedProduct.tags, meta: !!checked };
                    setSelectedProduct({ ...selectedProduct, tags: newTags });
                  }}
                />
                <label htmlFor="meta" className="text-sm font-medium">
                  Produto está em anúncio no Meta Ads
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTagsDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  updateProductTags(selectedProduct.id, selectedProduct.tags);
                  setShowTagsDialog(false);
                }}>
                  Salvar Tags
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;