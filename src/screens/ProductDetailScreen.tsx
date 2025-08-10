import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { height } = Dimensions.get('window');

const ProductDetailsSheet = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [quantity, setQuantity] = useState(1);
  const slideAnim = useRef(new Animated.Value(height)).current; // start off-screen

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const increaseQty = () => setQuantity((prev) => prev + 1);
  const decreaseQty = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Login required');
      return;
    }

    const cartItemRef = firestore()
      .collection('carts')
      .doc(user.uid)
      .collection('items')
      .doc(item.id);

    const doc = await cartItemRef.get();

    if (doc.exists()) {
      await cartItemRef.update({
        quantity: firestore.FieldValue.increment(quantity),
      });
    } else {
      await cartItemRef.set({
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: quantity,
      });
    }

    Alert.alert('Added to cart!');
    handleClose();
    
    
  };

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Product Image */}
      <Image source={{ uri: item.image }} style={styles.image} />

      {/* Title */}
      <Text style={styles.title}>{item.name}</Text>

      {/* Price */}
      <Text style={styles.price}>₹{item.price * quantity}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>

     {/* Quantity + Add to Cart Row */}
<View style={styles.rowContainer}>
  {/* Quantity Controls */}
  <View style={styles.qtyContainer}>
    <TouchableOpacity onPress={decreaseQty} style={styles.qtyButton}>
      <Text style={styles.qtyText}>-</Text>
    </TouchableOpacity>
    <Text style={styles.qtyValue}>{quantity}</Text>
    <TouchableOpacity onPress={increaseQty} style={styles.qtyButton}>
      <Text style={styles.qtyText}>+</Text>
    </TouchableOpacity>
  </View>

  {/* Add to Cart */}
  <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
    <Text style={styles.cartText}>
      Add Item | ₹{item.price * quantity}
    </Text>
  </TouchableOpacity>
</View>

    </Animated.View>
  );
};

export default ProductDetailsSheet;

const styles = StyleSheet.create({
  sheetContainer: {
  position: 'relative',
  bottom: 0,
  width: '100%',
  height: height * 0.5,
   backgroundColor: 'rgba(224, 247, 250, 0.25)', // icy blue-white tone

  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 12,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.4)', // frosted white border
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 5,
},

 
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '30%',
    resizeMode: 'contain',
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    color: '#007BFF',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  rowContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 16,
},

qtyContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f2f2f2',
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
  marginRight: 10,
  flex: 1, // takes some space
  justifyContent: 'space-between',
},

qtyButton: {
  backgroundColor: '#ddd',
  padding: 8,
  borderRadius: 4,
},

qtyText: {
  fontSize: 18,
  fontWeight: 'bold',
},

qtyValue: {
  fontSize: 18,
  marginHorizontal: 10,
},

cartButton: {
  backgroundColor: '#007bff',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  flex: 2, // bigger than qty box
},

cartText: {
  color: '#fff',
  fontWeight: 'bold',
  textAlign: 'center',
},

});
