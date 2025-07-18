import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const { bottom } = useSafeAreaInsets();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const visibleRoutes = state.routes.filter(route => {
    const options = descriptors[route.key].options as any;
    return options.href !== null;
  });

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottom }]}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            {options.tabBarIcon && options.tabBarIcon({ focused: isFocused, color: isFocused ? activeColor : inactiveColor, size: 24 })}
            <Text style={{ color: isFocused ? activeColor : inactiveColor, fontSize: 10, textAlign: 'center' }}>
              {typeof label === 'string' ? label : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          href: (userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager' || userRole === 'Iris - BA' || userRole === 'Iris - TL') ? '/two' : null,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
        }}
      />
      <Tabs.Screen
        name="outlets"
        options={{
          title: 'Outlets',
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <TabBarIcon name="tasks" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task-attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task-quick-quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color }) => <TabBarIcon name="question-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task-early-assessment"
        options={{
          title: 'Assessment',
          tabBarIcon: ({ color }) => <TabBarIcon name="clipboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="quick-sales-report"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales-report-detail"
        options={{
          title: 'Sales Detail',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="province-list"
        options={{
          title: 'Provinces',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="city-list"
        options={{
          title: 'Cities',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-marker" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    paddingTop: 5,
  },
  tabItem: {
    flexBasis: '20%', // 5 items per row
    alignItems: 'center',
    paddingVertical: 5,
  },
});
