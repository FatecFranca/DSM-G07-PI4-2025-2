// src/pages/main.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { supabase } from "../lib/supabase";

const { width: screenWidth } = Dimensions.get("window");

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDispositivos: 0,
    dispositivosAtivos: 0,
    totalFaturas: 0,
    faturasAbertas: 0,
    consumoTotal: 0,
    valorTotal: 0,
  });
  const [chartData, setChartData] = useState({
    consumoPorMes: [],
    valorPorMes: [],
    statusFaturas: { pendente: 0, paga: 0, vencida: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) {
        setStats({
          totalDispositivos: 0,
          dispositivosAtivos: 0,
          totalFaturas: 0,
          faturasAbertas: 0,
          consumoTotal: 0,
          valorTotal: 0,
        });
        setLoading(false);
        return;
      }

      // buscar dispositivos
      const { data: dispositivos, error: errDisp } = await supabase
        .from("dispositivos")
        .select("id, status")
        .eq("user_id", user.id);

      // buscar faturas
      const { data: faturas, error: errFat } = await supabase
        .from("faturas")
        .select("id, status, consumo_informado, valor_pago, periodo")
        .eq("user_id", user.id)
        .order("periodo", { ascending: true });

      if (errDisp || errFat) {
        console.error("Erro ao carregar dados:", errDisp || errFat);
        setLoading(false);
        return;
      }

      // calcular métricas
      const totalDispositivos = (dispositivos || []).length;
      const dispositivosAtivos = (dispositivos || []).filter((d) => d.status === "ativo").length;

      const totalFaturas = (faturas || []).length;
      const faturasAbertas = (faturas || []).filter((f) => f.status === "pendente" || f.status === "aberta").length;

      const consumoTotal = (faturas || []).reduce((sum, f) => sum + (f.consumo_informado || 0), 0);
      const valorTotal = (faturas || []).reduce((sum, f) => sum + (f.valor_pago || 0), 0);

      // contar status
      const statusCount = {
        pendente: (faturas || []).filter((f) => f.status === "pendente").length,
        paga: (faturas || []).filter((f) => f.status === "paga").length,
        vencida: (faturas || []).filter((f) => f.status === "vencida").length,
      };

      // agrupar por período (mês) para gráficos
      const consumoPorPeriodo = {};
      const valorPorPeriodo = {};

      (faturas || []).forEach((f) => {
        const periodo = f.periodo || "Indefinido";
        consumoPorPeriodo[periodo] = (consumoPorPeriodo[periodo] || 0) + (f.consumo_informado || 0);
        valorPorPeriodo[periodo] = (valorPorPeriodo[periodo] || 0) + (f.valor_pago || 0);
      });

      const periodos = Object.keys(consumoPorPeriodo).slice(-6); // últimos 6 períodos
      const consumoData = periodos.map((p) => consumoPorPeriodo[p]);
      const valorData = periodos.map((p) => valorPorPeriodo[p]);

      setStats({
        totalDispositivos,
        dispositivosAtivos,
        totalFaturas,
        faturasAbertas,
        consumoTotal: consumoTotal.toFixed(2),
        valorTotal: valorTotal.toFixed(2),
      });

      setChartData({
        consumoPorMes: {
          labels: periodos.length > 0 ? periodos : ["--"],
          datasets: [{ data: consumoData.length > 0 ? consumoData : [0] }],
        },
        valorPorMes: {
          labels: periodos.length > 0 ? periodos : ["--"],
          datasets: [{ data: valorData.length > 0 ? valorData : [0] }],
        },
        statusFaturas: statusCount,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // dados para gráfico de pizza (status das faturas)
  const pieData = [
    {
      name: "Pendentes",
      population: chartData.statusFaturas.pendente,
      color: "#FFA500",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Pagas",
      population: chartData.statusFaturas.paga,
      color: "#22C55E",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Vencidas",
      population: chartData.statusFaturas.vencida,
      color: "#E53935",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Análise de dados em tempo real</Text>
      </View>

      {/* Cards de métricas principais */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, styles.metric1]}>
          <Text style={styles.metricValue}>{stats.totalDispositivos}</Text>
          <Text style={styles.metricLabel}>Dispositivos</Text>
          <Text style={styles.metricSub}>{stats.dispositivosAtivos} ativos</Text>
        </View>

        <View style={[styles.metricCard, styles.metric2]}>
          <Text style={styles.metricValue}>{stats.totalFaturas}</Text>
          <Text style={styles.metricLabel}>Faturas</Text>
          <Text style={styles.metricSub}>{stats.faturasAbertas} abertas</Text>
        </View>

        <View style={[styles.metricCard, styles.metric3]}>
          <Text style={styles.metricValue}>{stats.consumoTotal}</Text>
          <Text style={styles.metricLabel}>Consumo (kWh)</Text>
          <Text style={styles.metricSub}>Total acumulado</Text>
        </View>

        <View style={[styles.metricCard, styles.metric4]}>
          <Text style={styles.metricValue}>R$ {stats.valorTotal}</Text>
          <Text style={styles.metricLabel}>Valor Total</Text>
          <Text style={styles.metricSub}>Todas as faturas</Text>
        </View>
      </View>

      {/* Gráfico de Linha - Consumo por Período */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>📊 Consumo por Período (kWh)</Text>
        {chartData.consumoPorMes.datasets?.[0]?.data?.length > 0 ? (
          <LineChart
            data={chartData.consumoPorMes}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Sem dados para exibir</Text>
        )}
      </View>

      {/* Gráfico de Barras - Valor por Período */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>💰 Valor Gasto por Período (R$)</Text>
        {chartData.valorPorMes.datasets?.[0]?.data?.length > 0 ? (
          <BarChart
            data={chartData.valorPorMes}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Sem dados para exibir</Text>
        )}
      </View>

      {/* Gráfico de Pizza - Status das Faturas */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>🥧 Status das Faturas</Text>
        {pieData.some((d) => d.population > 0) ? (
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Sem dados para exibir</Text>
        )}
      </View>

      {/* Resumo textual */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>📋 Resumo Geral</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Taxa de Atividade:</Text>
          <Text style={styles.summaryValue}>
            {stats.totalDispositivos > 0
              ? ((stats.dispositivosAtivos / stats.totalDispositivos) * 100).toFixed(0)
              : 0}
            %
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Consumo Médio por Fatura:</Text>
          <Text style={styles.summaryValue}>
            {stats.totalFaturas > 0 ? (stats.consumoTotal / stats.totalFaturas).toFixed(2) : 0} kWh
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Valor Médio por Fatura:</Text>
          <Text style={styles.summaryValue}>
            R$ {stats.totalFaturas > 0 ? (stats.valorTotal / stats.totalFaturas).toFixed(2) : 0}
          </Text>
        </View>
      </View>

      {/* Info API */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Integração com API</Text>
        <Text style={styles.infoText}>
          Os dados exibidos aqui são obtidos do Supabase. Quando você implementar a integração com o ESP32, os dados serão atualizados automaticamente nesta dashboard.
        </Text>
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(58, 130, 247, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f6fb" },
  container: { flex: 1, backgroundColor: "#f3f6fb" },
  header: { padding: 20, paddingTop: 30 },
  title: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  metricsContainer: { paddingHorizontal: 20, marginBottom: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metricCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  metric1: { backgroundColor: "#DBEAFE", borderLeftWidth: 6, borderLeftColor: "#3B82F6" },
  metric2: { backgroundColor: "#DCFCE7", borderLeftWidth: 6, borderLeftColor: "#22C55E" },
  metric3: { backgroundColor: "#FEF3C7", borderLeftWidth: 6, borderLeftColor: "#FBBF24" },
  metric4: { backgroundColor: "#F5D4FC", borderLeftWidth: 6, borderLeftColor: "#D946EF" },
  metricValue: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  metricLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  metricSub: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  chartSection: { marginHorizontal: 20, marginBottom: 20, padding: 16, backgroundColor: "#fff", borderRadius: 12 },
  chartTitle: { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  chart: { borderRadius: 8 },
  noDataText: { textAlign: "center", color: "#6b7280", fontSize: 14, paddingVertical: 20 },
  summaryBox: { marginHorizontal: 20, padding: 16, backgroundColor: "#fff", borderRadius: 12, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryValue: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  infoBox: { marginHorizontal: 20, padding: 14, backgroundColor: "#EFF6FF", borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#3B82F6", marginBottom: 30 },
  infoTitle: { fontSize: 12, fontWeight: "bold", color: "#1E40AF", marginBottom: 6 },
  infoText: { fontSize: 12, color: "#1E40AF", lineHeight: 18 },
});