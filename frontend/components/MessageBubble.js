import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Animated, Easing, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animated wrapper for collapsible sections
const CollapsibleSection = ({ isExpanded, children }) => {
    const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const animatedOpacity = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(animatedHeight, {
                toValue: isExpanded ? 1 : 0,
                duration: 400,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design easing
                useNativeDriver: false,
            }),
            Animated.timing(animatedOpacity, {
                toValue: isExpanded ? 1 : 0,
                duration: 350,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: false,
            }),
        ]).start();
    }, [isExpanded, animatedHeight, animatedOpacity]);

    return (
        <Animated.View
            style={{
                opacity: animatedOpacity,
                maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500], // Max height for content
                }),
                overflow: 'hidden',
                transform: [{
                    translateY: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                    }),
                }],
            }}
        >
            {children}
        </Animated.View>
    );
};

// Animated chevron icon
const AnimatedChevron = ({ isExpanded, color }) => {
    const rotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotation, {
            toValue: isExpanded ? 1 : 0,
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();
    }, [isExpanded, rotation]);

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons name="chevron-down" size={20} color={color} />
        </Animated.View>
    );
};

const TechniqueCard = ({ technique, index }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 1000,
                delay: index * 100, // Stagger effect
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, scaleAnim, index]);

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: slideAnim,
                    transform: [
                        { scale: scaleAnim },
                        {
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{technique.title}</Text>
                <Text style={styles.cardCategory}>{technique.category}</Text>
            </View>
            <Text style={styles.cardContent}>{technique.content}</Text>
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Instructions:</Text>
                {technique.instructions.map((step, idx) => (
                    <View key={idx} style={styles.instructionRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.instructionText}>{step}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

const CrisisCard = ({ resource, index }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 1000,
                delay: index * 100,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, scaleAnim, index]);

    return (
        <Animated.View
            style={[
                styles.card,
                styles.crisisCard,
                {
                    opacity: slideAnim,
                    transform: [
                        { scale: scaleAnim },
                        {
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, styles.crisisTitle]}>{resource.name}</Text>
                <Text style={[styles.cardCategory, styles.crisisBadge]}>Crisis Support</Text>
            </View>
            <Text style={styles.cardContent}>{resource.description}</Text>
            <View style={styles.crisisDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📞 Phone:</Text>
                    <Text style={[styles.detailValue, styles.phoneText]}>{resource.phone || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>⏰ Hours:</Text>
                    <Text style={styles.detailValue}>{resource.available_hours}</Text>
                </View>
                {resource.website && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🌐 Website:</Text>
                        <Text style={[styles.detailValue, styles.linkText]}>{resource.website}</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

const QuoteCard = ({ quote, index }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 1000,
                delay: index * 100,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, scaleAnim, index]);

    return (
        <Animated.View
            style={[
                styles.card,
                styles.quoteCard,
                {
                    opacity: slideAnim,
                    transform: [
                        { scale: scaleAnim },
                        {
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.quoteText}>"{quote}"</Text>
        </Animated.View>
    );
};

const MessageBubble = ({ text, isUser, timestamp, techniques, crisis_resources, severity, quotes }) => {
    const [showTechniques, setShowTechniques] = useState(true);
    const [showQuotes, setShowQuotes] = useState(true);

    // Animation refs for main bubble
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Smooth entrance animation with multiple properties
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Ease out cubic
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, scaleAnim]);

    const toggleQuotes = () => {
        setShowQuotes(!showQuotes);
    };

    const toggleTechniques = () => {
        setShowTechniques(!showTechniques);
    };

    const renderCrisisResources = () => (
        !isUser && crisis_resources && crisis_resources.length > 0 && (
            <View style={styles.techniquesContainer}>
                <Text style={styles.sectionTitle}>⚠️ Emergency Resources</Text>
                <FlatList
                    data={crisis_resources}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `crisis-${index}`}
                    renderItem={({ item, index }) => <CrisisCard resource={item} index={index} />}
                    contentContainerStyle={styles.techniquesList}
                    snapToInterval={CARD_WIDTH + 16}
                    decelerationRate="fast"
                    snapToAlignment="start"
                />
            </View>
        )
    );

    const renderQuotes = () => (
        !isUser && quotes && quotes.length > 0 && (
            <View style={styles.techniquesContainer}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={toggleQuotes}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.sectionTitle, { color: '#8E44AD', marginBottom: 0 }]}>✨ Uplifting Thoughts</Text>
                    <AnimatedChevron isExpanded={showQuotes} color="#8E44AD" />
                </TouchableOpacity>

                <CollapsibleSection isExpanded={showQuotes}>
                    <FlatList
                        data={quotes}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => `quote-${index}`}
                        renderItem={({ item, index }) => <QuoteCard quote={item} index={index} />}
                        contentContainerStyle={styles.techniquesList}
                        snapToInterval={CARD_WIDTH + 16}
                        decelerationRate="fast"
                        snapToAlignment="start"
                    />
                </CollapsibleSection>
            </View>
        )
    );

    const renderTechniques = () => (
        !isUser && techniques && techniques.length > 0 && (
            <View style={styles.techniquesContainer}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={toggleTechniques}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>🧘 Try These to be Zen</Text>
                    <AnimatedChevron isExpanded={showTechniques} color="#E74C3C" />
                </TouchableOpacity>

                <CollapsibleSection isExpanded={showTechniques}>
                    <FlatList
                        data={techniques}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => <TechniqueCard technique={item} index={index} />}
                        contentContainerStyle={styles.techniquesList}
                        snapToInterval={CARD_WIDTH + 16}
                        decelerationRate="fast"
                        snapToAlignment="start"
                    />
                </CollapsibleSection>
            </View>
        )
    );

    const isCrisis = severity === 'CRISIS';
    const isHigh = severity === 'HIGH';
    const isModerate = severity === 'MODERATE';

    let bubbleColor = '#EED9C4';
    if (isCrisis) {
        bubbleColor = '#f5dfcdff';
    } else if (isHigh) {
        bubbleColor = '#e2d1e7';
    } else if (isModerate) {
        bubbleColor = '#c2d6f6';
    }

    const isSevere = isCrisis || isHigh;

    return (
        <Animated.View style={[
            styles.container,
            isUser ? styles.userContainer : styles.botContainer,
            {
                opacity: fadeAnim,
                transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                ],
            }
        ]}>
            <View style={[
                styles.bubble,
                isUser ? styles.userBubble : { backgroundColor: bubbleColor, borderBottomLeftRadius: 4 }
            ]}>
                <Text style={styles.text}>{text}</Text>
            </View>

            <Animated.Text style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.botTimestamp,
                { opacity: fadeAnim }
            ]}>{timestamp}</Animated.Text>

            {isSevere ? (
                <>
                    {renderCrisisResources()}
                    {renderQuotes()}
                    {renderTechniques()}
                </>
            ) : (
                <>
                    {renderTechniques()}
                    {renderCrisisResources()}
                </>
            )}

        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    botContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        padding: 16,
        borderRadius: 20,
        maxWidth: '85%',
    },
    userBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#A9D0F5',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        color: '#1E3A5F',
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 12,
        color: '#000000',
        marginTop: 6,
    },
    userTimestamp: {
        alignSelf: 'flex-end',
        textAlign: 'right',
    },
    botTimestamp: {
        alignSelf: 'flex-start',
        textAlign: 'left',
    },
    techniquesContainer: {
        marginTop: 12,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#E74C3C',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    techniquesList: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginRight: 16,
        width: CARD_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    crisisCard: {
        borderColor: '#FADBD8',
        backgroundColor: '#FEF9E7',
    },
    quoteCard: {
        backgroundColor: '#E8F8F5',
        borderColor: '#A3E4D7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quoteText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#16A085',
        textAlign: 'center',
        fontWeight: '500',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E3A5F',
        flex: 1,
        marginRight: 8,
    },
    crisisTitle: {
        color: '#C0392B',
    },
    cardCategory: {
        fontSize: 12,
        color: '#5D7A99',
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        textTransform: 'capitalize',
    },
    crisisBadge: {
        backgroundColor: '#FADBD8',
        color: '#C0392B',
    },
    cardContent: {
        fontSize: 14,
        color: '#4A6572',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    instructionsContainer: {
        backgroundColor: '#F8FBFE',
        padding: 12,
        borderRadius: 12,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3A5F',
        marginBottom: 8,
    },
    instructionRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'flex-start',
    },
    bulletPoint: {
        fontSize: 16,
        color: '#1E3A5F',
        marginRight: 8,
        marginTop: -2,
    },
    instructionText: {
        fontSize: 14,
        color: '#34495E',
        flex: 1,
        lineHeight: 20,
    },
    crisisDetails: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F5B7B1',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
        flexWrap: 'wrap',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#C0392B',
        marginRight: 6,
    },
    detailValue: {
        fontSize: 14,
        color: '#34495E',
        flex: 1,
    },
    phoneText: {
        fontWeight: 'bold',
        color: '#E74C3C',
    },
    linkText: {
        color: '#2980B9',
        textDecorationLine: 'underline',
    },
});

export default MessageBubble;
