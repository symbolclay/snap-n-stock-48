import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Link2, Eye, Edit, Trash2, ExternalLink, Tag, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  slug: string;
  created_at: string;
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
}

const AdminPage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
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
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadProducts = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', clientId)
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
        created_at: product.created_at
      })));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const createCampaign = async () => {
    if (!newClientName.trim()) return;

    const campaignFullName = newCampaignName.trim() 
      ? `${newClientName} - ${newCampaignName}`
      : newClientName;

    const slug = campaignFullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    try {
      const { error } = await supabase
        .from('clients')
        .insert({ name: campaignFullName, slug });

      if (error) throw error;

      toast({
        title: "Campanha criada!",
        description: "Nova campanha adicionada com sucesso"
      });

      setNewClientName("");
      setNewCampaignName("");
      setShowNewClientDialog(false);
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message.includes('duplicate') 
          ? "Já existe uma campanha com esse nome" 
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
        description: "Cliente e todos os produtos foram excluídos"
      });

      loadClients();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
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

      if (selectedClient) {
        loadProducts(selectedClient.id);
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

      if (selectedClient) {
        loadProducts(selectedClient.id);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  };

  const viewClientProducts = async (client: Client) => {
    setSelectedClient(client);
    await loadProducts(client.id);
    setShowProductsDialog(true);
  };

  const openTagsDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowTagsDialog(true);
  };

  const copyClientLink = (slug: string) => {
    const link = `${window.location.origin}/cliente/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link do cliente copiado para a área de transferência"
    });
  };

  // Filtrar clientes baseado na pesquisa
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <p className="text-muted-foreground">Gerencie clientes e produtos</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowNewClientDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
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
            placeholder="Pesquisar cliente ou campanha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{client.name}</h3>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyClientLink(client.slug)}
                    className="justify-start"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewClientProducts(client)}
                    className="justify-start"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Produtos
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/cliente/${client.slug}`, '_blank')}
                    className="justify-start"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Página
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteClient(client.id)}
                    className="justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Cliente
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome do cliente"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            <Input
              placeholder="Nome da campanha (opcional)"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCampaign()}
            />
            <div className="text-sm text-muted-foreground">
              Resultado: {newClientName}{newCampaignName && ` - ${newCampaignName}`}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
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
            <DialogTitle>
              Produtos - {selectedClient?.name} ({products.length})
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