import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CreatePostScreen from "../screens/feed/CreatePostScreen";
import PostDetailScreen from "../screens/feed/PostDetailScreen";
import FeedHomeScreen from "../screens/feed/FeedHomeScreen";

import ProfileScreen from "../screens/profile/ProfileScreen";
import DummyHomeScreen from "../screens/home/DummyHomeScreen";
import TeamChatScreen from "../screens/team/TeamChatScreen";
import TeamHubScreen from "../screens/team/TeamHubScreen";

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const TeamStack = createNativeStackNavigator();

function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedHomeScreen} />
      <FeedStack.Screen name="CreatePost" component={CreatePostScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
    </FeedStack.Navigator>
  );
}

function TeamStackScreen() {
  return (
    <TeamStack.Navigator screenOptions={{ headerShown: false }}>
      <TeamStack.Screen name="TeamHome" component={TeamHubScreen} />
      <TeamStack.Screen name="TeamChat" component={TeamChatScreen} />
    </TeamStack.Navigator>
  );
}

const COLORS = {
  bar: "rgba(255,255,255,0.96)",
  bg: "#ECF2FF",
  border: "rgba(79,70,229,0.16)",
  active: "#312E81",
  inactive: "#64748B",
  pill: "#E0E7FF",
};

export default function BottomTabs() {
  const insets = useSafeAreaInsets();
  const barHeight = 35 + insets.bottom;

  return (
    <View style={styles.root}>
      <Tab.Navigator
        sceneContainerStyle={[styles.scene, { paddingBottom: barHeight }]}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: [
            styles.tabBar,
            {
              height: barHeight,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ],
          tabBarItemStyle: styles.tabItem,
          tabBarActiveBackgroundColor: COLORS.pill,
          tabBarInactiveBackgroundColor: "transparent",
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.label, { color: focused ? COLORS.active : COLORS.inactive }]}>
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
            } else if (route.name === "Team") {
              Icon = MaterialCommunityIcons;
              icon = focused ? "account-group" : "account-group-outline";
            } else if (route.name === "Profile") {
              icon = focused ? "person" : "person-outline";
            }

            return (
              <View style={styles.iconWrap}>
                <Icon name={icon} size={22} color={focused ? COLORS.active : COLORS.inactive} />
                {focused && <View style={styles.underline} />}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={DummyHomeScreen} />
        <Tab.Screen name="Social" component={FeedStackScreen} />
        <Tab.Screen name="Team" component={TeamStackScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scene: {
    backgroundColor: COLORS.bg,
  },
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: COLORS.bar,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === "ios" ? 0.14 : 0.2,
    shadowRadius: 10,
  },
  tabItem: { borderRadius: 12, marginHorizontal: 2 },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  underline: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.active,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
});
