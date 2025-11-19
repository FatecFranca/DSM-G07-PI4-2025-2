import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      const resp = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log("Login response:", resp);

      if (resp.error) {
        Alert.alert("Erro", resp.error.message || "Falha no login");
        return;
      }

      const user = resp.data?.user ?? resp.user ?? null;
      if (!user) {
        Alert.alert("Erro", "Não foi possível autenticar o usuário.");
        return;
      }

      console.log("Navegando para Main, user id:", user.id);
      // Navega apenas após login bem-sucedido
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      }, 80);
    } catch (err) {
      console.error("Login catch:", err);
      Alert.alert("Erro", err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate("Cadastro")}
      >
        <Text style={styles.linkText}>Cadastrar</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("ResetPassword")}>
        <Text style={styles.linkText}>Esqueceu a senha?</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f3f6fb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#111827",
  },
  input: {
    width: "100%",
    maxWidth: 300,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    maxWidth: 300,
    height: 50,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 10,
    padding: 10,
  },
  linkText: {
    color: "#007BFF",
    fontSize: 14,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
  },
});

export default Login;
