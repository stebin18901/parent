import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SelectStudentScreen from "../screens/student/SelectStudentScreen";
import CreateStudentScreen from "../screens/student/CreateStudentScreen";
import BottomTabs from "./BottomTabs";
import LikesNotificationScreen from "../screens/notifications/LikesNotificationScreen";
import PostLikesScreen from "../screens/notifications/PostLikesScreen";
import LeagueHomeScreen from "../screens/league/LeagueHomeScreen";
import ChapterSelectScreen from "../screens/quiz/ChapterSelectScreen";
import QuizPlayScreen from "../screens/quiz/QuizPlayScreen";
import QuizReportScreen from "../screens/quiz/QuizReportScreen";
import TeamHubScreen from "../screens/team/TeamHubScreen";
import TeamJoinRequestsScreen from "../screens/team/TeamJoinRequestsScreen";
import SeasonConfirmationScreen from "../screens/league/pages/SeasonConfirmationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (

    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* ✅ STUDENT SELECTION FLOW */}
      <Stack.Screen name="SelectStudent" component={SelectStudentScreen} />
      <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
      <Stack.Screen
        name="LeagueHome"
        component={LeagueHomeScreen}
        options={{ title: "League" }}
      />


      {/* ✅ MAIN APP WITH BOTTOM TABS */}
      <Stack.Screen
        name="ParentHome"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LikesNotifications"
        component={LikesNotificationScreen}
      />
      <Stack.Screen
        name="ChapterSelect"
        component={ChapterSelectScreen}
        options={{ title: "Chapters" }}
      />
      <Stack.Screen
        name="QuizPlay"
        component={QuizPlayScreen}
        options={{ title: "Quiz" }}
      />
      <Stack.Screen
        name="QuizReport"
        component={QuizReportScreen}
        options={{ title: "Report" }}
      />
      <Stack.Screen
        name="TeamJoinRequests"
        component={TeamJoinRequestsScreen}
      />

      <Stack.Screen
        name="Teams"
        component={TeamHubScreen}
        options={{ title: "Teams" }}
      />
      <Stack.Screen name="PostLikes" component={PostLikesScreen} />
      <Stack.Screen
        name="SeasonConfirmation"
        component={SeasonConfirmationScreen}
      />



    </Stack.Navigator>
  );
}
