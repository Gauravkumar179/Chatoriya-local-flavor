import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, Text } from 'react-native';
import CartScreen from './CartScreen';
import UserProfileScreen from './userProfileScreen';
import OrdersScreen from './orderScreen';
import { useSelector } from 'react-redux';
import { RootState } from '../screens/store'; // adjust import
import UsersScreen from './alluser';
import { getUserRole } from './localStorage';  // Adjust path as needed
import OrdersDashboard from './orderdashboard';



const Tab = createBottomTabNavigator();

const DummyScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{title} Screen</Text>
  </View>
);

const BottomTabs = () => {
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await getUserRole();
      setRole(storedRole);
    };
    loadRole();
  }, []);
   console.log('User role:', role); // Debugging line to check the role
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 60,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={role=='user'? HomeScreen:OrdersDashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size={24} />
          ),
        }}
      />
       {role === 'user' && (
      <Tab.Screen
        name="Orders"
       component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color }) => (
            <Icon name="receipt-long" color={color} size={24} />
          ),
        }}
      />)}
        {role === 'user' && (
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarLabel: 'Cart',
            tabBarIcon: ({ color }) => (
              <Icon name="shopping-cart" color={color} size={24} />
            ),
          }}
        />
      )}
       {role === 'admin' && (
        <Tab.Screen
          name="Users"
          component={UsersScreen}
          options={{
            tabBarLabel: 'Users',
            tabBarIcon: ({ color }) => (
              <Icon name="group" color={color} size={24} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon name="person" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
