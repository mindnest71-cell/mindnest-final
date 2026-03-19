import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';

import { useTheme } from '../context/theme-context';

export default function EditProfile() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // เก็บค่าเดิมไว้เช็คว่าเปลี่ยนหรือยัง
  const [initial, setInitial] = useState({ name: '', email: '', avatarUri: '' });

  const isDirty = useMemo(() => {
    return (
      name.trim() !== initial.name.trim()
      || email.trim() !== initial.email.trim()
      || (avatarUri || '') !== initial.avatarUri
    );
  }, [name, email, initial, avatarUri]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 1) ลองดึงจาก API ก่อน (ถ้าคุณมี endpoint)
        // ปรับ endpoint ได้ตาม backend ของคุณ
        try {
          const res = await api.get('/auth/me');
          const apiName = res?.data?.name ?? '';
          const apiEmail = res?.data?.email ?? '';
          const storedAvatar = (await AsyncStorage.getItem('user_avatar')) || '';
          setName(apiName);
          setEmail(apiEmail);
          setAvatarUri(storedAvatar || null);
          setInitial({ name: apiName, email: apiEmail, avatarUri: storedAvatar });
        } catch {
          // 2) fallback จาก AsyncStorage (เผื่อยังไม่มี /auth/me)
          const storedName = (await AsyncStorage.getItem('user_name')) || '';
          const storedEmail = (await AsyncStorage.getItem('user_email')) || '';
          const storedAvatar = (await AsyncStorage.getItem('user_avatar')) || '';
          setName(storedName);
          setEmail(storedEmail);
          setAvatarUri(storedAvatar || null);
          setInitial({ name: storedName, email: storedEmail, avatarUri: storedAvatar });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in name and email.');
      return;
    }

    setSaving(true);
    try {
      // ✅ ถ้ามี backend รองรับ อัปเดตที่นี่
      // ปรับ endpoint ได้ตาม backend ของคุณ
      await api.put('/auth/me', { name: name.trim(), email: email.trim() });

      // ✅ sync ลง storage เพื่อให้หน้าอื่นใช้ได้ทันที
      await AsyncStorage.setItem('user_name', name.trim());
      await AsyncStorage.setItem('user_email', email.trim());
      if (avatarUri) {
        await AsyncStorage.setItem('user_avatar', avatarUri);
      } else {
        await AsyncStorage.removeItem('user_avatar');
      }

      setInitial({ name: name.trim(), email: email.trim(), avatarUri: avatarUri || '' });

      Alert.alert('Success', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      console.log('Update profile error:', e?.response || e);
      const msg = e?.response?.data?.detail || 'Failed to update profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert('Discard changes?', 'You have unsaved changes.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  };

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow photo access to update your profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Pick avatar error:', error);
      Alert.alert('Error', 'Unable to select an image right now.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.icon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Profile card */}
            <View style={styles.card}>
              <View style={styles.avatarRow}>
                <TouchableOpacity style={styles.avatar} onPress={handlePickAvatar} activeOpacity={0.85}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <MaterialCommunityIcons name="account" size={22} color={colors.icon} />
                  )}
                  <View style={styles.avatarBadge}>
                    <MaterialCommunityIcons name="camera" size={12} color={colors.textOnPrimary} />
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Your profile</Text>
                  <Text style={styles.subTitle}>Keep your info up to date</Text>
                </View>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handlePickAvatar}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="camera-outline" size={16} color={colors.text} />
                  <Text style={styles.changePhotoText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.iconMuted} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>

              {/* Email */}
              <Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.iconMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, (!isDirty || saving) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={!isDirty || saving}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.saveText}>Save changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Small helper */}
            <Text style={styles.helper}>
              Tip: This info will be used to personalize your experience in MindNest.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginHorizontal: 18,
      marginTop: 12,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.2,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    content: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 10,
    },

    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    title: { color: colors.text, fontWeight: '900', fontSize: 16 },
    subTitle: { color: colors.textMuted, fontWeight: '700', marginTop: 2, fontSize: 12 },

    changePhotoBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    changePhotoText: { color: colors.text, fontWeight: '800', fontSize: 12 },

    label: { color: colors.textMuted, fontWeight: '800', fontSize: 12, marginLeft: 4, marginBottom: 8 },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 },

    saveBtn: {
      marginTop: 18,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primaryDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    saveText: { color: colors.textOnPrimary, fontWeight: '900', fontSize: 14 },

    helper: {
      marginTop: 14,
      textAlign: 'center',
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 12,
    },
  });
