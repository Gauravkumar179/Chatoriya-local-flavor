import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  getAuth,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { setUser } from './store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { getFirestore } from '@react-native-firebase/firestore';
import { saveUserName, saveUserRole } from './localStorage';  // Adjust path as needed


type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  BottomTabs: undefined;
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // // Save user in Redux (skip verification check)
      dispatch(
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email ?? '',
          displayName: userCredential.user.displayName ?? null,
        })
      );

      const uid = userCredential.user.uid;
      const db = getFirestore();

      // 🔹 Fetch user document from Firestore
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        Alert.alert('Error', 'User profile not found in database.');
        return;
      }

      const userData = userDoc.data();
      await saveUserRole(userData?.role?? 'No Role'); // or 'user', 'delivery'
      await saveUserName(userData?.displayName ?? ''); // Save user name


      // 🔹 Save user in Redux
      // dispatch(
      //   setUser({
      //     uid,
      //     email: userData?.email || '',
      //     displayName: userData?.displayName || '',
      //     role: userData?.role ||'',
      //   })
      // );


      // Navigate directly to BottomTabs
      navigation.reset({ index: 0, routes: [{ name: 'BottomTabs' }] });

    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <View style={{ marginVertical: 10 }}>
          <Button title="Login" onPress={handleLogin} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don’t have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  link: { marginTop: 15, textAlign: 'center', color: '#007bff', fontSize: 16 },
});


