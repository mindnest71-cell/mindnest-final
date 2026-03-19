import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

const getApiUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000/chat';
    }
    return 'http://localhost:8000/chat';
};

const API_URL = getApiUrl();

const ChatScreenContent = () => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: "Hello! I'm here to provide support. How are you feeling today?",
            isUser: false,
            techniques: [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
    ]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const sendMessage = async (text) => {
        const userMessage = {
            id: Date.now().toString(),
            text: text,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await axios.post(API_URL, { message: text });

            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: response.data.response,
                techniques: response.data.techniques,
                crisis_resources: response.data.crisis_resources,
                severity: response.data.severity,
                quotes: response.data.quotes,
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Please try again.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    // Calculate bottom padding - use safe area insets + extra gap
    const bottomPadding = Math.max(insets.bottom, 20) + 16;

    return (
        <View style={styles.container}>
            <ChatHeader />

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MessageBubble
                        text={item.text}
                        isUser={item.isUser}
                        timestamp={item.timestamp}
                        techniques={item.techniques}
                        crisis_resources={item.crisis_resources}
                        severity={item.severity}
                        quotes={item.quotes}
                    />
                )}
                contentContainerStyle={styles.messagesList}
                style={styles.list}
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1E3A5F" />
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                style={styles.inputWrapper}
            >
                <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
                    <ChatInput onSend={sendMessage} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const ChatScreen = () => {
    return (
        <SafeAreaProvider>
            <ChatScreenContent />
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D6EAF8',
    },
    list: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    loadingContainer: {
        padding: 10,
        alignItems: 'center',
    },
    inputWrapper: {
        backgroundColor: '#D6EAF8',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: '#D6EAF8',
    },
});

export default ChatScreen;