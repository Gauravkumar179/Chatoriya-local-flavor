import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CheckBox from '@react-native-community/checkbox'; // Make sure this is installed
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CartItem } from './types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;

const CartScreen = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigation = useNavigation<NavigationProp>();

  const handleToggleCheckbox = (itemId: string) => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(itemId)) {
        updated.delete(itemId);
      } else {
        updated.add(itemId);
      }
      return updated;
    });
  };

  const handleProceedToBuy = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please select at least one item to proceed.');
      return;
    }
    navigation.navigate('Buy', { cartItems: selectedItems });
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      console.warn('❌ No authenticated user found.');
      return;
    }

    const unsubscribe = firestore()
      .collection('carts')
      .doc(user.uid)
      .collection('items')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<CartItem, 'id'>),
          }));
          setItems(data);
          setSelectedIds(new Set()); // Reset selections on data reload
        },
        error => {
          console.error('❌ Firestore error:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  const deleteItem = async (itemId: string) => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('carts')
        .doc(user.uid)
        .collection('items')
        .doc(itemId)
        .delete();
    } catch (error) {
      console.error('❌ Error deleting item:', error);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isChecked = selectedIds.has(item.id);

    return (
      <View style={styles.itemContainer}>
        <CheckBox
          value={isChecked}
          onValueChange={() => handleToggleCheckbox(item.id)}
          tintColors={{ true: '#4CAF50', false: '#aaa' }}
        />
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>₹{item.price}</Text>
          <Text>Qty: {item.quantity}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Delete Item', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
            ])
          }
          style={styles.deleteButton}
        >
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
  <FlatList
    data={items}
    keyExtractor={item => item.id}
    renderItem={renderItem}
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>No item added yet</Text>
      </View>
    }
    contentContainerStyle={items.length === 0 ? { flex: 1 } : { flexGrow: 1 }}
  />
  {items.length > 0 && (
    <View style={styles.footer}>
      <Button title="Proceed to Buy" onPress={handleProceedToBuy} />
    </View>
  )}
</View>

  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
empty: {
  fontSize: 16,
  color: '#999',
},

});

export default CartScreen;
