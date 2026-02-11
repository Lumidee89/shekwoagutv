import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/DashboardScreen';
import WaitlistScreen from '../screens/WaitlistScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ProfileScreen from '../screens/ProfileScreen';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  icon: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, icon }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: focused ? -8 : 0,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.tabIconContainer,
        {
          transform: [{ translateY }],
        },
        focused && styles.activeTabIcon,
      ]}
    >
      <LinearGradient
        colors={focused ? ['#E50914', '#B00710'] : ['transparent', 'transparent']}
        style={styles.iconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.iconEmoji, focused && styles.activeIconEmoji]}>
          {icon}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={['rgba(20, 20, 20, 0.9)', 'rgba(10, 10, 10, 0.95)']}
        style={styles.tabBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let icon = '🏠';
          if (route.name === 'Waitlist') icon = '⏳';
          if (route.name === 'Subscription') icon = '💳';
          if (route.name === 'Profile') icon = '👤';

          return (
            <TouchableOpacity
              key={index}
              style={styles.tabButton}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <TabIcon focused={isFocused} icon={icon} />
              {isFocused && (
                <Text style={styles.tabLabel}>
                  {route.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Waitlist" component={WaitlistScreen} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabIcon: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 22,
    color: '#999999',
  },
  activeIconEmoji: {
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default BottomTabNavigator;