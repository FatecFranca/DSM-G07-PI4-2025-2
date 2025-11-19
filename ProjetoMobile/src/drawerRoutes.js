import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Páginas
import Main from "../pages/main";
import Faturas from "../pages/faturas";

// Cria o Drawer
const Drawer = createDrawerNavigator();

// Componente customizado para a barra lateral
function CustomDrawerContent({ navigation }) {
  return (
    <View style={styles.drawerContainer}>
      <Text style={styles.logo}>⚡ Relógio de Energia</Text>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Ionicons name="grid-outline" size={22} color="#007BFF" />
        <Text style={styles.itemText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Dispositivos")}
      >
        <Ionicons name="hardware-chip-outline" size={22} color="#007BFF" />
        <Text style={styles.itemText}>Dispositivos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Faturas")}
      >
        <Ionicons name="document-text-outline" size={22} color="#007BFF" />
        <Text style={styles.itemText}>Faturas</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

// Rotas do Drawer
export default function DrawerRoutes() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Dashboard"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#007BFF" },
          headerTintColor: "#fff",
          drawerType: "slide",
          overlayColor: "rgba(0,0,0,0.3)",
        }}
      >
        <Drawer.Screen
          name="Dashboard"
          component={Main}
          options={{
            title: "Dashboard",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Dispositivos"
          component={Main}
          options={{
            title: "Dispositivos",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="hardware-chip-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Faturas"
          component={Faturas}
          options={{
            title: "Faturas",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 30,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 16,
    marginLeft: 14,
    color: "#111827",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
  },
});
