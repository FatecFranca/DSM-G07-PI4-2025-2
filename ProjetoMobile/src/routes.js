// src/routes.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Alert, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./lib/supabase";

// Telas existentes
import Login from "./pages/login";
import Cadastro from "./pages/cadastro";
import Dispositivos from "./pages/Dispositivos";
import Faturas from "./pages/faturas";
import MainSafe from "./pages/main";
import ResetPassword from "./pages/resetpassword";
import User from "./pages/user";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Componente customizado para o conteúdo do drawer
function CustomDrawerContent(props) {
  const handleLogout = async () => {
    Alert.alert("Logout", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            props.navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (err) {
            Alert.alert("Erro", "Falha ao fazer logout");
            console.error(err);
          }
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Perfil"
        icon={({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("User")}
      />
      <DrawerItem
        label="Sair"
        icon={({ color, size }) => <Ionicons name="exit-outline" size={size} color={color} />}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#007BFF" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#007BFF",
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={MainSafe}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Dispositivos"
        component={Dispositivos}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="hardware-chip-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Faturas"
        component={Faturas}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

export default function Routes() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Main" : "Login"}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={Cadastro} options={{ title: "Cadastro de Usuário" }} />

        {/* Drawer como tela principal */}
        <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />

        <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ title: "Recuperar Senha" }} />
        <Stack.Screen name="User" component={User} options={{ title: "Perfil" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
