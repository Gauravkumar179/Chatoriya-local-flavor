import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { getUserRole } from './localStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type Address = {
  name: string;
  mobile: string;
  street: string;
  city: string;
  pincode: string;
};

type Order = {
  id: string;
  status: string;
  paymentMode: string;
  cartItems: CartItem[];
  address: Address;
};

type RouteParams = {
  FilteredOrders: {
    statusFilter: 'delivered' | 'not_delivered';
  };
};

const FilteredOrdersScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'FilteredOrders'>>();
  const { statusFilter } = route.params;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
   const navigation = useNavigation();

  useLayoutEffect(() => {
  const titleMap: Record<string, string> = {
    delivered: 'Delivered Orders',
    not_delivered: 'Pending/Shipped Orders',
    all: 'All Orders',
  };

  navigation.setOptions({
    headerShown: true,
    headerTitle: titleMap[statusFilter] || 'Orders',
    headerStyle: {
      backgroundColor: '#007BFF',
      shadowColor: 'transparent', // optional: remove bottom shadow
    },
    headerTintColor: '#fff', // title color white
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 20,
    },
  });
}, [navigation, statusFilter]);

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await getUserRole();
      setRole(storedRole);
    };
    loadRole();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRef = firestore().collection('orders');
      let snapshot;

      if (statusFilter === 'delivered') {
        snapshot = await ordersRef.where('status', '==', 'delivered').get();
      } else if (statusFilter === 'not_delivered') {
        snapshot = await ordersRef.where('status', 'in', ['pending', 'shipped']).get();
      }else if (statusFilter === 'all') {
        snapshot = await ordersRef.get();
      }
       else {
        snapshot = await ordersRef.get();
      }

      const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
        ...(doc.data() as Order),
        id: doc.id,
      }));

      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching filtered orders:', error);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await firestore().collection('orders').doc(orderId).update({ status: newStatus });
      Alert.alert('Success', `Order status updated to "${newStatus}"`);
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status.');
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const canUpdateStatus = role !== 'user' && item.status !== 'delivered';
    const fullAddress = `${item.address.street}, ${item.address.city} - ${item.address.pincode}`;

    return (
      <View style={styles.card}>
        <View style={styles.leftColumn}>
          {item.cartItems && item.cartItems.length > 0 ? (
            <Image
              source={{ uri: item.cartItems[0].image }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Text style={{ color: '#888' }}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
            {item.address.name}
          </Text>
          <Text style={styles.statusText}>
            Status: <Text style={styles.statusBold}>{item.status.toUpperCase()}</Text>
          </Text>
          <Text style={styles.paymentText}>Payment Mode: {item.paymentMode}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mobile</Text>
            <Text style={styles.sectionContent}>{item.address.mobile || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.sectionContent} numberOfLines={2} ellipsizeMode="tail">
              {fullAddress}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            {item.cartItems && item.cartItems.length > 0 ? (
              item.cartItems.map(cartItem => (
                <View key={cartItem.id} style={styles.cartItemRow}>
                  <Image source={{ uri: cartItem.image }} style={styles.cartItemImage} />
                  <Text style={styles.cartItemText} numberOfLines={1} ellipsizeMode="tail">
                    {cartItem.name} x{cartItem.quantity} - ₹{cartItem.price * cartItem.quantity}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionContent}>No items in cart</Text>
            )}
          </View>

          {canUpdateStatus && (
            <View style={styles.statusButtons}>
              {['pending', 'shipped', 'delivered'].map(statusOption => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusButton,
                    item.status === statusOption && styles.statusButtonActive,
                  ]}
                  onPress={() => updateOrderStatus(item.id, statusOption)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      item.status === statusOption && styles.statusButtonTextActive,
                    ]}
                  >
                    {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No {statusFilter === 'not_delivered' ? 'pending/shipped' : 'delivered'} orders found.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default FilteredOrdersScreen;

const IMAGE_SIZE = SCREEN_WIDTH * 0.25; // 25% of screen width

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#555' },
  listContent: { paddingBottom: 120 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },

  leftColumn: {
    width: IMAGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },

  imagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rightColumn: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'flex-start',
  },

  customerName: {
    fontSize: SCREEN_WIDTH > 400 ? 20 : 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },

  statusText: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 12,
    color: '#444',
  },

  statusBold: {
    fontWeight: '700',
    color: '#2563EB',
  },

  paymentText: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 12,
    color: '#444',
    marginBottom: 12,
  },

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },

  sectionContent: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 13,
    color: '#555',
  },

  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    maxWidth: '100%',
  },

  cartItemImage: {
    width: IMAGE_SIZE * 0.4,
    height: IMAGE_SIZE * 0.4,
    borderRadius: 6,
    marginRight: 10,
  },

  cartItemText: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 12,
    color: '#444',
    flexShrink: 1, // prevent overflow
  },

  statusButtons: {
    flexDirection: 'row',
    marginTop: 14,
  },

  statusButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
  },

  statusButtonActive: {
    backgroundColor: '#2563EB',
  },

  statusButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: SCREEN_WIDTH > 400 ? 14 : 12,
  },

  statusButtonTextActive: {
    color: '#fff',
  },
});
