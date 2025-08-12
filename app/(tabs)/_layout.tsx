const styles = StyleSheet.create({
  tabBarContainer: {
  flexDirection: 'row',
  height: 56,
  alignItems: 'center',
},
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
});
import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, Redirect } from 'expo-router';
import { Pressable, ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';

function CustomTabBar({ state, descriptors, navigation, userRole }: BottomTabBarProps & { userRole?: string | null }) {
  const effective = useEffectiveScheme();
  const { bottom } = useSafeAreaInsets();
  const activeColor = Colors[effective].tint;
  const inactiveColor = Colors[effective].tabIconDefault;

  // Show a limited set of tabs for guests; full set for authenticated
  let filteredRoutes = state.routes;
  if (userRole === 'guest') {
    const allowed = new Set(['index', 'clicker', 'about']);
    filteredRoutes = state.routes.filter(route => allowed.has(route.name));
  } else {
    filteredRoutes = state.routes.filter(route => {
      const options = descriptors[route.key].options as any;
      return options.href !== null;
    });
  }

  return (
    <View style={{ backgroundColor: Colors[effective].background, borderTopColor: Colors[effective].tabIconDefault, borderTopWidth: 1, height: 56 + bottom, paddingBottom: bottom }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: 56 }}
        contentContainerStyle={styles.tabBarContainer}
      >
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
            if (userRole === 'guest') {
              const allowed = new Set(['index', 'clicker', 'about']);
              if (!allowed.has(route.name)) return;
            }
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
            if (userRole === 'guest') {
              const allowed = new Set(['index', 'clicker', 'about']);
              if (!allowed.has(route.name)) return;
            }
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Guests see only allowed routes (pre-filtered above)

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
      </ScrollView>
    </View>
  );
}


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const effective = useEffectiveScheme();

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

  // If not authenticated, send user to the login screen
  if (!auth.currentUser) {
    return <Redirect href="/login" />;
  }

  // Unknown/unassigned roles (e.g., '', 'user', 'User') are restricted to login/signup
  const knownRoles = new Set(['guest','admin','superadmin','area manager','Iris - BA','Iris - TL','Dima','Diageo']);
  if (userRole && !knownRoles.has(userRole)) {
    return <Redirect href="/login" />;
  }

  if (userRole === 'guest') {
    return (
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} userRole={userRole} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[effective].tint,
          headerStyle: { backgroundColor: Colors[effective].background },
          headerTintColor: Colors[effective].text,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />, 
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="ellipsis-h"
                      size={25}
                      color={Colors[effective].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="clicker"
          options={{
            title: t('clicker'),
            tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />, 
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="ellipsis-h"
                      size={25}
                      color={Colors[effective].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
          <Tabs.Screen
            name="about"
            options={{
              title: t('about'),
              tabBarIcon: ({ color }) => <TabBarIcon name="info-circle" color={color} />, 
              headerRight: () => (
                <Link href="/modal" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <FontAwesome
                        name="ellipsis-h"
                        size={25}
                        color={Colors[effective].text}
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
  tabBarActiveTintColor: Colors[effective].tint,
  headerStyle: { backgroundColor: Colors[effective].background },
  headerTintColor: Colors[effective].text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />, 
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="ellipsis-h"
                    size={25}
                    color={Colors[effective].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      {/* Clicker: visible to all logged-in users, placed beside Profile */}
  <Tabs.Screen name="clicker" options={{
        title: t('clicker'),
        tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }} />
      <Tabs.Screen name="about" options={{
        title: t('about'),
        tabBarIcon: ({ color }) => <TabBarIcon name="info-circle" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
  ),
      }} />
      {/* All other tabs for non-guests */}
      
  <Tabs.Screen name="user-manager" options={{
        title: t('users_manager'),
        tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/user-manager',
  }} />
      <Tabs.Screen name="projects-detail" options={{
        title: t('projects'),
        tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/projects-detail',
      }} />
      
      <Tabs.Screen name="outlets-detail" options={{
        title: t('outlets'),
        tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/outlets-detail',
      }} />
      <Tabs.Screen name="tasks" options={{
        title: t('tasks'),
        tabBarIcon: ({ color }) => <TabBarIcon name="tasks" color={color} />, 
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="ellipsis-h"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        href: '/tasks',
      }} />      
  {/* Audit Logs tab removed; access via /audit-screens/audit-logs only */}
    </Tabs>
    
  );
}

