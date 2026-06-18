import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { colors, fonts } from '../../constants/theme';
import { CategoryChips } from './CategoryChips';
import { categoryLabel, type PantryCategoryId } from '../../constants/scanCategories';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function parseDisplayDate(display: string): string | null {
  const match = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const dd = match[1].padStart(2, '0');
  const mm = match[2].padStart(2, '0');
  const yyyy = match[3];
  return `${yyyy}-${mm}-${dd}`;
}

export interface ConfirmFormValues {
  name: string;
  brand: string;
  category: PantryCategoryId | '';
  quantity: string;
  expiryDate: string;
  barcode: string;
}

interface ConfirmFormProps {
  values: ConfirmFormValues;
  onChange: (patch: Partial<ConfirmFormValues>) => void;
  onSubmit: () => void;
  fieldErrors: { name?: string; expiryDate?: string };
  undetectedFields: Set<string>;
  isFresh?: boolean;
  isManual?: boolean;
  isSubmitting?: boolean;
  expiryHelperText?: string | null;
  showExpiryAdjuster?: boolean;
  expiryAdjustment?: number;
  onExpiryAdjustmentChange?: (delta: number) => void;
  hideSubmit?: boolean;
  submitLabel?: string;
  fieldsOnly?: 'all' | 'expiry';
}

function fieldHasUndetected(key: string, undetected: Set<string>): boolean {
  return undetected.has(key);
}

export function ConfirmForm({
  values,
  onChange,
  onSubmit,
  fieldErrors,
  undetectedFields,
  isFresh = false,
  isManual = false,
  isSubmitting = false,
  expiryHelperText,
  showExpiryAdjuster = false,
  expiryAdjustment = 0,
  onExpiryAdjustmentChange,
  hideSubmit = false,
  submitLabel = 'Add to pantry',
  fieldsOnly = 'all',
}: ConfirmFormProps) {
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [expiryInput, setExpiryInput] = useState(formatDisplayDate(values.expiryDate));
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setExpiryInput(formatDisplayDate(values.expiryDate));
  }, [values.expiryDate]);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const inputStyle = (key: string) => [
    styles.input,
    fieldHasUndetected(key, undetectedFields) && styles.inputUndetected,
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {fieldsOnly === 'all' && (
        <>
          <Field label="ITEM NAME">
            <TextInput
              style={inputStyle('name')}
              value={values.name}
              onChangeText={(t) => onChange({ name: t })}
              placeholder="e.g. Amul Milk"
              placeholderTextColor={colors.textGrey}
            />
            {fieldErrors.name != null && <Text style={styles.error}>{fieldErrors.name}</Text>}
          </Field>

          {!isManual && (
            <Field label="BRAND">
              <TextInput
                style={inputStyle('brand')}
                value={values.brand}
                onChangeText={(t) => onChange({ brand: t })}
                placeholder="Brand (optional)"
                placeholderTextColor={colors.textGrey}
              />
            </Field>
          )}

          <Field label="CATEGORY">
            <CategoryChips
              value={values.category}
              onChange={(id) => onChange({ category: id })}
              hasError={fieldHasUndetected('category', undetectedFields)}
            />
          </Field>

          <Field label="QUANTITY">
            {isManual ? (
              <View style={styles.quantityRow}>
                <TextInput
                  style={[inputStyle('quantity'), styles.quantityInput]}
                  value={values.quantity}
                  onChangeText={(t) => onChange({ quantity: t })}
                  placeholder="500"
                  placeholderTextColor={colors.textGrey}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  placeholder="g / L / units"
                  placeholderTextColor={colors.textGrey}
                />
              </View>
            ) : (
              <TextInput
                style={inputStyle('quantity')}
                value={values.quantity}
                onChangeText={(t) => onChange({ quantity: t })}
                placeholder="e.g. 1L, 500g"
                placeholderTextColor={colors.textGrey}
              />
            )}
          </Field>
        </>
      )}

      <Field label="EXPIRY DATE">
        {showExpiryAdjuster && onExpiryAdjustmentChange != null ? (
          <View>
            {expiryHelperText != null && (
              <Text style={styles.helper}>{expiryHelperText}</Text>
            )}
            <View style={styles.adjusterRow}>
              <TouchableOpacity
                style={styles.adjBtn}
                onPress={() => onExpiryAdjustmentChange(expiryAdjustment - 1)}
              >
                <Text style={styles.adjBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.adjDate}>
                {values.expiryDate.length > 0
                  ? formatDisplayDate(values.expiryDate)
                  : '—'}
              </Text>
              <TouchableOpacity
                style={styles.adjBtn}
                onPress={() => onExpiryAdjustmentChange(expiryAdjustment + 1)}
              >
                <Text style={styles.adjBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {isFresh && (
              <Text style={styles.freshHint}>
                Based on typical shelf life · Adjust if needed
              </Text>
            )}
          </View>
        ) : (
          <TextInput
            style={inputStyle('expiry_date')}
            value={expiryInput}
            onChangeText={(t) => {
              setExpiryInput(t);
              if (t === '') {
                onChange({ expiryDate: '' });
                return;
              }
              const iso = parseDisplayDate(t);
              if (iso != null) {
                onChange({ expiryDate: iso });
              }
            }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textGrey}
            autoCapitalize="none"
          />
        )}
        {fieldErrors.expiryDate != null && (
          <Text style={styles.error}>{fieldErrors.expiryDate}</Text>
        )}
        {isFresh && !showExpiryAdjuster && (
          <Text style={styles.freshHint}>
            Based on typical shelf life · Adjust if needed
          </Text>
        )}
      </Field>

      {isManual && (
        <>
          <TouchableOpacity onPress={() => setBarcodeOpen((v) => !v)}>
            <Text style={styles.barcodeToggle}>
              {barcodeOpen ? 'Hide barcode' : '+ Add barcode (optional)'}
            </Text>
          </TouchableOpacity>
          {barcodeOpen && (
            <Field label="BARCODE">
              <TextInput
                style={styles.input}
                value={values.barcode}
                onChangeText={(t) => onChange({ barcode: t })}
                placeholder="Optional barcode"
                placeholderTextColor={colors.textGrey}
              />
            </Field>
          )}
        </>
      )}

      {!hideSubmit && (
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[styles.submit, isSubmitting && styles.submitDisabled]}
            onPress={onSubmit}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Adding…' : submitLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {values.category !== '' && (
        <Text style={styles.meta}>
          Category: {categoryLabel(values.category)}
        </Text>
      )}
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.04 * 11,
    textTransform: 'uppercase',
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  inputUndetected: {
    borderBottomWidth: 2,
    borderBottomColor: colors.red,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  error: {
    fontSize: 12,
    color: colors.red,
    fontFamily: fonts.body,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginBottom: 12,
    lineHeight: 18,
  },
  freshHint: {
    fontSize: 11,
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginTop: 8,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  adjBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjBtnText: {
    fontSize: 24,
    color: colors.teal,
    fontWeight: '500',
  },
  adjDate: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },
  barcodeToggle: {
    fontSize: 13,
    color: colors.teal,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: 12,
  },
  submit: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
  meta: {
    fontSize: 11,
    color: colors.textGrey,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: fonts.body,
  },
});

export default ConfirmForm;
