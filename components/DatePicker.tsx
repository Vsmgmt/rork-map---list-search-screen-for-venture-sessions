import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder: string;
  style?: any;
}

export default function DatePicker({ value, onDateChange, placeholder, style }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  const getValidDate = (dateValue: string): Date => {
    if (!dateValue) return new Date();
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return new Date();
      }
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  };
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => getValidDate(value));

  useEffect(() => {
    if (value) {
      const date = getValidDate(value);
      setSelectedDate(date);
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
    
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    
    if (date) {
      try {
        if (isNaN(date.getTime())) {
          console.error('Invalid date received:', date);
          return;
        }
        setSelectedDate(date);
        const formattedDate = formatDate(date);
        console.log('Setting date to:', formattedDate);
        onDateChange(formattedDate);
      } catch (error) {
        console.error('Error in handleDateChange:', error);
        Alert.alert('Error', 'Failed to set date. Please try again.');
      }
    }
  };

  const openPicker = () => {
    console.log('Opening date picker, current date:', selectedDate);
    try {
      const currentDate = value ? getValidDate(value) : new Date();
      setSelectedDate(currentDate);
      setShowPicker(true);
    } catch (error) {
      console.error('Error opening picker:', error);
      Alert.alert('Error', 'Failed to open date picker. Please try again.');
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
    <>
      <Pressable style={[styles.dateButton, style]} onPress={openPicker}>
        <Calendar size={16} color="#666" />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {formatDisplayDate(value)}
        </Text>
      </Pressable>

      {(Platform.OS === 'ios' || Platform.OS === 'web') ? (
        showPicker && (
          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={closePicker}
          >
            <Pressable style={styles.modalOverlay} onPress={closePicker}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={closePicker}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <Pressable onPress={handleDone}>
                    <Text style={styles.doneButton}>Done</Text>
                  </Pressable>
                </View>
                {Platform.OS === 'web' ? (
                  <WebDatePicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                ) : (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    style={styles.iosPicker}
                    minimumDate={new Date(2020, 0, 1)}
                    maximumDate={new Date(2030, 11, 31)}
                  />
                )}
              </Pressable>
            </Pressable>
          </Modal>
        )
      ) : (
        showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
            minimumDate={new Date(2020, 0, 1)}
            maximumDate={new Date(2030, 11, 31)}
          />
        )
      )}
    </>
  );
}

function WebDatePicker({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        day === selectedDate.getDate() &&
        currentMonth === selectedDate.getMonth() &&
        currentYear === selectedDate.getFullYear();

      days.push(
        <Pressable
          key={day}
          style={[styles.calendarDay, isSelected && styles.selectedDay]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.selectedDayText]}>
            {day}
          </Text>
        </Pressable>
      );
    }

    return days;
  };

  return (
    <View style={styles.webCalendar}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={handlePrevMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#007AFF" />
        </Pressable>
        <Text style={styles.calendarHeaderText}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#007AFF" />
        </Pressable>
      </View>

      <View style={styles.weekDaysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
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
  webDateInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  webCalendar: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  navButton: {
    padding: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600' as const,
  },
  webTimePicker: {
    padding: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  timeColumn: {
    maxHeight: 200,
    overflow: 'scroll' as any,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  timeItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTimeItem: {
    backgroundColor: '#007AFF',
  },
  timeItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeItemText: {
    color: 'white',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
} as const);

export function TimePicker({ value, onTimeChange, placeholder, style }: {
  value: string;
  onTimeChange: (time: string) => void;
  placeholder: string;
  style?: any;
}) {
  const [showPicker, setShowPicker] = useState(false);
  
  const getValidDate = (timeValue: string): Date => {
    if (!timeValue) return new Date();
    try {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const date = new Date();
      date.setHours(hours || 0, minutes || 0, 0, 0);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch {
      return new Date();
    }
  };
  
  const [selectedTime, setSelectedTime] = useState<Date>(() => getValidDate(value));

  useEffect(() => {
    if (value) {
      const time = getValidDate(value);
      setSelectedTime(time);
    }
  }, [value]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return placeholder;
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const isPM = hours >= 12;
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
    } catch {
      return placeholder;
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    
    if (time) {
      setSelectedTime(time);
      const formattedTime = formatTime(time);
      onTimeChange(formattedTime);
    }
  };

  const openPicker = () => {
    const currentTime = value ? getValidDate(value) : new Date();
    setSelectedTime(currentTime);
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const handleDone = () => {
    const formattedTime = formatTime(selectedTime);
    onTimeChange(formattedTime);
    closePicker();
  };

  return (
    <>
      <Pressable style={[styles.dateButton, style]} onPress={openPicker}>
        <Calendar size={16} color="#666" />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {formatDisplayTime(value)}
        </Text>
      </Pressable>

      {(Platform.OS === 'ios' || Platform.OS === 'web') ? (
        showPicker && (
          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={closePicker}
          >
            <Pressable style={styles.modalOverlay} onPress={closePicker}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={closePicker}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <Pressable onPress={handleDone}>
                    <Text style={styles.doneButton}>Done</Text>
                  </Pressable>
                </View>
                {Platform.OS === 'web' ? (
                  <WebTimePicker
                    selectedTime={selectedTime}
                    onTimeSelect={setSelectedTime}
                  />
                ) : (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={styles.iosPicker}
                  />
                )}
              </Pressable>
            </Pressable>
          </Modal>
        )
      ) : (
        showPicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="clock"
            onChange={handleTimeChange}
          />
        )
      )}
    </>
  );
}

function WebTimePicker({
  selectedTime,
  onTimeSelect,
}: {
  selectedTime: Date;
  onTimeSelect: (time: Date) => void;
}) {
  const [hours, setHours] = useState(selectedTime.getHours());
  const [minutes, setMinutes] = useState(selectedTime.getMinutes());

  useEffect(() => {
    const newTime = new Date();
    newTime.setHours(hours, minutes);
    onTimeSelect(newTime);
  }, [hours, minutes, onTimeSelect]);

  const renderTimeColumn = (max: number, current: number, onChange: (val: number) => void) => {
    const items = Array.from({ length: max }, (_, i) => i);
    return (
      <View style={styles.timeColumn}>
        {items.map((i) => (
          <Pressable
            key={i}
            style={[styles.timeItem, current === i && styles.selectedTimeItem]}
            onPress={() => onChange(i)}
          >
            <Text style={[styles.timeItemText, current === i && styles.selectedTimeItemText]}>
              {i.toString().padStart(2, '0')}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.webTimePicker}>
      <View style={styles.timePickerRow}>
        {renderTimeColumn(24, hours, setHours)}
        <Text style={styles.timeSeparator}>:</Text>
        {renderTimeColumn(60, minutes, setMinutes)}
      </View>
    </View>
  );
}