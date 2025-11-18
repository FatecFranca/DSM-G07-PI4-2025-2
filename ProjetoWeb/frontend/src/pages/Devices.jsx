import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, MapPin, Hash, Trash2, Edit } from "lucide-react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    identification_code: "",
    property_address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dispositivos",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await api.updateDevice(editingId, formData);
        toast({ title: "Sucesso", description: "Dispositivo atualizado com sucesso!" });
        setEditingId(null);
      } else {
        await api.createDevice(formData);
        toast({ title: "Sucesso", description: "Dispositivo cadastrado com sucesso!" });
      }
      setFormData({ name: "", identification_code: "", property_address: "" });
      setIsOpen(false);
      loadDevices();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cadastrar dispositivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device) => {
    setFormData({ name: device.name || '', identification_code: device.identification_code || '', property_address: device.property_address || '' });
    setEditingId(device.id);
    setIsOpen(true);
  };

    const handleDelete = async (id) => {
    try {
      await api.deleteDevice(id);
      toast({
        title: "Sucesso",
        description: "Dispositivo excluído com sucesso!",
      });
      loadDevices();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir dispositivo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dispositivos</h1>
          <p className="text-muted-foreground">
            Gerencie seus relógios de energia IoT
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Dispositivo</DialogTitle>
              <DialogDescription>
                Adicione um novo relógio de energia para monitoramento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Dispositivo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Relógio Casa Principal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identification_code">Código de Identificação</Label>
                  <Input
                    id="identification_code"
                    placeholder="Ex: REL001"
                    value={formData.identification_code}
                    onChange={(e) => setFormData({ ...formData, identification_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_address">Endereço do Imóvel</Label>
                  <Input
                    id="property_address"
                    placeholder="Ex: Rua das Flores, 123, São Paulo - SP"
                    value={formData.property_address}
                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dispositivo cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando seu primeiro relógio de energia
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dispositivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(device)}
                    className="hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(device.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="mb-2">
                    <Hash className="h-3 w-3 mr-1" />
                    {device.identification_code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{device.property_address}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
