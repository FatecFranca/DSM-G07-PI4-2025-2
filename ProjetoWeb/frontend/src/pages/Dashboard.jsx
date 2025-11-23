import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Zap, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  // Estados para estatísticas
  const [mediaGeral, setMediaGeral] = useState(0);
  const [desvioPadrao, setDesvioPadrao] = useState(0);
  const [probabilidadeProximoMes, setProbabilidadeProximoMes] = useState(0);
  const [probMin, setProbMin] = useState("");
  const [probMax, setProbMax] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedPieIndex, setSelectedPieIndex] = useState(null);

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
      
      // Carregar estatísticas (média geral e desvio padrão)
      loadStatistics();
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

  /**
   * Carrega as estatísticas (média geral e desvio padrão)
   */
  const loadStatistics = async () => {
    try {
      const [mediaData, desvioData] = await Promise.all([
        api.getMediaGeral(),
        api.getDesvioPadrao()
      ]);
      setMediaGeral(mediaData?.mediaGeral || 0);
      setDesvioPadrao(desvioData?.desvioPadrao || 0);
    } catch (error) {
      // Silenciar erro - não é crítico
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  /**
   * Calcula a probabilidade da próxima fatura estar entre min e max
   */
  const calcularProbabilidade = async () => {
    if (!probMin || !probMax) {
      toast({
        title: "Erro",
        description: "Preencha os valores mínimo e máximo",
        variant: "destructive",
      });
      return;
    }

    const min = parseFloat(probMin);
    const max = parseFloat(probMax);

    if (isNaN(min) || isNaN(max)) {
      toast({
        title: "Erro",
        description: "Os valores devem ser números válidos",
        variant: "destructive",
      });
      return;
    }

    if (min >= max) {
      toast({
        title: "Erro",
        description: "O valor mínimo deve ser menor que o máximo",
        variant: "destructive",
      });
      return;
    }

    setLoadingStats(true);
    try {
      const data = await api.getProbabilidadeProximoMes(min, max);
      setProbabilidadeProximoMes(data?.probabilidadeProximoMes || 0);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao calcular probabilidade",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
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
      // Pagando a mais quando o valor pago é maior que o valor calculado pelo IoT
      return paidValue > iotValue;
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
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Plugin customizado para labels no gráfico de pizza
  const pieChartPlugin = {
    id: 'pieChartLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      if (!dataset || !dataset.data) return;
      
      const total = dataset.data.reduce((a, b) => a + b, 0);
      if (total === 0) return;
      
      chart.getDatasetMeta(0).data.forEach((element, index) => {
        // Não mostrar porcentagem se este índice estiver selecionado
        if (selectedPieIndex === index) return;
        
        const value = dataset.data[index];
        const percentage = ((value / total) * 100).toFixed(1);
        
        // Obter posição do centro da fatia
        const { x, y } = element.tooltipPosition();
        
        // Desenhar texto apenas se a porcentagem for significativa (> 3%)
        if (parseFloat(percentage) > 3) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 3;
          ctx.fillText(`${percentage}%`, x, y);
          ctx.restore();
        }
      });
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        enabled: false
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        setSelectedPieIndex(selectedPieIndex === clickedIndex ? null : clickedIndex);
      } else {
        setSelectedPieIndex(null);
      }
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
              <Bar 
                data={barChartData} 
                options={chartOptions}
                plugins={[]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consumo</CardTitle>
              <CardDescription>
                Evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Line 
                data={lineChartData} 
                options={chartOptions}
                plugins={[]}
              />
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
      {analytics && (
        <>
          {/* Estatísticas (Média Geral, Desvio Padrão e Probabilidade) */}
          {bills.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {/* Card Média Geral */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mediaGeral.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média de todas as faturas
                  </p>
                </CardContent>
              </Card>

              {/* Card Desvio Padrão */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Desvio Padrão</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {desvioPadrao.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Variabilidade das faturas
                  </p>
                </CardContent>
              </Card>

              {/* Card Probabilidade Próximo Mês */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Probabilidade Próximo Mês</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Min"
                        value={probMin}
                        onChange={(e) => setProbMin(e.target.value)}
                        className="flex-1 text-sm h-9"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Max"
                        value={probMax}
                        onChange={(e) => setProbMax(e.target.value)}
                        className="flex-1 text-sm h-9"
                      />
                    </div>
                    <Button
                      onClick={calcularProbabilidade}
                      disabled={loadingStats}
                      className="w-full"
                      size="sm"
                    >
                      {loadingStats ? "Calculando..." : "Calcular"}
                    </Button>
                    {probabilidadeProximoMes > 0 && (
                      <div className="text-2xl font-bold text-center pt-3 pb-1">
                        {probabilidadeProximoMes.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                      {(analytics?.distribuicao_normal?.media || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Desvio (σ): </span>
                    <span className="font-semibold">
                      {(analytics?.distribuicao_normal?.desvio || 0).toLocaleString("pt-BR", {
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
                      {(analytics?.correlacao?.consumo_estimado_iot || 0).toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">IoT vs Valor: </span>
                    <span className="font-semibold">
                      {(analytics?.correlacao?.iot_valor || 0).toFixed(3)}
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
                    <span className="font-semibold">{(analytics?.regressao?.a || 0).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intercepto (b): </span>
                    <span className="font-semibold">{(analytics?.regressao?.b || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">R²: </span>
                    <span className="font-semibold">{((analytics?.regressao?.r2 || 0) * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 lg:col-span-3">
              <CardHeader>
                <CardTitle>Média por Dispositivo</CardTitle>
                <CardDescription>Valor médio das faturas por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.media?.por_dispositivo && analytics.media.por_dispositivo.length > 0 ? (
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

          {/* Distribuição por Dispositivo - Gráfico de Pizza */}
          {analytics?.distribuicao_dispositivos && Array.isArray(analytics.distribuicao_dispositivos) && analytics.distribuicao_dispositivos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
                <CardDescription>Percentual de consumo IoT por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <Pie 
                    data={{
                      labels: analytics.distribuicao_dispositivos.map(item => item.device || 'Desconhecido'),
                      datasets: [
                        {
                          data: analytics.distribuicao_dispositivos.map(item => item.percentual || 0),
                          backgroundColor: [
                            'hsl(210, 100%, 40%)',
                            'hsl(142, 69%, 45%)',
                            'hsl(45, 100%, 60%)',
                            'hsl(0, 70%, 50%)',
                            'hsl(270, 70%, 50%)',
                            'hsl(180, 70%, 50%)',
                          ],
                          borderColor: [
                            'hsl(210, 100%, 35%)',
                            'hsl(142, 69%, 40%)',
                            'hsl(45, 100%, 55%)',
                            'hsl(0, 70%, 45%)',
                            'hsl(270, 70%, 45%)',
                            'hsl(180, 70%, 45%)',
                          ],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={pieOptions}
                    plugins={[pieChartPlugin]}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {analytics.distribuicao_dispositivos.map((item, index) => (
                    
                      <div className="flex items-center gap-2">
                        <div 
                          
                          style={{
                            backgroundColor: [
                              'hsl(210, 100%, 40%)',
                              'hsl(142, 69%, 45%)',
                              'hsl(45, 100%, 60%)',
                              'hsl(0, 70%, 50%)',
                              'hsl(270, 70%, 50%)',
                              'hsl(180, 70%, 50%)',
                            ][index % 6]
                          }}
                        />
                      
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

