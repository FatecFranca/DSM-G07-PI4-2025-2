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
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardData, analyticsData] = await Promise.all([
        api.getDashboard(),
        api.getDashboardAnalytics()
      ]);
      setBills(dashboardData.bills || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
      // Garantir que os estados estão definidos mesmo em caso de erro
      setBills([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const billsWithIotData = bills.filter(bill => 
    bill && 
    bill.consumo_iot !== null && 
    bill.consumo_iot !== undefined &&
    bill.price_per_kwh !== null &&
    bill.price_per_kwh !== undefined &&
    bill.amount_paid !== null &&
    bill.amount_paid !== undefined
  );

  // Calculate summary statistics
  const totalSavings = billsWithIotData.reduce((acc, bill) => {
    try {
      const iotValue = (bill.consumo_iot || 0) * (bill.price_per_kwh || 0);
      const paidValue = bill.amount_paid || 0;
      return acc + (paidValue - iotValue);
    } catch (e) {
      return acc;
    }
  }, 0);

  const accurateBills = billsWithIotData.filter(bill => {
    try {
      const iotValue = (bill.consumo_iot || 0) * (bill.price_per_kwh || 0);
      const paidValue = bill.amount_paid || 0;
      if (paidValue === 0) return false;
      const diff = Math.abs(iotValue - paidValue) / paidValue;
      return diff <= 0.05;
    } catch (e) {
      return false;
    }
  });

  const overpaidBills = billsWithIotData.filter(bill => {
    try {
      const iotValue = (bill.consumo_iot || 0) * (bill.price_per_kwh || 0);
      const paidValue = bill.amount_paid || 0;
      return paidValue > iotValue * 1.05;
    } catch (e) {
      return false;
    }
  });

  // Prepare chart data
  const chartLabels = billsWithIotData.map(bill => {
    try {
      if (!bill.month_year) return '';
      return new Date(bill.month_year + "-01").toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit"
      });
    } catch (e) {
      return '';
    }
  }).filter(label => label !== '');

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Consumo Informado (kWh)',
        data: billsWithIotData.map(bill => bill.company_consumption_kwh || 0),
        backgroundColor: 'hsl(210, 100%, 40%)',
        borderColor: 'hsl(210, 100%, 35%)',
        borderWidth: 1,
      },
      {
        label: 'Consumo IoT (kWh)',
        data: billsWithIotData.map(bill => bill.consumo_iot || 0),
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
        data: billsWithIotData.map(bill => bill.company_consumption_kwh || 0),
        borderColor: 'hsl(210, 100%, 40%)',
        backgroundColor: 'hsl(210, 100%, 95%)',
        tension: 0.4,
      },
      {
        label: 'Consumo IoT',
        data: billsWithIotData.map(bill => bill.consumo_iot || 0),
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
          billsWithIotData.length - accurateBills.length - overpaidBills.length,
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
    if (billsWithIotData.length === 0) {
      return {
        icon: <Zap className="h-6 w-6" />,
        message: "Adicione dados de consumo IoT para análise",
        variant: "secondary",
      };
    }

    const accuracyRate = billsWithIotData.length > 0 ? accurateBills.length / billsWithIotData.length : 0;
    
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
              {billsWithIotData.length > 0 && (
                <p className="text-sm opacity-90">
                  Baseado em {billsWithIotData.length} fatura(s) com dados IoT
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
              {billsWithIotData.length} com consumo IoT
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
              de {billsWithIotData.length} analisadas
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
      {billsWithIotData.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Consumo: IoT vs Informado</CardTitle>
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

        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dados insuficientes para gráficos</h3>
            <p className="text-muted-foreground text-center">
              Adicione faturas com consumo IoT para visualizar os gráficos de comparação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analytics Estatísticos */}
      {analytics && analytics.media && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Média Geral de Faturas</CardTitle>
                <CardDescription>Baseado em consumo IoT</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics.media?.geral || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Desvio padrão: {(analytics.desvio_padrao || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição Normal</CardTitle>
                <CardDescription>Média e desvio padrão</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Média (μ): </span>
                    <span className="font-semibold">
                      {(analytics.distribuicao_normal?.media || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Desvio (σ): </span>
                    <span className="font-semibold">
                      {(analytics.distribuicao_normal?.desvio || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Correlações</CardTitle>
                <CardDescription>Medidas de associação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Est. vs IoT: </span>
                    <span className="font-semibold">
                      {(analytics.correlacao?.consumo_estimado_iot || 0).toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">IoT vs Valor: </span>
                    <span className="font-semibold">
                      {(analytics.correlacao?.iot_valor || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regressão Linear</CardTitle>
                <CardDescription>IoT vs Valor Pago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Coeficiente (a): </span>
                    <span className="font-semibold">{(analytics.regressao?.a || 0).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intercepto (b): </span>
                    <span className="font-semibold">{(analytics.regressao?.b || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">R²: </span>
                    <span className="font-semibold">{((analytics.regressao?.r2 || 0) * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Média por Dispositivo</CardTitle>
                <CardDescription>Valor médio das faturas por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.media?.por_dispositivo && analytics.media.por_dispositivo.length > 0 ? (
                    analytics.media.por_dispositivo.map((device) => (
                      <div key={device.device_id} className="flex justify-between items-center p-2 border rounded">
                        <span className="font-medium">{device.device_name || 'Desconhecido'}</span>
                        <span className="text-primary font-bold">
                          {(device.media || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Percentuais por Dispositivo */}
          {analytics.percentual && Array.isArray(analytics.percentual) && analytics.percentual.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
                <CardDescription>Percentual de consumo IoT por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.percentual.map((item) => (
                    <div key={item.device_id || Math.random()}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{item.device_name || 'Desconhecido'}</span>
                        <span className="text-sm text-muted-foreground">
                          {(item.percentual || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${item.percentual || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: {(item.total_consumo || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} kWh
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

