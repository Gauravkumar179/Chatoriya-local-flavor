import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const UserProfileScreen: React.FC = () => {
  const userId = auth().currentUser?.uid;

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
    const { name, email, phone, imageBase64 } = profile;

    if (!name.trim() || !email.trim() || !phone.trim() || !imageBase64) {
      Alert.alert('Validation Error', 'Please fill all required fields and select a profile image.');
      return;
    }

    try {
      await firestore().collection('userProfile').doc(userId).set({
        ...profile,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Profile saved successfully!');
      setEditing(false);
    } catch (error) {
      Alert.alert('Save Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  type AddressField = 'line1' | 'line2' | 'city' | 'state' | 'pin';

  const handleAddressChange = (field: AddressField, value: string) => {
    setProfile({ ...profile, address: { ...profile.address, [field]: value } });
  };

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handleImagePick} style={styles.imageWrapper} activeOpacity={0.7}>
          {profile.imageBase64 ? (
            <Image source={{ uri: profile.imageBase64 }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.imageText}>Tap to select profile image</Text>
            </View>
          )}
        </TouchableOpacity>

        {(['name', 'email', 'phone'] as const).map((field) => (
          <View key={field} style={styles.inputGroup}>
            <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <TextInput
              value={profile[field]}
              editable={editing}
              onChangeText={(text) => handleChange(field, text)}
              style={[styles.input, !editing && styles.inputDisabled]}
              keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
              autoCapitalize={field === 'email' ? 'none' : 'words'}
              placeholder={`Enter your ${field}`}
            />
          </View>
        ))}

        <Text style={styles.sectionTitle}>Address</Text>
        {(['line1', 'line2', 'city', 'state', 'pin'] as AddressField[]).map((field) => (
          <View key={field} style={styles.inputGroup}>
            <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <TextInput
              value={profile.address[field]}
              editable={editing}
              onChangeText={(text) => handleAddressChange(field, text)}
              style={[styles.input, !editing && styles.inputDisabled]}
              placeholder={`Enter ${field}`}
              keyboardType={field === 'pin' ? 'number-pad' : 'default'}
              autoCapitalize="words"
            />
          </View>
        ))}

        {editing ? (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} activeOpacity={0.8}>
            <Text style={styles.saveText}>Save Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton} activeOpacity={0.8}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2563EB', // header background color for status bar continuity
  },
  header: {
    height: 60,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#1E40AF',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,

  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },

  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
  },
  imageWrapper: {
    alignSelf: 'center',
    marginBottom: 30,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007BFF',
    width: 150,
    height: 150,
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  imageText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  editText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default UserProfileScreen;
