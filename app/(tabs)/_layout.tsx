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


function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function CustomTabBar({ state, descriptors, navigation, userRole }: BottomTabBarProps & { userRole?: string | null }) {
  const colorScheme = useColorScheme();
  const { bottom } = useSafeAreaInsets();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  // Only show the index tab for guests
  let filteredRoutes = state.routes;
  if (userRole === 'guest') {
    filteredRoutes = state.routes.filter(route => route.name === 'index');
  } else {
    filteredRoutes = state.routes.filter(route => {
      const options = descriptors[route.key].options as any;
      return options.href !== null;
    });
  }

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottom }]}> 
      {filteredRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);

        const onPress = () => {
          if (userRole === 'guest' && route.name !== 'index') return;
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
          if (userRole === 'guest' && route.name !== 'index') return;
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Only render the index tab for guests
        if (userRole === 'guest' && route.name !== 'index') return null;

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

  if (userRole === 'guest') {
    return (
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} userRole={userRole} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        }}
      >
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
                      name="ellipsis-h"
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
      </Tabs>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} userRole={userRole} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      }}
    >
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
                    name="ellipsis-h"
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
      {/* All other tabs for non-guests */}
      <Tabs.Screen name="user-management" options={{
        title: 'Users',
        tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/user-management',
      }} />
      <Tabs.Screen name="projects" options={{
        title: 'Projects',
        tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/projects',
      }} />
      <Tabs.Screen name="outlets" options={{
        title: 'Outlets',
        tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/outlets',
      }} />
      <Tabs.Screen name="tasks" options={{
        title: 'Tasks',
        tabBarIcon: ({ color }) => <TabBarIcon name="tasks" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/tasks',
      }} />
      <Tabs.Screen name="task-attendance" options={{
        title: 'Attendance',
        tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/task-attendance',
      }} />
      <Tabs.Screen name="task-quick-quiz" options={{
        title: 'Quiz',
        tabBarIcon: ({ color }) => <TabBarIcon name="question-circle" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/task-quick-quiz',
      }} />
      <Tabs.Screen name="task-early-assessment" options={{
        title: 'Assessment',
        tabBarIcon: ({ color }) => <TabBarIcon name="clipboard" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/task-early-assessment',
      }} />
      <Tabs.Screen name="quick-sales-report" options={{
        title: 'Sales',
        tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/quick-sales-report',
      }} />
      <Tabs.Screen name="sales-report-detail" options={{
        title: 'Sales Detail',
        tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/sales-report-detail',
      }} />
      <Tabs.Screen name="province-list" options={{
        title: 'Provinces',
        tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/province-list',
      }} />
      <Tabs.Screen name="city-list" options={{
        title: 'Cities',
        tabBarIcon: ({ color }) => <TabBarIcon name="map-marker" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/city-list',
      }} />
    </Tabs>
  );
}

