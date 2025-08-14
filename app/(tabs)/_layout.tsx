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
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { Pressable, ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';

function CustomTabBar({ state, descriptors, navigation, userRole }: BottomTabBarProps & { userRole?: string | null }) {
  const effective = useEffectiveScheme();
  const { bottom } = useSafeAreaInsets();
  const activeColor = Colors[effective].tint;
  const inactiveColor = Colors[effective].tabIconDefault;
  const isDark = effective === 'dark';

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
    <View style={{ backgroundColor: isDark ? '#0b1220' : Colors.light.background, borderTopColor: isDark ? '#1f2937' : '#ccc', borderTopWidth: 1, height: 56 + bottom, paddingBottom: bottom }}>
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const effective = useEffectiveScheme();
  const isDark = effective === 'dark';
  // Map unknown roles to guest to avoid redirect loops
  const knownRoles = new Set(['guest','admin','superadmin','area manager','Iris - BA','Iris - TL','Dima','Diageo']);
  const effectiveUserRole = userRole && knownRoles.has(userRole) ? userRole : 'guest';

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

  if (effectiveUserRole === 'guest') {
    return (
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} userRole={effectiveUserRole} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[effective].tint,
          headerStyle: { backgroundColor: isDark ? '#0b1220' : Colors.light.background },
          headerTintColor: isDark ? '#e5e7eb' : '#000',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('profile'),
    tabBarIcon: ({ color }) => <TabBarIcon name="person-circle" color={color} />, 
            headerRight: () => (
              <Pressable onPress={() => router.push('/modal')}>
                {({ pressed }) => (
      <Ionicons
        name="ellipsis-horizontal"
                    size={25}
                    color={Colors[effective].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="clicker"
          options={{
            title: t('clicker'),
    tabBarIcon: ({ color }) => <TabBarIcon name="add-circle" color={color} />, 
            headerRight: () => (
              <Pressable onPress={() => router.push('/modal')}>
                {({ pressed }) => (
      <Ionicons
        name="ellipsis-horizontal"
                    size={25}
                    color={Colors[effective].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
          <Tabs.Screen
            name="about"
            options={{
              title: t('about'),
      tabBarIcon: ({ color }) => <TabBarIcon name="information-circle" color={color} />, 
              headerRight: () => (
                <Pressable onPress={() => router.push('/modal')}>
                  {({ pressed }) => (
        <Ionicons
          name="ellipsis-horizontal"
                      size={25}
                      color={Colors[effective].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              ),
            }}
          />
      </Tabs>
    );
  }

  return (
    <Tabs
  tabBar={(props) => <CustomTabBar {...props} userRole={effectiveUserRole} />}
      screenOptions={{
  tabBarActiveTintColor: Colors[effective].tint,
  headerStyle: { backgroundColor: isDark ? '#0b1220' : Colors.light.background },
  headerTintColor: isDark ? '#e5e7eb' : '#000',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="person-circle" color={color} />, 
          headerRight: () => (
            <Pressable onPress={() => router.push('/modal')}>
              {({ pressed }) => (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={25}
                  color={Colors[effective].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />
      {/* Clicker: visible to all logged-in users, placed beside Profile */}
  <Tabs.Screen name="clicker" options={{
        title: t('clicker'),
        tabBarIcon: ({ color }) => <TabBarIcon name="add-circle" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
      }} />
      <Tabs.Screen name="about" options={{
        title: t('about'),
        tabBarIcon: ({ color }) => <TabBarIcon name="information-circle" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
  ),
      }} />
      {/* All other tabs for non-guests */}
      
  <Tabs.Screen name="user-manager" options={{
        title: t('users_manager'),
        tabBarIcon: ({ color }) => <TabBarIcon name="people" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
        href: '/user-manager',
  }} />
      <Tabs.Screen name="projects-detail" options={{
        title: t('projects'),
        tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
        href: '/projects-detail',
      }} />
      
      <Tabs.Screen name="outlets-detail" options={{
        title: t('outlets'),
        tabBarIcon: ({ color }) => <TabBarIcon name="business" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
        href: '/outlets-detail',
      }} />
      <Tabs.Screen name="tasks" options={{
        title: t('tasks'),
        tabBarIcon: ({ color }) => <TabBarIcon name="checkbox" color={color} />, 
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors[effective].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
        href: '/tasks',
      }} />      
      {/* Explicitly hide legacy '(tabs)/audit-logs' route to prevent it from showing in tabs on stale bundles */}
          <Tabs.Screen
            name="audit-logs"
            options={{ href: null, headerShown: false }}
          />
      {/* Audit Logs tab removed; access via /audit-screens/audit-logs only */}
    </Tabs>
    
  );
}

