import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SizeSelectorProps {
  extraId: string;
  selectedSize?: string;
  onSizeSelect: (size: string) => void;
  disabled?: boolean;
}

const SIZES = {
  'rash-guard': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'booties': ['6', '7', '8', '9', '10', '11', '12', '13']
};

export default function SizeSelector({ extraId, selectedSize, onSizeSelect, disabled = false }: SizeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  const needsSize = extraId === 'rash-guard' || extraId === 'booties';
  
  if (!needsSize) {
    return null;
  }
  
  const availableSizes = SIZES[extraId as keyof typeof SIZES] || [];
  
  const handleSizeSelect = (size: string) => {
    onSizeSelect(size);
    setModalVisible(false);
  };
  
  return (
    <>
      <Pressable
        style={[styles.sizeButton, disabled && styles.sizeButtonDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.sizeButtonText, disabled && styles.sizeButtonTextDisabled]}>
          {selectedSize ? `Size: ${selectedSize}` : 'Select Size'}
        </Text>
        <ChevronDown size={16} color={disabled ? '#ccc' : Colors.light.tint} />
      </Pressable>
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {extraId === 'rash-guard' ? 'Rash Guard' : 'Booties'} Size
            </Text>
            <View style={styles.sizesGrid}>
              {availableSizes.map((size) => (
                <Pressable
                  key={size}
                  style={[
                    styles.sizeOption,
                    selectedSize === size && styles.sizeOptionSelected
                  ]}
                  onPress={() => handleSizeSelect(size)}
                >
                  <Text style={[
                    styles.sizeOptionText,
                    selectedSize === size && styles.sizeOptionTextSelected
                  ]}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 6,
    marginTop: 4,
  },
  sizeButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  sizeButtonText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500' as const,
  },
  sizeButtonTextDisabled: {
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: 'white',
    minWidth: 50,
    alignItems: 'center',
  },
  sizeOptionSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  sizeOptionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  sizeOptionTextSelected: {
    color: 'white',
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500' as const,
  },
});