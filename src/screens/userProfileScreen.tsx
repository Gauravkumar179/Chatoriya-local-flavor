import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // 🔥 Add this

const UserProfileScreen: React.FC = () => {
  const userId = auth().currentUser?.uid; // 🔥 Get UID here

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pin: '',
    },
    imageBase64: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const doc = await firestore().collection('userProfile').doc(userId).get();

        if (doc.exists()) {
          setProfile(doc.data() as typeof profile);
          setEditing(false);
        } else {
          setEditing(true);
        }
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });
    if (result.didCancel || !result.assets) return;
    const asset = result.assets[0];
    const base64 = `data:${asset.type};base64,${asset.base64}`;
    setProfile({ ...profile, imageBase64: base64 });
  };

  const handleSave = async () => {
    if (!userId) return;
    const { name, email, phone, address, imageBase64 } = profile;

    if (!name || !email || !phone || !imageBase64) {
      Alert.alert('Please fill all fields and select an image');
      return;
    }

    try {
      await firestore().collection('userProfile').doc(userId).set({
        name,
        email,
        phone,
        address,
        imageBase64,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Profile saved!');
      setEditing(false);
    } catch (error) {
      Alert.alert('Save error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  type AddressField = 'line1' | 'line2' | 'city' | 'state' | 'pin';

  const handleAddressChange = (field: AddressField, value: string) => {
    setProfile({ ...profile, address: { ...profile.address, [field]: value } });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleImagePick} style={styles.imageWrapper}>
        {profile.imageBase64 ? (
          <Image source={{ uri: profile.imageBase64 }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Pick Profile Image</Text>
        )}
      </TouchableOpacity>

      {(['name', 'email', 'phone'] as const).map((field) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{field.toUpperCase()}</Text>
          <TextInput
            value={profile[field]}
            editable={editing}
            onChangeText={(text) => handleChange(field, text)}
            style={styles.input}
          />
        </View>
      ))}

      {(['line1', 'line2', 'city', 'state', 'pin'] as AddressField[]).map((field) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{field.toUpperCase()}</Text>
          <TextInput
            value={profile.address[field]}
            editable={editing}
            onChangeText={(text) => handleAddressChange(field, text)}
            style={styles.input}
          />
        </View>
      ))}

      {editing ? (
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  imageWrapper: {
    alignItems: 'center',
    marginVertical: 20,
    borderColor: '#aaa',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  image: { width: 100, height: 100, borderRadius: 50 },
  imageText: { color: 'blue' },
  inputGroup: { marginVertical: 5 },
  label: { fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10,
  },
  section: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#4CAF50', padding: 15, marginTop: 20, borderRadius: 5, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  editButton: {
    backgroundColor: '#2196F3', padding: 15, marginTop: 20, borderRadius: 5, alignItems: 'center',
  },
  editText: { color: '#fff', fontWeight: 'bold' },
});

export default UserProfileScreen;
