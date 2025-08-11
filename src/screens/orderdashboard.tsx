import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';  // <-- import useDispatch from redux
import { clearUser } from './store';
import { getUserName } from './localStorage';
import { getUserRole } from './localStorage';  // Adjust path as needed

import UserProfileScreen from './userProfileScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const CARD_HEIGHT = 140;

const OrdersDashboard = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await getUserRole();
      setRole(storedRole);
    };
    loadRole();
  }, []);

  useEffect(() => {
    const loadName = async () => {
      const storedName = await getUserName();
      setName(storedName);
    };
    loadName();
  }, []);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRef = firestore().collection('orders');
      const snapshot = await ordersRef.get();

      let delivered = 0;
      let notDelivered = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'delivered') {
          delivered += 1;
        } else {
          notDelivered += 1;
        }
      });

      setDeliveredCount(delivered);
      setPendingCount(notDelivered);
    } catch (error) {
      console.error('Error fetching order counts:', error);
      Alert.alert('Error', 'Failed to load order counts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(getAuth());
      dispatch(clearUser());
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'BottomTabs' }] });
    } catch (error) {
      Alert.alert('Logout Failed', 'Something went wrong.');
    }
  }, [dispatch, navigation]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerShown: true,
        headerTitle: () => (
          <Image
            source={require('../../assets/chatoriya1.png')}
            style={{ width: 70, height: 70, resizeMode: 'contain' }}
          />
        ),
        headerStyle: { backgroundColor: '#007BFF' },

        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 16, marginRight: 8 }}>{name ?? ''}</Text>
            <Icon name="logout" color="#fff" size={24} onPress={handleLogout} />
          </View>
        ),
      });
    }, [navigation, handleLogout, name])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  // Define the cards to show on dashboard
  const dashboardCards = [
    {
      key: 'pendingOrders',
      label: 'Pending Orders',
      count: pendingCount,
      onPress: () => navigation.navigate('FilteredOrders', { statusFilter: 'not_delivered' }),
      backgroundColor: '#f59e0b', // amber
      icon: 'hourglass-top',
    },
    {
      key: 'deliveredOrders',
      label: 'Delivered Orders',
      count: deliveredCount,
      onPress: () => navigation.navigate('FilteredOrders', { statusFilter: 'delivered' }),
      backgroundColor: '#10b981', // green
      icon: 'check-circle',
    },
    {
      key: 'allOrders',
      label: 'All Orders',
      count: pendingCount + deliveredCount,
      onPress: () => navigation.navigate('FilteredOrders', { statusFilter: 'all' }),
      backgroundColor: '#3b82f6', // blue
      icon: 'format-list-bulleted',
    },
    {
      key: 'profile',
      label: 'Profile',
      count: null,
      onPress: () => navigation.navigate('UserProfile'),
      backgroundColor: '#8b5cf6', // purple
      icon: 'account-circle',
    },
    
    ...(role === 'admin'
    ? [{
        key: 'users',
        label: 'Users',
        count: null,
        onPress: () => navigation.navigate('Allusers'),
        backgroundColor: '#ef4444', // red
        icon: 'people',
      }]
    : []),
    
      ...(role === 'admin'
    ? [{
      key: 'cashflow',
      label: 'cashflow',
      count: null,
      onPress: () => navigation.navigate('OrdersDashboard'),
      backgroundColor: '#f97316', // orange
        icon: 'account-balance-wallet',
      }]
    : []),
    {
      key: 'wallet',
      label: 'wallet',
      count: null,
      //onPress: handleLogout,
      backgroundColor: '#ef4444', // red
      icon: 'wallet',
    },
    {
      key: 'UPI',
      label: 'UPI',
      count: null,
     // onPress: handleLogout,
      backgroundColor: '#e11d48', // red
      icon: 'credit-card',
    },
  ];

  const renderCard = ({ item }: { item: typeof dashboardCards[0] }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.backgroundColor, width: CARD_WIDTH, height: CARD_HEIGHT }]}
      onPress={item.onPress}
      activeOpacity={0.8}
    >
      <Icon name={item.icon} size={36} color="#fff" style={{ marginBottom: 10 }} />
      <Text style={styles.label}>{item.label}</Text>
      {item.count !== null && <Text style={styles.count}>{item.count}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dashboardCards}
        keyExtractor={item => item.key}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default OrdersDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  count: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
