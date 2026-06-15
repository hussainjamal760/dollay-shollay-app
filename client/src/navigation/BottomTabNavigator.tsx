import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TodayScreen from '../screens/TodayScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import LibraryScreen from '../screens/LibraryScreen';
import AICoachScreen from '../screens/AICoachScreen';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

          if (route.name === 'Today') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'AICoach') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5252',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: '#121212',
          borderBottomWidth: 0,
          elevation: 0,
        },
        headerTintColor: '#ffffff',
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="AICoach" component={AICoachScreen} options={{ title: 'AI Coach' }} />
    </Tab.Navigator>
  );
}
