import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Zap } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await api.getDashboard();
      setBills(data.bills);
    } catch (error) {
      /*toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });*/
    } finally {
      setLoading(false);
    }
  };

  const billsWithRealData = bills.filter(bill => bill.real_consumption_kwh !== null);

  // Calculate summary statistics
  const totalSavings = billsWithRealData.reduce((acc, bill) => {
    const realValue = bill.real_consumption_kwh * bill.price_per_kwh;
    const paidValue = bill.amount_paid;
    return acc + (paidValue - realValue);
  }, 0);

  const accurateBills = billsWithRealData.filter(bill => {
    const realValue = bill.real_consumption_kwh * bill.price_per_kwh;
    const paidValue = bill.amount_paid;
    const diff = Math.abs(realValue - paidValue) / paidValue;
    return diff <= 0.05;
  });

  const overpaidBills = billsWithRealData.filter(bill => {
    const realValue = bill.real_consumption_kwh * bill.price_per_kwh;
    const paidValue = bill.amount_paid;
    return paidValue > realValue * 1.05;
  });

  // Prepare chart data
  const chartLabels = billsWithRealData.map(bill => 
    new Date(bill.month_year + "-01").toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit"
    })
  );

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Consumo Informado (kWh)',
        data: billsWithRealData.map(bill => bill.company_consumption_kwh),
        backgroundColor: 'hsl(210, 100%, 40%)',
        borderColor: 'hsl(210, 100%, 35%)',
        borderWidth: 1,
      },
      {
        label: 'Consumo Real (kWh)',
        data: billsWithRealData.map(bill => bill.real_consumption_kwh),
        backgroundColor: 'hsl(142, 69%, 45%)',
        borderColor: 'hsl(142, 69%, 40%)',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Consumo Informado',
        data: billsWithRealData.map(bill => bill.company_consumption_kwh),
        borderColor: 'hsl(210, 100%, 40%)',
        backgroundColor: 'hsl(210, 100%, 95%)',
        tension: 0.4,
      },
      {
        label: 'Consumo Real',
        data: billsWithRealData.map(bill => bill.real_consumption_kwh),
        borderColor: 'hsl(142, 69%, 45%)',
        backgroundColor: 'hsl(142, 50%, 95%)',
        tension: 0.4,
      },
    ],
  };

  const pieChartData = {
    labels: ['Valor Correto', 'Pagando a Mais', 'Outros'],
    datasets: [
      {
        data: [
          accurateBills.length,
          overpaidBills.length,
          billsWithRealData.length - accurateBills.length - overpaidBills.length,
        ],
        backgroundColor: [
          'hsl(142, 69%, 45%)',
          'hsl(45, 100%, 60%)',
          'hsl(210, 16%, 46%)',
        ],
        borderColor: [
          'hsl(142, 69%, 40%)',
          'hsl(45, 100%, 55%)',
          'hsl(210, 16%, 41%)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getMainStatusMessage = () => {
    if (billsWithRealData.length === 0) {
      return {
        icon: <Zap className="h-6 w-6" />,
        message: "Adicione dados de consumo real para análise",
        variant: "secondary",
      };
    }

    const accuracyRate = accurateBills.length / billsWithRealData.length;
    
    if (accuracyRate >= 0.8) {
      return {
        icon: <CheckCircle2 className="h-6 w-6" />,
        message: "Você está pagando corretamente ✅",
        variant: "default",
        className: "bg-energy-ok text-white"
      };
    } else if (overpaidBills.length > accurateBills.length) {
      return {
        icon: <AlertTriangle className="h-6 w-6" />,
        message: "Atenção: você está pagando a mais ⚠️",
        variant: "destructive",
        className: "bg-energy-warning text-white"
      };
    } else {
      return {
        icon: <TrendingUp className="h-6 w-6" />,
        message: "Verifique suas contas com atenção",
        variant: "secondary",
      };
    }
  };

  const statusMessage = getMainStatusMessage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitoramento do seu consumo de energia elétrica
        </p>
      </div>

      {/* Status Principal */}
      <Card className={statusMessage.className || ""}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {statusMessage.icon}
            <div>
              <h2 className="text-2xl font-bold">{statusMessage.message}</h2>
              {billsWithRealData.length > 0 && (
                <p className="text-sm opacity-90">
                  Baseado em {billsWithRealData.length} fatura(s) com dados reais
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Faturas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bills.length}</div>
            <p className="text-xs text-muted-foreground">
              {billsWithRealData.length} com consumo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Diferença Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSavings > 0 ? 'text-energy-warning' : 'text-energy-ok'}`}>
              {totalSavings > 0 ? '+' : ''}{totalSavings.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSavings > 0 ? 'Pagou a mais' : 'Economia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contas Corretas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-energy-ok">
              {accurateBills.length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {billsWithRealData.length} analisadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagando a Mais
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-energy-warning">
              {overpaidBills.length}
            </div>
            <p className="text-xs text-muted-foreground">
              faturas com diferença
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {billsWithRealData.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Consumo: Real vs Informado</CardTitle>
              <CardDescription>
                Comparação mensal em kWh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={barChartData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendência de Consumo</CardTitle>
              <CardDescription>
                Evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Line data={lineChartData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição de Precisão</CardTitle>
              <CardDescription>
                Proporção de faturas por categoria de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-64 h-64">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dados insuficientes para gráficos</h3>
            <p className="text-muted-foreground text-center">
              Adicione faturas com consumo real medido para visualizar os gráficos de comparação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

