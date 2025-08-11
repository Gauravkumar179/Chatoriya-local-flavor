import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';

import { store, setUser, clearUser, RootState } from './src/screens/store';
import BottomTabs from './src/screens/BottomTabs';
import ProductDetailsScreen from './src/screens/ProductDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegistrationScreen';
import CartScreen from './src/screens/CartScreen';
import BuyScreen from './src/screens/buyscreen';
import UserProfileScreen from './src/screens/userProfileScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import OrderSuccessScreen from './src/screens/ordersuccess';
import OrdersScreen from './src/screens/orderScreen';

// 1) Import your SplashScreen component (adjust the path if needed)
import { SplashScreen } from './src/screens/SplashScreen';
import UsersScreen from './src/screens/alluser';
import OrdersDashboard from './src/screens/orderdashboard';
import FilteredOrdersScreen from './src/screens/filteredOrderscreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
    const [showSplash, setShowSplash] = useState(true);


  useEffect(() => {
    // Always show splash for 5 seconds
    const timer = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseAuthTypes.User | null) => {
      if (user) {
        // ✅ No verification check
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? null,
          })
        );
      } else {
        dispatch(clearUser());
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [dispatch]);

  // 2) Show splash while Firebase auth is initializing
  if (showSplash) {
    return (
      <SplashScreen
        duration={5000}
        title="Chatoriya"
        tagline="Local flavors. Delivered hot."
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="BottomTabs" component={BottomTabs} />
            {/* <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} /> */}
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Buy" component={BuyScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="AddAddress" component={AddAddressScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="Order" component={OrdersScreen} />
            <Stack.Screen name="Allusers" component={UsersScreen} />
            <Stack.Screen name="OrdersDashboard" component={OrdersDashboard} />
            <Stack.Screen name="FilteredOrders" component={FilteredOrdersScreen} />

          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}