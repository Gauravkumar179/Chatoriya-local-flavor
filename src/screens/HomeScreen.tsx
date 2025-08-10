import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, RootState } from './store';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getFirestore,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';
import ProductDetailsSheet from './ProductDetailScreen'; // make sure path is correct

type RootStackParamList = {
  BottomTabs: undefined;
  Home: undefined;
};

type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
};

const HomeScreen = () => {
  const user = useSelector((state: RootState) => state.auth.isLoggedIn);
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<Product[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  // Inside HomeScreen component
const [placeholder, setPlaceholder] = useState('Search for Pizza');

const foodItems = ['Pizza', 'Burger', 'Pasta', 'Sushi', 'Sandwich'];

useEffect(() => {
  let index = 0;
  const intervalId = setInterval(() => {
    if (searchQuery.trim() === '') { // only rotate if input is empty
      index = (index + 1) % foodItems.length;
      setPlaceholder(`Search for "${foodItems[index]}"`);
    }
  }, 2000);

  return () => clearInterval(intervalId);
}, [searchQuery]);



  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      dispatch(clearUser());
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'BottomTabs' }] });
    } catch (error) {
      Alert.alert('Logout Failed', 'Something went wrong.');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const db = getFirestore();
        const snapshot = await getDocs(collection(db, 'orderItems'));

        if (snapshot.empty) return;

        const fetchedOrders: Product[] = [];
        snapshot.forEach((doc: { id: any; data: () => Product; }) => {
          fetchedOrders.push({ ...doc.data(), id: doc.id } as Product);
        });

        setOrderItems(fetchedOrders);
      } catch (error: any) {
        console.error("❌ Error fetching orderItems:", error);
      }
    };

    fetchOrders();
  }, []);

  useFocusEffect(() => {
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
        <Icon
          name="logout"
          style={styles.logouticon}
          color="#fff"
          size={24}
          onPress={() => handleLogout()}
        />
      ),
    });
  });

  const filteredItems = orderItems.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedItem(item);
        setShowSheet(true);
      }}
    >
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="#888" style={styles.icon} />
        <TextInput
  placeholder={searchQuery.trim() === '' ? placeholder : ''}
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchInput}
  placeholderTextColor="#888"
/>


      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {showSheet && selectedItem && (
        <ProductDetailsSheet
          item={selectedItem}
          onClose={() => setShowSheet(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
    color: '#888',
  },
  logouticon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 6,
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    padding: 14,
    color: '#222',
  },
});
