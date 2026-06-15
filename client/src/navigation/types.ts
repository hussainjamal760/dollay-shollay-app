import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

export type BottomTabParamList = {
  Today: undefined;
  Schedule: undefined;
  Library: undefined;
  AICoach: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList>;
  PRs: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<RootStackParamList, T>;
export type BottomTabScreenPropsType<T extends keyof BottomTabParamList> = BottomTabScreenProps<BottomTabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
