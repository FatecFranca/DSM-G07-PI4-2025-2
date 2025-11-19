import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

export default function DispositivosScreen() {
  const [dispositivos, setDispositivos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  };

  async function carregarDispositivos() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) {
        setDispositivos([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("dispositivos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        Alert.alert("Erro", error.message);
        setDispositivos([]);
      } else {
        setDispositivos(data || []);
      }
    } catch (err) {
      console.error(err);
      setDispositivos([]);
    } finally {
      setLoading(false);
    }
  }

  async function criarDispositivo() {
    if (!nome.trim() || !codigo.trim() || !endereco.trim()) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      const user = await getUser();
      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from("dispositivos").insert([
        {
          user_id: user.id,
          nome: nome.trim(),
          codigo: codigo.trim(),
          endereco: endereco.trim(),
          status: "ativo",
        },
      ]);

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      setModalVisible(false);
      setNome("");
      setCodigo("");
      setEndereco("");
      carregarDispositivos();
      Alert.alert("Sucesso", "Dispositivo criado");
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao criar dispositivo");
    }
  }

  async function deletar(id) {
    Alert.alert("Confirmar", "Deseja excluir este dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("dispositivos").delete().eq("id", id);
          if (error) {
            Alert.alert("Erro", error.message);
          } else {
            carregarDispositivos();
          }
        },
      },
    ]);
  }

  useEffect(() => {
    carregarDispositivos();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispositivos</Text>

      <TouchableOpacity style={styles.btn} onPress={() => setModalVisible(true)}>
        <Text style={styles.btnText}>+ Novo Dispositivo</Text>
      </TouchableOpacity>

      {dispositivos.length === 0 ? (
        <Text style={styles.empty}>Nenhum dispositivo cadastrado</Text>
      ) : (
        <FlatList
          data={dispositivos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardText}>Código: {item.codigo}</Text>
              <Text style={styles.cardText}>Endereço: {item.endereco}</Text>
              <Text style={styles.cardStatus}>Status: {item.status || "ativo"}</Text>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => deletar(item.id)}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Deletar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Novo Dispositivo</Text>

          <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
          <TextInput placeholder="Código/ID" value={codigo} onChangeText={setCodigo} style={styles.input} />
          <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={styles.input} />

          <TouchableOpacity style={styles.btn} onPress={criarDispositivo}>
            <Text style={styles.btnText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#f3f6fb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#111827" },
  btn: { backgroundColor: "#3A82F7", padding: 12, borderRadius: 8, marginBottom: 20 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20, fontSize: 16 },
  card: { padding: 15, backgroundColor: "#fff", marginBottom: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#3A82F7" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  cardText: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  cardStatus: { fontSize: 12, color: "#059669", marginBottom: 12, fontWeight: "600" },
  deleteBtn: { backgroundColor: "#E53935", padding: 10, borderRadius: 6, alignItems: "center", marginTop: 10 },
  modalContainer: { flex: 1, padding: 20, marginTop: 50, backgroundColor: "#f3f6fb" },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: "#d1d5db" },
  cancelBtn: { marginTop: 15, padding: 12, alignItems: "center" },
  cancelText: { color: "#E53935", fontWeight: "bold" },
});
