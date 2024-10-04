import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../Firebase'; 
import { collection, onSnapshot, addDoc, orderBy, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState(''); 
  const [emailInputVisible, setEmailInputVisible] = useState(false); 
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle user authentication and set user info
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.email); // Store the current user's email
      } else {
        navigation.navigate('Login'); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  useEffect(() => {
    if (chatVisible) {
      // Fetch messages from Firestore and listen for updates
      const messagesQuery = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(loadedMessages);
      });

      // Clean up listener on component unmount
      return () => unsubscribeMessages();
    }
  }, [chatVisible]);

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate('Login');
  };

  const handleChat = () => {
    setChatVisible(true);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() || selectedFile) {
      const messageObj = {
        text: newMessage,
        sender: currentUser,  // Use current user's email as sender
        timestamp: Date.now(),
      };

      // Upload file if one is selected
      if (selectedFile) {
        const storage = getStorage();
        const fileRef = ref(storage, `attachments/${selectedFile.name}`);
        
        try {
          await uploadBytes(fileRef, selectedFile);
          const attachmentUrl = await getDownloadURL(fileRef); // Get the download URL
          messageObj.attachmentUrl = attachmentUrl; // Add URL to message object
        } catch (error) {
          console.error('Error uploading file:', error);
          alert('Failed to upload file:', error.message);
          return; // Exit the function if file upload fails
        }
      }

      await addDoc(collection(db, 'messages'), messageObj);
      setNewMessage('');
      setSelectedFile(null); // Reset file input after sending
    }
  };

  const handleBack = () => {
    setChatVisible(false);
  };

  // Function to send SMS using Twilio
  const handleSendSMS = async () => {
    const accountSid = 'ACd6a51b1c9f2b7b492af919ab595efcb4'; // Replace with your Twilio account SID
    const authToken = '5e9d378c1760b83502c01ebc59d4deb5';   // Replace with your Twilio auth token
    const from = '+18154271731';    // Replace with your Twilio phone number
    const to = '+639652719298';  // Replace with the recipient's phone number
    const message = 'Hello, this is a test SMS!';
  
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
    const body = new URLSearchParams({
      Body: message,
      From: from,
      To: to,
    });
  
    const headers = {
      Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`), // Basic auth encoding
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body.toString(),
      });
  
      const data = await response.json();
      console.log('SMS sent:', data);
      alert('Message sent with SID: ' + data.sid);
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS: ' + error.message);
    }
  };

  // Function to make a call using Twilio
  const handleMakeCall = async () => {
    const accountSid = 'ACd6a51b1c9f2b7b492af919ab595efcb4'; // Replace with your Twilio account SID
    const authToken = '5e9d378c1760b83502c01ebc59d4deb5';   // Replace with your Twilio auth token
    const from = '+18154271731';    // Replace with your Twilio phone number
    const to = '+639652719298';  // Replace with the recipient's phone number

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

    const body = new URLSearchParams({
      From: from,
      To: to,
      Url: 'http://demo.twilio.com/docs/voice.xml',  // Twilio-hosted URL for call instructions
    });

    const headers = {
      Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body.toString(),
      });

      const data = await response.json();
      console.log('Call initiated:', data);
      alert('Call initiated with SID: ' + data.sid);
    } catch (error) {
      console.error('Error making call:', error);
      alert('Failed to make call: ' + error.message);
    }
  };

  // Function to send email using Mailgun
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]); // Get the selected file
  };

  const handleSendEmail = async () => {
    const apiKey = 'aac6ac24e03d1af2822846eadd9077f5-3724298e-c31041e8'; 
    const domain = 'sandbox5b2462e20fef4ae8a40bf65281c82b11.mailgun.org'; 
    const fromEmail = 'tristan@sandbox5b2462e20fef4ae8a40bf65281c82b11.mailgun.org'; 
    const toEmail = recipientEmail; 
    const subject = 'Test Email from My App'; 
    const text = 'Hello, this is a test email sent using Mailgun!'; 
    let attachmentUrl = null;

    // Upload the file to Firebase Storage
    if (selectedFile) {
      const storage = getStorage();
      const fileRef = ref(storage, `attachments/${selectedFile.name}`);
      
      try {
        await uploadBytes(fileRef, selectedFile);
        attachmentUrl = await getDownloadURL(fileRef); // Get the download URL
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file:', error.message);
        return; // Exit the function if file upload fails
      }
    } else {
      Alert.alert("No file selected", "Please select a file to attach.");
      return; // Exit if no file is selected
    }

    const url = `https://api.mailgun.net/v3/${domain}/messages`;
    const headers = {
      Authorization: 'Basic ' + btoa(`api:${apiKey}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = new URLSearchParams({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      text: `${text}\n\nYou can download the file here: ${attachmentUrl}`, // Include file download URL
    });

    try {
      const response = await axios.post(url, body.toString(), { headers });
      console.log('Email sent:', response.data);
      alert('Email sent!', `Email sent to ${toEmail}`);
      setRecipientEmail('');
      setSelectedFile(null); // Reset file input
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email:', error.message);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.featureContainer}>
            <TouchableOpacity style={styles.featureButton} onPress={handleChat}>
              <Text style={styles.featureText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureButton} onPress={handleMakeCall}>
              <Text style={styles.featureText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureButton} onPress={() => { setEmailInputVisible(!emailInputVisible); }}>
              <Text style={styles.featureText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureButton} onPress={handleSendSMS}>
              <Text style={styles.featureText}>SMS</Text>
            </TouchableOpacity>
          </View>
        </View>
        {currentUser && (
          <Text style={styles.userInfo}>Logged in as: {currentUser}</Text>
        )}
        {emailInputVisible && (
          <>
            <TextInput
              style={styles.recipientInput}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="Recipient Email"
            />
            <input
              type="file"
              onChange={handleFileChange} // File input to select files
            />
            <TouchableOpacity style={styles.sendEmailButton} onPress={handleSendEmail}>
              <Text style={styles.sendEmailButtonText}>Send Email</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.title}>WELCOME TO MY OMNI-CHANNEL COMMUNICATION APP!</Text>
        {chatVisible && (
          <View style={styles.chatContainer}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={messages}
              renderItem={({ item }) => (
                <View style={item.sender === currentUser ? styles.youMessage : styles.otherMessage}>
                  <Text style={styles.messageText}>{item.text}</Text>
                  {/* Check if the message has an attachment */}
                  {item.attachmentUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.attachmentUrl)}>
                      <Text style={styles.attachmentText}>Download Attachment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
            />
            <KeyboardAvoidingView style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={(text) => setNewMessage(text)}
                placeholder="Type a message..."
              />
              <input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files[0])} 
              />
              <TouchableOpacity onPress={handleSendMessage}>
                <Text style={styles.sendButton}>Send</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6347',
    padding: 10,
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  featureContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  featureButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  featureText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    marginTop: 20,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  chatContainer: {
    flex: 1,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: 'red',
    alignSelf: 'flex-start',

  },
  backButtonText: {
    fontSize: 18,
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    color: '#fff',
  },
  youMessage: {
    backgroundColor: '#d1e7dd',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginVertical: 5,
  },
  otherMessage: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginVertical: 5,
  },
  messageText: {
    fontSize: 16,
  },
  recipientInput: {
    width: '100%',  
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    height: 50, 
  },
  attachmentText: {
    color: '#007bff',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  sendEmailButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  sendEmailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
