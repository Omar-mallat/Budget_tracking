import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import client from './src/api/client';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    // Push tokens only work on real devices
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Family Finance',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // uses app.json projectId in production
  });

  return tokenData.data;
}

function PushRegistrar() {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!user) return;

    // Register and save token to backend
    registerForPushNotifications()
      .then(token => {
        if (token) {
          client.put('/auth/push-token', { token }).catch(() => {});
        }
      })
      .catch(() => {});

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const body = notification.request.content.body;
      if (body) {
        Alert.alert('Family Finance', body);
      }
    });

    // Tap on notification listener — could navigate somewhere
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigation to /notifications could be added here via a ref
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <PushRegistrar />
      <AppNavigator />
    </AuthProvider>
  );
}
