import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Link2, Eye, Edit, Trash2, ExternalLink, Search, Calendar, Camera, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  slug: string;
  webhook_url?: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

const AdminPage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showEditCampaignDialog, setShowEditCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientWebhook, setNewClientWebhook] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentView, setCurrentView] = useState<'clients' | 'campaigns'>('clients');
  
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

  const loadCampaigns = async (clientId: string) => {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get product count for each campaign
      const campaignsWithCount = await Promise.all((campaignsData || []).map(async (campaign) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);
        
        return {
          ...campaign,
          product_count: count || 0
        };
      }));

      setCampaigns(campaignsWithCount);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
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
        .insert({ 
          name: newClientName, 
          slug,
          webhook_url: newClientWebhook || null
        });

      if (error) throw error;

      toast({
        title: "Cliente criado!",
        description: "Novo cliente adicionado com sucesso"
      });

      setNewClientName("");
      setNewClientWebhook("");
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

  const updateClient = async () => {
    if (!newClientName.trim() || !editingClient) return;

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
        .update({ 
          name: newClientName,
          slug,
          webhook_url: newClientWebhook || null
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado!",
        description: "Cliente foi editado com sucesso"
      });

      setNewClientName("");
      setNewClientWebhook("");
      setEditingClient(null);
      setShowEditClientDialog(false);
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive"
      });
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim() || !selectedClient) return;

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
          name: newCampaignName, 
          slug: `${selectedClient.slug}-${slug}`,
          client_id: selectedClient.id 
        });

      if (error) throw error;

      toast({
        title: "Campanha criada!",
        description: "Nova campanha adicionada com sucesso"
      });

      setNewCampaignName("");
      setShowNewCampaignDialog(false);
      loadCampaigns(selectedClient.id);
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

  const updateCampaign = async () => {
    if (!newCampaignName.trim() || !editingCampaign || !selectedClient) return;

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
        .update({ 
          name: newCampaignName, 
          slug: `${selectedClient.slug}-${slug}`
        })
        .eq('id', editingCampaign.id);

      if (error) throw error;

      toast({
        title: "Campanha atualizada!",
        description: "Campanha foi editada com sucesso"
      });

      setNewCampaignName("");
      setEditingCampaign(null);
      setShowEditCampaignDialog(false);
      loadCampaigns(selectedClient.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a campanha",
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
        description: "Cliente e todas as campanhas foram excluídos"
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

      if (selectedClient) {
        loadCampaigns(selectedClient.id);
      }
    } catch (error) {
      console.error('Erro ao deletar campanha:', error);
    }
  };

  const viewClientCampaigns = async (client: Client) => {
    setSelectedClient(client);
    await loadCampaigns(client.id);
    setCurrentView('campaigns');
  };

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setNewCampaignName(campaign.name);
    setShowEditCampaignDialog(true);
  };

  const editClient = (client: Client) => {
    setEditingClient(client);
    setNewClientName(client.name);
    setNewClientWebhook(client.webhook_url || "");
    setShowEditClientDialog(true);
  };

  const copyCampaignLink = (slug: string) => {
    const link = `${window.location.origin}/campanha/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link da campanha copiado para a área de transferência"
    });
  };

  // Filtrar baseado na pesquisa
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="flex items-center gap-4">
            {currentView === 'campaigns' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentView('clients');
                  setSelectedClient(null);
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentView === 'clients' ? 'Painel Administrativo' : `Campanhas - ${selectedClient?.name}`}
              </h1>
              <p className="text-muted-foreground">
                {currentView === 'clients' ? 'Gerencie clientes e campanhas' : 'Gerencie campanhas do cliente'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentView === 'clients' ? (
              <Button onClick={() => setShowNewClientDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            ) : (
              <Button onClick={() => setShowNewCampaignDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            )}
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
            placeholder={currentView === 'clients' ? "Pesquisar cliente..." : "Pesquisar campanha..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentView === 'clients' ? (
            // Clients View
            filteredClients.map((client) => (
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
                      onClick={() => viewClientCampaigns(client)}
                      className="justify-start"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Campanhas
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editClient(client)}
                      className="justify-start"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Cliente
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
            ))
          ) : (
            // Campaigns View
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      {campaign.product_count || 0} fotos
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCampaignLink(campaign.slug)}
                      className="justify-start"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/campanha/${campaign.slug}`, '_blank')}
                      className="justify-start"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Campanha
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editCampaign(campaign)}
                      className="justify-start"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Nome
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Campanha
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
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
            <Input
              placeholder="URL do Webhook N8N (opcional)"
              value={newClientWebhook}
              onChange={(e) => setNewClientWebhook(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createClient()}
            />
            <div className="text-xs text-muted-foreground">
              O webhook será usado para enviar produtos para grupos de oferta
            </div>
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

      {/* Edit Client Dialog */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome do cliente"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateClient()}
            />
            <Input
              placeholder="URL do Webhook N8N (opcional)"
              value={newClientWebhook}
              onChange={(e) => setNewClientWebhook(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateClient()}
            />
            <div className="text-xs text-muted-foreground">
              O webhook será usado para enviar produtos para grupos de oferta
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditClientDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={updateClient}>
                Atualizar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da campanha"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCampaign()}
            />
            <div className="text-sm text-muted-foreground">
              Link: /campanha/{selectedClient?.slug}-{newCampaignName.toLowerCase().replace(/\s+/g, '-')}
            </div>
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

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditCampaignDialog} onOpenChange={setShowEditCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da campanha"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateCampaign()}
            />
            <div className="text-sm text-muted-foreground">
              Link: /campanha/{selectedClient?.slug}-{newCampaignName.toLowerCase().replace(/\s+/g, '-')}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditCampaignDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={updateCampaign}>
                Atualizar Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;