import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CartItem } from './types';

type BuyRouteProp = RouteProp<RootStackParamList, 'Buy'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BuyScreen = () => {
  const route = useRoute<BuyRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { cartItems } = route.params;

  const userId = auth().currentUser?.uid;
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (userId) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .collection('addresses')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAddresses(data);
        });

      return () => unsubscribe();
    }
  }, [userId]);

  const handleContinue = async () => {
    if (!selectedAddress) {
      Alert.alert('Select address', 'Please choose or add a delivery address.');
      return;
    }

    try {
      const orderData = {
        userId,
        cartItems,
        totalAmount,
        address: selectedAddress,
        paymentMode: 'COD',
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('orders').add(orderData);
        // 2. Delete only the selected items from the cart
    const cartRef = firestore()
      .collection('carts')
      .doc(userId)
      .collection('items');

    const batch = firestore().batch();
    for (let item of cartItems) {
      const itemRef = cartRef.doc(item.id);
      batch.delete(itemRef);
    }
    await batch.commit();

      Alert.alert('✅ Order Placed', 'Your order has been placed successfully!');
      navigation.navigate('OrderSuccess');
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price} × {item.quantity}</Text>
        <Text style={styles.subtotal}>Subtotal: ₹{item.price * item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🧾 Order Summary</Text>

      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Delivery Address</Text>

        {addresses.map(addr => (
          <TouchableOpacity
            key={addr.id}
            style={[
              styles.addressBox,
              selectedAddress?.id === addr.id && styles.selectedAddress,
            ]}
            onPress={() => setSelectedAddress(addr)}
          >
            <Text>{addr.line1}, {addr.line2}</Text>
            <Text>{addr.city}, {addr.state} - {addr.pincode}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addAddressBtn}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <Text style={styles.addAddressText}>➕ Add New Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Method</Text>
        <Text style={styles.codText}>✅ Cash on Delivery (COD)</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  details: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#555',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  addressBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  selectedAddress: {
    borderColor: '#2e86de',
    backgroundColor: '#eaf2ff',
  },
  addAddressBtn: {
    padding: 10,
    alignItems: 'center',
  },
  addAddressText: {
    color: '#2e86de',
    fontWeight: 'bold',
  },
  codText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#e7ffe7',
    padding: 10,
    borderRadius: 8,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuyScreen;
