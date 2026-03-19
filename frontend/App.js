import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import ChatScreen from './screens/ChatScreen';
import { ThemeProvider, useTheme } from './context/theme-context';

function AppContent() {
    const { colorScheme, colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <ChatScreen />
        </View>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
