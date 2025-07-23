import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Download, Trash2, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductCard from "./ProductCard";
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

interface ProductGridProps {
  products: ProductData[];
  onDeleteProduct: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
  onEditProduct?: (product: ProductData) => void;
}

const ProductGrid = ({ products, onDeleteProduct, onClearAll, onExport, onEditProduct }: ProductGridProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProduct = (productId: string) => {
    onDeleteProduct(productId);
    toast({
      title: "Produto removido",
      description: "O produto foi excluído da lista"
    });
  };

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => {
    try {
      const price = product.preco_oferta || product.preco_regular;
      const value = parseFloat(price.replace(/[R$\s.]/g, '').replace(',', '.'));
      return sum + (isNaN(value) ? 0 : value);
    } catch {
      return sum;
    }
  }, 0);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhum produto cadastrado
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Use a câmera para capturar e cadastrar seus primeiros produtos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header with Search and Stats */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>

        {/* Stats */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalProducts}</p>
              <p className="text-sm text-muted-foreground">Produtos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {totalValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onExport}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={onClearAll}
            variant="outline"
            className="border-destructive/30 hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ProductCard
              product={product}
              onDelete={() => handleDeleteProduct(product.id)}
              onEdit={onEditProduct ? () => onEditProduct(product) : undefined}
              onView={() => {
                // TODO: Implementar modal de visualização
                toast({
                  title: "Visualizar produto",
                  description: "Funcionalidade em desenvolvimento"
                });
              }}
            />
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum produto encontrado para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;