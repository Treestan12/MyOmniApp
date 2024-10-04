import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../Firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'; 
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { initializeApp } from 'firebase/app';

// Firebase configuration for web
const firebaseConfig = {
  apiKey: "AIzaSyApe6BPGhGhYtvROboSjRn3Zy_d19Ix8nM",
  authDomain: "thesis-bcc4a.firebaseapp.com",
  projectId: "thesis-bcc4a",
  storageBucket: "thesis-bcc4a.appspot.com",
  messagingSenderId: "387189396419",
  appId: "1:387189396419:web:93c5c67b7d4b7e68176376",
  measurementId: "G-NJ6ZFY2ZCQ"
};

// Initialize Firebase for web
if (Platform.OS === 'web') {
  initializeApp(firebaseConfig);
}

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: '387189396419-dcf6qq662v13nh09f666db07ks7a04t9.apps.googleusercontent.com',
      });
    }
  }, []);

  const handleSignUp = async () => {
    if (username && password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, username, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          username: username,
        });
        Alert.alert('User created successfully!');
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error creating user:', error);
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleLogin = async () => {
    if (username && password) {
      try {
        await signInWithEmailAndPassword(auth, username, password);
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error logging in:', error);
        Alert.alert('Invalid Credentials', error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Google Access Token
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // Signed-in user info
        const user = result.user;
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error signing in with Google:', error);
        Alert.alert('Error', error.message);
      }
    } else {
      try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
        await signInWithCredential(auth, googleCredential);
        navigation.navigate('Home');
      } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          Alert.alert('Sign-In Cancelled');
        } else if (error.code === statusCodes.IN_PROGRESS) {
          Alert.alert('Sign-In in Progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Play Services not available');
        } else {
          console.error('Error signing in with Google:', error);
          Alert.alert('Error', error.message);
        }
      }
    }
  };

  return (
    <ImageBackground source={require('../assets/commu.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#000000"
          onChangeText={(text) => setUsername(text)}
          value={username}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000000"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={isSignUp ? handleSignUp : handleLogin}>
          <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Login"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.switchText} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.buttonText}>Sign In with Google</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'null',
    height: 'null',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    color: '#000000',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    width: '70%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  switchText: {
    color: 'black',
    fontSize: 16,
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
  googleButton: {
    backgroundColor: '#db3236',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
});

export default LoginScreen;
