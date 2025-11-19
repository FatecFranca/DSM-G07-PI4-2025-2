import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f6fb",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  button: {
    flex: 1,
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  infoText: {
    color: "#6b7280",
    marginTop: 8,
    fontSize: 13,
  },
});

export default function User({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); // corresponde à coluna 'senha' se existir
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const nav = useNavigation();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        nav.replace("Login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, created_at, senha")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows, handle gracefully
        throw error;
      }

      if (data) {
        setNome(data.nome || "");
        setEmail(data.email || "");
        setSenha(data.senha ? String(data.senha) : "");
        setCreatedAt(data.created_at || null);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Erro", "Nome e e-mail são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        nav.replace("Login");
        return;
      }

      // Atualiza a tabela profiles
      const updates = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
      };

      // Se a coluna senha existir e o usuário forneceu valor, envia (ajuste se for tipo numérico)
      if (senha !== "") {
        // se sua coluna senha for numérica, converta: Number(senha)
        updates.senha = senha;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      Alert.alert("Sucesso", "Perfil atualizado.");
      fetchProfile();
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav.replace("Login");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Meu Perfil</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} editable={!saving} />

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!saving}
      />

      <Text style={styles.label}>Senha (opcional na tabela)</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        editable={!saving}
        secureTextEntry={false}
      />

      {createdAt ? <Text style={styles.infoText}>Criado em: {new Date(createdAt).toLocaleString()}</Text> : null}

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
