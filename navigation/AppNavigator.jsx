import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import SelectStudentScreen from "../screens/student/SelectStudentScreen";
import CreateStudentScreen from "../screens/student/CreateStudentScreen";
import BottomTabs from "./BottomTabs";
import LikesNotificationScreen from "../screens/notifications/LikesNotificationScreen";
import PostLikesScreen from "../screens/notifications/PostLikesScreen";
import LeagueHomeScreen from "../screens/league/LeagueHomeScreen";
import ChapterSelectScreen from "../screens/quiz/ChapterSelectScreen";
import QuizPlayScreen from "../screens/quiz/QuizPlayScreen";
import QuizReportScreen from "../screens/quiz/QuizReportScreen";
import SubjectQuizResultsScreen from "../screens/profile/SubjectQuizResultsScreen";
import TeamHubScreen from "../screens/team/TeamHubScreen";
import TeamJoinRequestsScreen from "../screens/team/TeamJoinRequestsScreen";
import SeasonConfirmationScreen from "../screens/league/pages/SeasonConfirmationScreen";
import StoryModePromoScreen from "../screens/home/StoryModePromoScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* STUDENT FLOW */}
        <Stack.Screen name="SelectStudent" component={SelectStudentScreen} />
        <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
        <Stack.Screen name="LeagueHome" component={LeagueHomeScreen} />

        {/* MAIN APP */}
        <Stack.Screen name="ParentHome" component={BottomTabs} />

        {/* OTHER SCREENS */}
        <Stack.Screen name="LikesNotifications" component={LikesNotificationScreen} />
        <Stack.Screen name="ChapterSelect" component={ChapterSelectScreen} />
        <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
        <Stack.Screen name="QuizReport" component={QuizReportScreen} />
        <Stack.Screen name="SubjectQuizResults" component={SubjectQuizResultsScreen} />
        <Stack.Screen name="TeamJoinRequests" component={TeamJoinRequestsScreen} />
        <Stack.Screen name="Teams" component={TeamHubScreen} />
        <Stack.Screen name="PostLikes" component={PostLikesScreen} />
        <Stack.Screen name="SeasonConfirmation" component={SeasonConfirmationScreen} />
        <Stack.Screen name="StoryModePromo" component={StoryModePromoScreen} />

      </Stack.Navigator>

    </View>
  );
}
