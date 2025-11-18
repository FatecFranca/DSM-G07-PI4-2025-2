import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, Calendar, Zap, DollarSign, Trash2, Edit } from "lucide-react";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    month_year: "",
    company_consumption_kwh: "",
    real_consumption_kwh: "",
    amount_paid: "",
    price_per_kwh: "",
    device_id: "",
  });
  const [editingId, setEditingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, devicesData] = await Promise.all([
        api.getBills(),
        api.getDevices()
      ]);
      setBills(billsData || []);
      setDevices((devicesData || []).map(d => ({ id: String(d.id), name: d.name })));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that the selected device belongs to the user's devices list
      const deviceExists = devices.find(d => String(d.id) === String(formData.device_id));
      if (!deviceExists) throw new Error('O dispositivo selecionado não pertence ao usuário');

      const payload = {
        device_id: formData.device_id,
        month_year: formData.month_year,
        company_consumption_kwh: parseFloat(formData.company_consumption_kwh),
        real_consumption_kwh: formData.real_consumption_kwh ? parseFloat(formData.real_consumption_kwh) : null,
        amount_paid: parseFloat(formData.amount_paid),
        price_per_kwh: parseFloat(formData.price_per_kwh),
      };

      if (editingId) {
        await api.updateBill(editingId, payload);
        toast({ title: "Sucesso", description: "Fatura atualizada com sucesso!" });
        setEditingId(null);
      } else {
        await api.createBill(payload);
        toast({ title: "Sucesso", description: "Fatura cadastrada com sucesso!" });
      }

      setFormData({
        month_year: "",
        company_consumption_kwh: "",
        real_consumption_kwh: "",
        amount_paid: "",
        price_per_kwh: "",
        device_id: "",
      });
      setIsOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cadastrar fatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

const handleEdit = (bill) => {
  setFormData({
    month_year: bill.month_year || '',
    company_consumption_kwh: bill.company_consumption_kwh || '',
    real_consumption_kwh: bill.real_consumption_kwh || '',
    amount_paid: bill.amount_paid || '',
    price_per_kwh: bill.price_per_kwh || '',
    device_id: String(bill.device_id) || '',
  });
  setEditingId(bill.id);
  setIsOpen(true);
};

  const handleDelete = async (id) => {
    try {
      await api.deleteBill(id);
      toast({
        title: "Sucesso",
        description: "Fatura excluída com sucesso!",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir fatura",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (bill) => {
    if (!bill.real_consumption_kwh) {
      return <Badge variant="secondary">Aguardando medição</Badge>;
    }

    const realValue = bill.real_consumption_kwh * bill.price_per_kwh;
    const paidValue = bill.amount_paid;
    const diff = Math.abs(realValue - paidValue) / paidValue;

    if (diff <= 0.05) {
      return <Badge className="bg-energy-ok text-white">Correto ✅</Badge>;
    } else if (paidValue > realValue) {
      return <Badge className="bg-energy-danger text-white">Pagando a mais ⚠️</Badge>;
    } else {
      return <Badge className="bg-energy-warning text-white">Pagando a menos ❌</Badge>;
    }// danger --vermelho warning---amarelo
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Faturas de Energia</h1>
          <p className="text-muted-foreground">
            Gerencie suas faturas e compare com o consumo real
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button disabled={devices.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Fatura</DialogTitle>
              <DialogDescription>
                Adicione uma nova fatura de energia elétrica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="device_id">Dispositivo</Label>
                  <Select
                    value={formData.device_id}
                    onValueChange={(value) => setFormData({ ...formData, device_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um dispositivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={String(device.id)}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month_year">Mês/Ano</Label>
                  <Input
                    id="month_year"
                    type="month"
                    value={formData.month_year}
                    onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_consumption_kwh">Consumo Informado (kWh)</Label>
                  <Input
                    id="company_consumption_kwh"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.50"
                    value={formData.company_consumption_kwh}
                    onChange={(e) => setFormData({ ...formData, company_consumption_kwh: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="real_consumption_kwh">Consumo Real (kWh) - Opcional</Label>
                  <Input
                    id="real_consumption_kwh"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 145.30"
                    value={formData.real_consumption_kwh}
                    onChange={(e) => setFormData({ ...formData, real_consumption_kwh: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Valor Pago (R$)</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 85.50"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_kwh">Preço por kWh (R$)</Label>
                  <Input
                    id="price_per_kwh"
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 0.5680"
                    value={formData.price_per_kwh}
                    onChange={(e) => setFormData({ ...formData, price_per_kwh: e.target.value })}
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
            <h3 className="text-lg font-semibold mb-2">Cadastre um dispositivo primeiro</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você precisa ter pelo menos um dispositivo cadastrado para adicionar faturas
            </p>
          </CardContent>
        </Card>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fatura cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando sua primeira fatura de energia
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fatura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Faturas</CardTitle>
            <CardDescription>
              Histórico de faturas cadastradas e comparação com consumo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Consumo Informado</TableHead>
                  <TableHead>Consumo Real</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(bill.month_year + "-01").toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric"
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{bill.device?.name || 'N/A'}</TableCell>
                    <TableCell>{bill.company_consumption_kwh} kWh</TableCell>
                    <TableCell>
                      {bill.real_consumption_kwh ? `${bill.real_consumption_kwh} kWh` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {bill.amount_paid.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bill)}</TableCell>
<TableCell className="flex gap-2">

  {/* Botão de Editar */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleEdit(bill)}
    className="text-blue-500 hover:text-blue-600"
  >
    <Edit className="h-4 w-4" />
  </Button>

  {/* Botão de Deletar */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleDelete(bill.id)}
    className="text-destructive hover:text-destructive"
  >
    <Trash2 className="h-4 w-4" />
  </Button>

</TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
