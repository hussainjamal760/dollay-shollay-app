import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TodayScreen from '../screens/TodayScreen';
import ProgressScreen from '../screens/ProgressScreen';
import DietScreen from '../screens/DietScreen';
import AICoachScreen from '../screens/AICoachScreen';
import SettingsScreen from '../screens/SettingsScreen';
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
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Diet') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'AICoach') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#71717A',
        tabBarStyle: {
          backgroundColor: '#09090B',
          borderTopWidth: 1,
          borderTopColor: '#27272A',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#09090B',
          borderBottomWidth: 1,
          borderBottomColor: '#27272A',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        headerTintColor: '#FAFAFA',
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Diet" component={DietScreen} />
      <Tab.Screen name="AICoach" component={AICoachScreen} options={{ title: 'AI Coach' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
