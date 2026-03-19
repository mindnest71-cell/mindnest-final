import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  // --- State ---
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d;
  });

  const [showTimePicker, setShowTimePicker] = useState(false);

  const sessionOptions = useMemo(() => [5, 10, 15, 20], []);
  const [sessionLength, setSessionLength] = useState<number>(10);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // --- Helpers ---
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const onChangeTime = (_event: any, selectedDate?: Date) => {
    // Android: picker จะปิดเมื่อเลือก/ยกเลิก
    if (Platform.OS === 'android') setShowTimePicker(false);

    // ถ้ากดยกเลิก selectedDate จะเป็น undefined
    if (selectedDate) setReminderTime(selectedDate);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Make this space feel right for you</Text>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Jessica</Text>
              <Text style={styles.profileEmail}>jessica@email.com</Text>
            </View>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => {}}>
              <Text style={styles.ghostBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          {/* Daily Reminder */}
          <View style={styles.row}>
            <Text style={styles.label}>Daily Reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={(v) => setReminderEnabled(v)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Reminder Time */}
          <TouchableOpacity
            style={[styles.row, !reminderEnabled && { opacity: 0.5 }]}
            onPress={() => setShowTimePicker(true)}
            disabled={!reminderEnabled}
            activeOpacity={0.85}
          >
            <Text style={styles.label}>Reminder Time</Text>
            <Text style={styles.value}>{formatTime(reminderTime)}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Session Length */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowSessionModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.label}>Session Length</Text>
            <Text style={styles.value}>{sessionLength} min</Text>
          </TouchableOpacity>
        </View>

        {/* SOUND & MOOD (ตัวอย่าง) */}
        <Text style={styles.sectionTitle}>Sound & Mood</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Background Sound</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* ---- Time Picker ---- */}
        {showTimePicker && (
          <>
            {Platform.OS === 'ios' ? (
              // iOS: ทำเป็น modal-like area
              <Modal transparent animationType="fade" visible={showTimePicker}>
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Pressable style={styles.iosPickerSheet} onPress={() => {}}>
                    <Text style={styles.sheetTitle}>Select time</Text>
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display="spinner"
                      onChange={onChangeTime}
                      themeVariant="dark"
                    />
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => setShowTimePicker(false)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryBtnText}>Done</Text>
                    </TouchableOpacity>
                  </Pressable>
                </Pressable>
              </Modal>
            ) : (
              // Android: แสดง picker ตรง ๆ ได้เลย
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            )}
          </>
        )}

        {/* ---- Session Length Modal ---- */}
        <Modal transparent animationType="fade" visible={showSessionModal}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSessionModal(false)}
          >
            <Pressable style={styles.modal} onPress={() => {}}>
              <Text style={styles.modalTitle}>Session Length</Text>

              {sessionOptions.map((min) => {
                const active = min === sessionLength;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[styles.modalItem, active && styles.modalItemActive]}
                    onPress={() => {
                      setSessionLength(min);
                      setShowSessionModal(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.modalText, active && styles.modalTextActive]}>
                      {min} min
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 12 }]}
                onPress={() => setShowSessionModal(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1A5E' },
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#0A1A5E',
  },

  // Header (ให้ mood ใกล้ภาพที่คุณส่งมา)
  header: {
    height: 140,
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    overflow: 'hidden',
    backgroundColor: '#2A2FBF',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 14 },

  sectionTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#1B2E8A',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  value: { color: '#C7CEFF', fontSize: 16, fontWeight: '600' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  profileName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  ghostBtnText: { color: '#FFFFFF', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1B2E8A',
    borderRadius: 22,
    padding: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  modalItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modalText: { color: '#C7CEFF', fontSize: 16, fontWeight: '700' },
  modalTextActive: { color: '#FFFFFF' },

  primaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  iosPickerSheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1B2E8A',
    borderRadius: 22,
    padding: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
});
