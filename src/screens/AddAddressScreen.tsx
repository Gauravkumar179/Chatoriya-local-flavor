import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';

const AddAddressScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const handleSave = async () => {
    if (!name || !mobile || !street || !city || !pincode) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const db = getFirestore();
      const address = {
        name,
        mobile,
        street,
        city,
        pincode,
        createdAt: serverTimestamp(),
      };

      // Modular API usage for adding a document
      const addressesRef = collection(db, 'users', user.uid, 'addresses');
      await addDoc(addressesRef, address);

      Alert.alert('✅ Success', 'Address saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while saving the address');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Address</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Street Address"
        value={street}
        onChangeText={setStreet}
        style={styles.input}
      />

      <TextInput
        placeholder="City"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <TextInput
        placeholder="Pincode"
        value={pincode}
        onChangeText={setPincode}
        style={styles.input}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Address</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2e86de',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',}});