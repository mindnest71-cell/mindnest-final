import React, { useMemo, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/theme-context';

const ChatInput = ({ onSend }) => {
    const [text, setText] = useState('');
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Message"
                    placeholderTextColor={colors.textMuted}
                    value={text}
                    onChangeText={setText}
                    multiline
                />
            </View>
            <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={!text.trim()}>
                <Ionicons
                    name="paper-plane-outline"
                    size={20}
                    color={text.trim() ? colors.icon : colors.iconMuted}
                />
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (colors) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 2,
            paddingVertical: 2,
            backgroundColor: 'transparent',
        },
        inputContainer: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 48,
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },
        input: {
            fontSize: 16,
            color: colors.text,
            maxHeight: 120,
            lineHeight: 20,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
        },
    });

export default ChatInput;
