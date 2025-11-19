import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function FaturasScreen() {
  const [faturas, setFaturas] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [consumoInformado, setConsumoInformado] = useState("");
  const [consumoReal, setConsumoReal] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // busca usuário atual
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  };

  // carregar dispositivos do usuário
  const carregarDispositivos = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setDispositivos([]);
        return;
      }
      const { data, error } = await supabase
        .from("dispositivos")
        .select("id, nome")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar dispositivos:", error);
        return;
      }
      setDispositivos(data || []);
      if ((data || []).length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // carregar faturas do usuário
  const carregarFaturas = async () => {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) {
        setFaturas([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("faturas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar faturas:", error);
        setFaturas([]);
      } else {
        setFaturas(data || []);
      }
    } catch (err) {
      console.error(err);
      setFaturas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await carregarDispositivos();
      await carregarFaturas();
    })();
  }, []);

  // criar fatura
  const criarFatura = async () => {
    if (!periodo.trim() || !consumoInformado.trim() || !selectedDeviceId) {
      Alert.alert("Erro", "Preencha período, consumo informado e selecione um dispositivo.");
      return;
    }

    const consumoInformadoNum = parseFloat(consumoInformado.replace(",", "."));
    const consumoRealNum = consumoReal ? parseFloat(consumoReal.replace(",", ".")) : null;
    const valorPagoNum = valorPago ? parseFloat(valorPago.replace(",", ".")) : null;

    if (Number.isNaN(consumoInformadoNum)) {
      Alert.alert("Erro", "Consumo informado inválido.");
      return;
    }

    setSaving(true);
    try {
      const user = await getUser();
      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        setSaving(false);
        return;
      }

      const payload = {
        user_id: user.id,
        dispositivo_id: selectedDeviceId,
        periodo: periodo.trim(),
        consumo_informado: consumoInformadoNum,
        consumo_real: consumoRealNum,
        valor_pago: valorPagoNum,
        status: "pendente", // padrão: pendente
      };

      console.log("Inserindo fatura com payload:", payload);

      const { data, error } = await supabase
        .from("faturas")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Erro ao inserir fatura:", error);
        Alert.alert("Erro", error.message || "Não foi possível cadastrar fatura.");
        setSaving(false);
        return;
      }

      console.log("Fatura inserida com sucesso:", data);

      // Sucesso
      Alert.alert("Sucesso!", "Fatura cadastrada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setModalVisible(false);
            setPeriodo("");
            setConsumoInformado("");
            setConsumoReal("");
            setValorPago("");
            carregarFaturas(); // recarrega a lista
          },
        },
      ]);
    } catch (err) {
      console.error("Erro catch:", err);
      Alert.alert("Erro", "Falha ao cadastrar fatura.");
    } finally {
      setSaving(false);
    }
  };

  // atualizar status da fatura
  const atualizarStatus = async (id, novoStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("faturas")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) {
        Alert.alert("Erro", error.message || "Falha ao atualizar status.");
        setUpdating(false);
        return;
      }

      Alert.alert("Sucesso", `Fatura marcada como ${novoStatus}`, [
        {
          text: "OK",
          onPress: () => {
            carregarFaturas(); // recarrega a lista
          },
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao atualizar status.");
    } finally {
      setUpdating(false);
    }
  };

  const deletarFatura = async (id) => {
    Alert.alert("Confirmar", "Deseja excluir esta fatura?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("faturas").delete().eq("id", id);
          if (error) {
            Alert.alert("Erro", error.message || "Falha ao deletar.");
          } else {
            Alert.alert("Sucesso", "Fatura deletada.");
            carregarFaturas(); // recarrega a lista
          }
        },
      },
    ]);
  };

  const dispositivoNome = (dispositivo_id) => {
    const d = dispositivos.find((x) => x.id === dispositivo_id);
    return d ? d.nome : dispositivo_id;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pendente":
        return "#FFA500";
      case "paga":
        return "#22C55E";
      case "vencida":
        return "#E53935";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pendente":
        return "⏳ Pendente";
      case "paga":
        return "✅ Paga";
      case "vencida":
        return "❌ Vencida";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faturas</Text>

      <TouchableOpacity style={styles.btn} onPress={() => setModalVisible(true)}>
        <Text style={styles.btnText}>+ Nova Fatura</Text>
      </TouchableOpacity>

      {faturas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma fatura encontrada.</Text>
      ) : (
        <FlatList
          data={faturas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.periodo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              <Text style={styles.cardText}>Dispositivo: {dispositivoNome(item.dispositivo_id)}</Text>
              <Text style={styles.cardText}>Consumo informado: {item.consumo_informado ?? "-"} kWh</Text>
              {item.consumo_real && <Text style={styles.cardText}>Consumo real: {item.consumo_real} kWh</Text>}
              <Text style={styles.cardText}>Valor pago: R$ {item.valor_pago ?? "-"}</Text>

              {/* Botões de status */}
              <View style={styles.statusButtonsContainer}>
                <TouchableOpacity
                  style={[styles.statusButton, item.status === "pendente" && styles.statusButtonActive]}
                  onPress={() => atualizarStatus(item.id, "pendente")}
                  disabled={updating}
                >
                  <Text style={[styles.statusButtonText, item.status === "pendente" && styles.statusButtonTextActive]}>
                    Pendente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusButton, item.status === "paga" && styles.statusButtonActive]}
                  onPress={() => atualizarStatus(item.id, "paga")}
                  disabled={updating}
                >
                  <Text style={[styles.statusButtonText, item.status === "paga" && styles.statusButtonTextActive]}>
                    Paga
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusButton, item.status === "vencida" && styles.statusButtonActive]}
                  onPress={() => atualizarStatus(item.id, "vencida")}
                  disabled={updating}
                >
                  <Text style={[styles.statusButtonText, item.status === "vencida" && styles.statusButtonTextActive]}>
                    Vencida
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => deletarFatura(item.id)}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Deletar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Nova Fatura</Text>

          <TextInput
            placeholder="Período (ex: 2025-11)"
            value={periodo}
            onChangeText={setPeriodo}
            style={styles.input}
            editable={!saving}
          />
          <TextInput
            placeholder="Consumo informado (kWh)"
            value={consumoInformado}
            onChangeText={setConsumoInformado}
            keyboardType="decimal-pad"
            style={styles.input}
            editable={!saving}
          />
          <TextInput
            placeholder="Consumo real (kWh) - opcional"
            value={consumoReal}
            onChangeText={setConsumoReal}
            keyboardType="decimal-pad"
            style={styles.input}
            editable={!saving}
          />
          <TextInput
            placeholder="Valor pago (R$) - opcional"
            value={valorPago}
            onChangeText={setValorPago}
            keyboardType="decimal-pad"
            style={styles.input}
            editable={!saving}
          />

          <View style={styles.pickerWrap}>
            <Text style={styles.pickerLabel}>Dispositivo</Text>
            {dispositivos.length === 0 ? (
              <Text style={{ color: "#6b7280" }}>Nenhum dispositivo cadastrado</Text>
            ) : (
              <View style={styles.deviceSelect}>
                {dispositivos.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.deviceOption, selectedDeviceId === d.id && styles.deviceOptionSelected]}
                    onPress={() => setSelectedDeviceId(d.id)}
                  >
                    <Text style={[styles.deviceOptionText, selectedDeviceId === d.id && styles.deviceOptionTextSelected]}>
                      {d.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={criarFatura} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Salvar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f6fb" },
  container: { flex: 1, padding: 20, backgroundColor: "#f3f6fb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#111827" },
  btn: { backgroundColor: "#3A82F7", padding: 12, borderRadius: 8, marginBottom: 20 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20, fontSize: 16 },
  card: { padding: 15, backgroundColor: "#fff", marginBottom: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#3A82F7" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  cardText: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  statusButtonsContainer: { flexDirection: "row", marginVertical: 12, gap: 8 },
  statusButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: "#e5e7eb", borderWidth: 1, borderColor: "#d1d5db", alignItems: "center" },
  statusButtonActive: { backgroundColor: "#3A82F7", borderColor: "#3A82F7" },
  statusButtonText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  statusButtonTextActive: { color: "#fff" },
  deleteBtn: { backgroundColor: "#E53935", padding: 10, borderRadius: 6, alignItems: "center", marginTop: 10 },
  modalContainer: { flex: 1, padding: 20, marginTop: 50, backgroundColor: "#f3f6fb" },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: "#d1d5db" },
  cancelBtn: { marginTop: 15, padding: 12, alignItems: "center" },
  cancelText: { color: "#E53935", fontWeight: "bold" },
  pickerWrap: { marginBottom: 15 },
  pickerLabel: { marginBottom: 8, color: "#374151", fontWeight: "600" },
  deviceSelect: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deviceOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#e5e7eb", borderWidth: 2, borderColor: "#d1d5db" },
  deviceOptionSelected: { backgroundColor: "#3A82F7", borderColor: "#3A82F7" },
  deviceOptionText: { color: "#374151", fontWeight: "600" },
  deviceOptionTextSelected: { color: "#fff" },
});
