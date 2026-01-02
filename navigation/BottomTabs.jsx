import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/* FEED STACK */
import CreatePostScreen from "../screens/feed/CreatePostScreen";
import PostDetailScreen from "../screens/feed/PostDetailScreen";
import FeedHomeScreen from "../screens/feed/FeedHomeScreen";

/* MAIN SCREENS */
import ProfileScreen from "../screens/profile/ProfileScreen";
import DummyHomeScreen from "../screens/home/DummyHomeScreen";
import CareerGuidance from "../screens/career/CareerGuidance";

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();

/* FEED STACK */
function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedHomeScreen} />
      <FeedStack.Screen name="CreatePost" component={CreatePostScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
    </FeedStack.Navigator>
  );
}

/* COLORS */
const COLORS = {
  bar: "rgba(43, 43, 43, 0.96)",
  bg: "#0B1220",
  border: "rgba(255,255,255,0.08)",
  active: "#FACC15",
  inactive: "#94A3B8",
};

export default function BottomTabs() {
  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,

          tabBarStyle: styles.tabBar,

          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.label,
                { color: focused ? COLORS.active : COLORS.inactive },
              ]}
            >
              {route.name}
            </Text>
          ),

          tabBarIcon: ({ focused }) => {
            let icon;
            let Icon = Ionicons;

            if (route.name === "Home") {
              icon = focused ? "home" : "home-outline";
            } else if (route.name === "Social") {
              icon = focused ? "people" : "people-outline";
            } else if (route.name === "Career") {
              Icon = MaterialCommunityIcons;
              icon = focused ? "chart-line" : "chart-line-variant";
            } else if (route.name === "Profile") {
              icon = focused ? "person" : "person-outline";
            }

            return (
              <View style={styles.iconWrap}>
                <Icon
                  name={icon}
                  size={22}
                  color={focused ? COLORS.active : COLORS.inactive}
                />
                {focused && <View style={styles.underline} />}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={DummyHomeScreen} />
        <Tab.Screen name="Social" component={FeedStackScreen} />
        <Tab.Screen name="Career" component={CareerGuidance} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  tabBar: {
    height: 90,
    backgroundColor: COLORS.bar,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 6,
    paddingTop: 6,
  },

  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  underline: {
    marginTop: 4,
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.active,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: -2,
  },
});
