import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types'; // Make sure you have AddAddressScreen and OrderSuccess in your types

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OrderSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://static.vecteezy.com/system/resources/thumbnails/020/564/998/small_2x/confirm-order-on-transparent-background-free-png.png',
        }}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>🎉 Order Placed!</Text>
      <Text style={styles.message}>
        Your order has been successfully placed. We'll notify you once it's shipped.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BottomTabs')}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e86de',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
