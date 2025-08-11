import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Button,
  Platform,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Simple Dropdown Component for roles
const RoleDropdown = ({
  role,
  onChange,
  disabled,
}: {
  role: string;
  onChange: (role: string) => void;
  disabled: boolean;
}) => {
  const roles = ['user', 'admin', 'delivery'];
  return (
    <View style={[styles.dropdownContainer, disabled && { opacity: 0.5 }]}>
      {roles.map(r => (
        <TouchableOpacity
          key={r}
          disabled={disabled}
          style={[styles.roleOption, r === role && styles.selectedRoleOption]}
          onPress={() => onChange(r)}
        >
          <Text style={r === role ? styles.selectedRoleText : styles.roleText}>{r}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const UsersScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
    const navigation = useNavigation<NavigationProp>();

  // Current logged-in user's role (assume fetched separately)
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');

   useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitleAlign: 'center',
      headerTitle: 'User Managemaent',
      headerStyle: { backgroundColor: '#2e86de' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
    });
  }, [navigation]);

  useEffect(() => {
    const currentUid = auth().currentUser?.uid;
    if (currentUid) {
      firestore()
        .collection('users')
        .doc(currentUid)
        .get()
        .then(doc => {
          if (doc.exists()) {
            setCurrentUserRole(doc.data()?.role || 'user');
          }
        });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(
        snapshot => {
          const fetchedUsers = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
          }));
          setUsers(fetchedUsers);
          setLoading(false);
        },
        error => {
          Alert.alert('Error fetching users', error.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const saveUser = async () => {
    if (!selectedUser) return;

    if (!selectedUser.displayName || !selectedUser.email) {
      Alert.alert('Please fill all required fields');
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(selectedUser.uid)
        .update({
          displayName: selectedUser.displayName,
          email: selectedUser.email,
          role: selectedUser.role,
        });
      Alert.alert('Success', 'User details updated');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => openEditModal(item)}>
      <Text style={styles.userName}>{item.displayName || 'No Name'}</Text>
      <Text style={styles.userEmail}>{item.email || '-'}</Text>
      <Text style={styles.userRole}>Role: {item.role || 'user'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Users Management</Text>
      </View> */}

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={item => item.uid}
        renderItem={renderUserItem}
        contentContainerStyle={styles.container}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update User</Text>

            <Text>Name:</Text>
            <TextInput
              style={styles.input}
              value={selectedUser?.displayName}
              onChangeText={text => setSelectedUser((prev: any) => ({ ...prev, displayName: text }))}
              placeholder="Enter name"
              placeholderTextColor="#999"
            />

            <Text>Email:</Text>
            <TextInput
              style={styles.input}
              value={selectedUser?.email}
              onChangeText={text => setSelectedUser((prev: any) => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email"
              placeholderTextColor="#999"
            />

            <Text>Role:</Text>
            <RoleDropdown
              role={selectedUser?.role || 'user'}
              onChange={role => setSelectedUser((prev: any) => ({ ...prev, role }))}
              disabled={currentUserRole !== 'admin'}
            />
            {currentUserRole !== 'admin' && (
              <Text style={styles.adminNote}>Only admins can change roles</Text>
            )}

            <View style={styles.modalButtons}>
              <Button title="Cancel" color="#999" onPress={() => setModalVisible(false)} />
              <Button title="Save" onPress={saveUser} color="#007BFF" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 60,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  userItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
    color: '#007BFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    marginBottom: 18,
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRoleOption: {
    backgroundColor: '#007BFF',
  },
  roleText: {
    color: '#007BFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectedRoleText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  adminNote: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UsersScreen;
