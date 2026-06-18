import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../constants/theme';
import CameraStep from '../../components/scan/CameraStep';
import LoadingOverlay from '../../components/scan/LoadingOverlay';
import ConfirmForm, { type ConfirmFormValues } from '../../components/scan/ConfirmForm';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useVisionScan } from '../../hooks/useVisionScan';
import { useAddPantryItem } from '../../hooks/useAddPantryItem';
import type { ItemType } from '../../hooks/useVisionScan';
import {
  STORAGE_CHIPS,
  lookupShelfLifeDays,
  addDaysToToday,
  adjustIsoDate,
  type FreshStorageLocation,
} from '../../constants/shelfLife';
type EntryMode = 'scan' | 'manual';

type PackagedStep = 'front' | 'back' | 'confirm';
type FreshStep = 'photo' | 'storage' | 'expiry' | 'confirm';

const EMPTY_FORM: ConfirmFormValues = {
  name: '',
  brand: '',
  category: '',
  quantity: '',
  expiryDate: '',
  barcode: '',
};

export default function ScanScreen() {
  const router = useRouter();
  const { scanFront, scanBack, isScanning } = useVisionScan();
  const addMutation = useAddPantryItem();

  const [mode, setMode] = useState<EntryMode>('scan');
  const [branch, setBranch] = useState<ItemType | null>(null);
  const [packagedStep, setPackagedStep] = useState<PackagedStep>('front');
  const [freshStep, setFreshStep] = useState<FreshStep>('photo');

  const [frontThumbUri, setFrontThumbUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [undetectedFields, setUndetectedFields] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<ConfirmFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; expiryDate?: string }>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [freshStorage, setFreshStorage] = useState<FreshStorageLocation | null>(null);
  const [expiryBaseDate, setExpiryBaseDate] = useState('');
  const [expiryAdjustment, setExpiryAdjustment] = useState(0);
  const [expiryHelperText, setExpiryHelperText] = useState<string | null>(null);
  const [scanFailed, setScanFailed] = useState(false);

  const loading = isProcessing || isScanning;

  const patchForm = useCallback((patch: Partial<ConfirmFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (patch.name != null) {
      setFieldErrors((e) => ({ ...e, name: undefined }));
    }
    if (patch.expiryDate != null) {
      setFieldErrors((e) => ({ ...e, expiryDate: undefined }));
    }
  }, []);

  const resetScanFlow = useCallback(() => {
    setBranch(null);
    setPackagedStep('front');
    setFreshStep('photo');
    setFrontThumbUri(null);
    setUndetectedFields(new Set());
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFreshStorage(null);
    setExpiryBaseDate('');
    setExpiryAdjustment(0);
    setExpiryHelperText(null);
  }, []);

  const applyFrontResult = useCallback(
    (
      result: Awaited<ReturnType<typeof scanFront>>,
      itemType: ItemType,
    ) => {
      const undetected = new Set(result.undetected);
      setUndetectedFields(undetected);
      setForm((prev) => ({
        ...prev,
        name: result.name ?? '',
        brand: result.brand ?? '',
        category: result.category ?? '',
        quantity: result.quantity ?? '',
      }));
      if (undetected.size > 0) {
        setScanFailed(true);
      }
      setBranch(itemType);
    },
    [],
  );

  const handleFrontCapture = async (base64: string, uri: string) => {
    setFrontThumbUri(uri);
    setIsProcessing(true);
    const result = await scanFront(base64);
    const itemType: ItemType = result.item_type ?? 'packaged';
    applyFrontResult(result, itemType);
    setIsProcessing(false);

    if (itemType === 'fresh') {
      setFreshStep('storage');
    } else {
      setPackagedStep('back');
    }
  };

  const handleBackCapture = async (base64: string) => {
    setIsProcessing(true);
    const result = await scanBack(base64);
    setUndetectedFields((prev) => {
      const next = new Set(prev);
      result.undetected.forEach((k) => next.add(k));
      return next;
    });
    patchForm({ expiryDate: result.expiry_date ?? '' });
    if (result.undetected.has('expiry_date')) {
      setScanFailed(true);
    }
    setIsProcessing(false);
    setPackagedStep('confirm');
  };

  const handleFreshPhotoCapture = async (base64: string, uri: string) => {
    setFrontThumbUri(uri);
    setIsProcessing(true);
    const result = await scanFront(base64);
    applyFrontResult(result, 'fresh');
    setIsProcessing(false);
    setFreshStep('storage');
  };

  const selectStorage = (storage: FreshStorageLocation) => {
    setFreshStorage(storage);
    const chip = STORAGE_CHIPS.find((c) => c.id === storage);
    const itemLabel = form.name.trim() || 'This item';
    const lookup = lookupShelfLifeDays(form.name, storage);

    if (lookup != null) {
      const base = addDaysToToday(lookup.days);
      setExpiryBaseDate(base);
      setExpiryAdjustment(0);
      patchForm({ expiryDate: base });
      setUndetectedFields((prev) => {
        const next = new Set(prev);
        next.delete('expiry_date');
        return next;
      });
      setExpiryHelperText(
        `${itemLabel} usually lasts ${lookup.days} days in the ${chip?.label.toLowerCase() ?? storage}.`,
      );
    } else {
      setExpiryBaseDate('');
      setExpiryAdjustment(0);
      patchForm({ expiryDate: '' });
      setUndetectedFields((prev) => new Set(prev).add('expiry_date'));
      setExpiryHelperText(null);
    }

    setFreshStep('expiry');
  };

  const handleExpiryAdjustment = (delta: number) => {
    if (expiryBaseDate.length === 0) return;
    const nextAdj = expiryAdjustment + delta;
    setExpiryAdjustment(nextAdj);
    patchForm({ expiryDate: adjustIsoDate(expiryBaseDate, nextAdj) });
  };

  const validateAndSubmit = () => {
    setSaveError(null);
    const errors: { name?: string; expiryDate?: string } = {};
    if (form.name.trim().length === 0) {
      errors.name = 'Name is required';
    }
    if (form.expiryDate.trim().length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate)) {
      errors.expiryDate = 'Expiry date is required (YYYY-MM-DD)';
    }
    if (form.category === '') {
      setSaveError('Please select a category.');
      return;
    }
    if (errors.name != null || errors.expiryDate != null) {
      setFieldErrors(errors);
      return;
    }

    addMutation.mutate(
      {
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity.trim() || undefined,
        expiry_date: form.expiryDate,
        barcode: mode === 'manual' ? form.barcode.trim() || undefined : undefined,
      },
      {
        onSuccess: (data) => {
          const itemName = data.name;
          resetScanFlow();
          setMode('scan');
          router.push({
            pathname: '/(tabs)/pantry',
            params: { toastMessage: `${itemName} added to your pantry` },
          });
        },
        onError: (err) => {
          setSaveError(err instanceof Error ? err.message : 'Could not add item.');
        },
      },
    );
  };

  const switchMode = (next: EntryMode) => {
    setMode(next);
    setSaveError(null);
    setFieldErrors({});
    if (next === 'manual') {
      resetScanFlow();
      setForm(EMPTY_FORM);
    } else {
      resetScanFlow();
    }
  };

  const confirmStep =
    (branch === 'packaged' && packagedStep === 'confirm') ||
    (branch === 'fresh' && freshStep === 'confirm') ||
    mode === 'manual';

  const headerTitle = useMemo(() => {
    if (mode === 'manual') return 'Add item';
    if (confirmStep) return 'Confirm';
    if (branch === 'fresh' && freshStep === 'storage') return 'Storage';
    if (branch === 'fresh' && freshStep === 'expiry') return 'Expiry';
    return 'Scan';
  }, [mode, confirmStep, branch, freshStep]);

  const renderScanContent = () => {
    if (mode === 'manual') {
      return (
        <>
          {scanFailed && (
            <View style={{ backgroundColor: '#FFF3F3', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#A32D2D' }}>
              <Text style={{ color: '#A32D2D', fontSize: 13, fontFamily: 'DMSans' }}>
                Scan couldn't read this product. Please fill in the details manually.
              </Text>
            </View>
          )}
          <ConfirmForm
            values={form}
            onChange={patchForm}
            onSubmit={validateAndSubmit}
            fieldErrors={fieldErrors}
            undetectedFields={undetectedFields}
            isManual
            isSubmitting={addMutation.isPending}
          />
        </>
      );
    }

    if (branch === 'packaged') {
      if (packagedStep === 'front') {
        return (
          <CameraStep
            overlayText="Point at the front of the product"
            onCapture={handleFrontCapture}
            isCapturing={loading}
          />
        );
      }
      if (packagedStep === 'back') {
        return (
          <CameraStep
            overlayText="Now point at the expiry date"
            thumbnailUri={frontThumbUri}
            onCapture={(b64) => handleBackCapture(b64)}
            isCapturing={loading}
          />
        );
      }
      return (
        <>
          {scanFailed && (
            <View style={{ backgroundColor: '#FFF3F3', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#A32D2D' }}>
              <Text style={{ color: '#A32D2D', fontSize: 13, fontFamily: 'DMSans' }}>
                Scan couldn't read this product. Please fill in the details manually.
              </Text>
            </View>
          )}
          <ConfirmForm
            values={form}
            onChange={patchForm}
            onSubmit={validateAndSubmit}
            fieldErrors={fieldErrors}
            undetectedFields={undetectedFields}
            isSubmitting={addMutation.isPending}
          />
        </>
      );
    }

    if (branch === 'fresh') {
      if (freshStep === 'photo') {
        return (
          <CameraStep
            overlayText="Point at your item"
            onCapture={handleFreshPhotoCapture}
            isCapturing={loading}
          />
        );
      }
      if (freshStep === 'storage') {
        return (
          <View style={styles.storageScreen}>
            <Text style={styles.storagePrompt}>Where will you store this?</Text>
            <View style={styles.storageGrid}>
              {STORAGE_CHIPS.map((chip) => {
                const active = freshStorage === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.storageChip, active && styles.storageChipActive]}
                    onPress={() => selectStorage(chip.id)}
                  >
                    <Text style={styles.storageEmoji}>{chip.emoji}</Text>
                    <Text
                      style={[styles.storageLabel, active && styles.storageLabelActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      }
      if (freshStep === 'expiry') {
        return (
          <View style={styles.storageScreen}>
            <ConfirmForm
              values={form}
              onChange={patchForm}
              onSubmit={() => setFreshStep('confirm')}
              fieldErrors={fieldErrors}
              undetectedFields={undetectedFields}
              isFresh
              hideSubmit
              fieldsOnly="expiry"
              showExpiryAdjuster={expiryBaseDate.length > 0}
              expiryHelperText={expiryHelperText}
              expiryAdjustment={expiryAdjustment}
              onExpiryAdjustmentChange={handleExpiryAdjustment}
            />
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setFreshStep('confirm')}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <>
          {scanFailed && (
            <View style={{ backgroundColor: '#FFF3F3', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#A32D2D' }}>
              <Text style={{ color: '#A32D2D', fontSize: 13, fontFamily: 'DMSans' }}>
                Scan couldn't read this product. Please fill in the details manually.
              </Text>
            </View>
          )}
          <ConfirmForm
            values={form}
            onChange={patchForm}
            onSubmit={validateAndSubmit}
            fieldErrors={fieldErrors}
            undetectedFields={undetectedFields}
            isFresh
            isSubmitting={addMutation.isPending}
            expiryHelperText={expiryHelperText}
          />
        </>
      );
    }

    return (
      <CameraStep
        overlayText="Point at the front of the product"
        onCapture={handleFrontCapture}
        isCapturing={loading}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitle}</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'scan' && styles.modeTabActive]}
            onPress={() => switchMode('scan')}
          >
            <Text style={[styles.modeTabText, mode === 'scan' && styles.modeTabTextActive]}>
              Scan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
            onPress={() => switchMode('manual')}
          >
            <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {saveError != null && (
        <View style={styles.bannerWrap}>
          <ErrorBanner
            message={saveError}
            onRetry={() => {
              setSaveError(null);
              validateAndSubmit();
            }}
          />
        </View>
      )}

      <View style={styles.body}>{renderScanContent()}</View>

      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  modeTabTextActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  bannerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  body: {
    flex: 1,
  },
  storageScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  storagePrompt: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  storageChip: {
    width: '46%',
    minHeight: 88,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  storageChipActive: {
    borderColor: colors.teal,
    borderWidth: 1.5,
    backgroundColor: colors.tealLight,
  },
  storageEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  storageLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  storageLabelActive: {
    color: colors.teal,
  },
  continueBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    height: 48,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.teal,
    fontFamily: fonts.body,
  },
});
