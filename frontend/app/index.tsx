import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        try {
            const user_id = await AsyncStorage.getItem('user_id');
            if (user_id) {
                setIsLoggedIn(true);
            }
        } catch (e) {
            console.log("Auth check failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // If logged in -> Home, else -> Login
    return <Redirect href={isLoggedIn ? "/home" : "/login"} />;
}
