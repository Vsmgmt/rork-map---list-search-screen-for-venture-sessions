import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder: string;
  style?: any;
}

export default function DatePicker({ value, onDateChange, placeholder, style }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date value:', value);
          return new Date();
        }
        return date;
      } catch (error) {
        console.error('Error parsing date:', error);
        return new Date();
      }
    }
    return new Date();
  });

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      } catch (error) {
        console.error('Error updating date:', error);
      }
    }
  }, [value]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return placeholder;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('DatePicker onChange:', { eventType: event?.type, date });
    
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type !== 'dismissed') {
      try {
        if (isNaN(date.getTime())) {
          console.error('Invalid date received:', date);
          return;
        }
        setSelectedDate(date);
        const formattedDate = formatDate(date);
        onDateChange(formattedDate);
      } catch (error) {
        console.error('Error in handleDateChange:', error);
      }
    }
    
    if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const openPicker = () => {
    console.log('Opening date picker, current date:', selectedDate);
    try {
      setShowPicker(true);
    } catch (error) {
      console.error('Error opening picker:', error);
    }
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const handleDone = () => {
    const formattedDate = formatDate(selectedDate);
    onDateChange(formattedDate);
    closePicker();
  };

  return (
    <Pressable style={[styles.dateButton, style]} onPress={openPicker}>
      <Calendar size={16} color="#666" />
      <Text style={[styles.dateText, !value && styles.placeholderText]}>
        {formatDisplayDate(value)}
      </Text>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={closePicker}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={handleDone}>
                  <Text style={styles.doneButton}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.iosPicker}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date(2030, 11, 31)}
              />
            </View>
          </View>
        </Modal>
      ) : Platform.OS === 'web' ? (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={closePicker}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={handleDone}>
                  <Text style={styles.doneButton}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
                style={styles.webPicker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
          />
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 8,
    flex: 1,
    minWidth: 120,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
  webPicker: {
    height: 300,
    alignSelf: 'center',
    width: '100%',
  },
});