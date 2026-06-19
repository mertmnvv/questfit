import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, SafeAreaView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';

import { EXERCISE_DATABASE } from '../data/exercises';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import HorizontalSlider from '../components/HorizontalSlider';

export default function NewCustomWorkoutScreen() {
  const navigation = useNavigation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const saveCustomRoutine = useUserStore(state => state.saveCustomRoutine);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [routineName, setRoutineName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const toggleExercise = (exercise) => {
    const exists = selectedExercises.find(e => e.id === exercise.id);
    if (exists) {
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, { ...exercise, key: `ex-${Date.now()}-${exercise.id}` }]);
    }
  };

  const removeExercise = (id) => {
    setSelectedExercises(selectedExercises.filter(e => e.id !== id));
  };

  const updateSetRep = (id, field, value) => {
    setSelectedExercises(selectedExercises.map(e => {
      if (e.id === id) {
        if (typeof value === 'string') {
          if (value === '' || value.endsWith('.') || value.endsWith(',')) {
            return { ...e, [field]: value };
          }
          return { ...e, [field]: parseFloat(value.replace(',', '.')) || 0 };
        }
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    
    const newCustomEx = {
      id: `custom_${Date.now()}`,
      key: `custom_${Date.now()}`,
      name: customExerciseName.trim(),
      muscleGroup: 'Özel',
      category: 'Özel',
      defaultSets: 3,
      defaultReps: 10,
      targetWeight: 0,
      restTimeSec: 60,
      burnedCalsPerSet: 10
    };
    
    setSelectedExercises(prev => [...prev, newCustomEx]);
    setCustomExerciseName('');
    Toast.show({ type: 'success', text1: 'Özel hareket eklendi!' });
  };

  const getValidExercises = () => {
    return selectedExercises.map(e => ({
      ...e,
      defaultSets: e.customSets || e.defaultSets,
      defaultReps: e.customReps || e.defaultReps,
      targetWeight: e.targetWeight || 0,
      restTimeSec: e.restTimeSec || 60,
    }));
  };

  const handleSaveRoutine = () => {
    if (!routineName.trim()) {
      Toast.show({ type: 'error', text1: 'Lütfen programa bir isim verin!' });
      return;
    }
    saveCustomRoutine(routineName.trim(), getValidExercises());
    Toast.show({ type: 'success', text1: 'Program başarıyla kaydedildi!' });
    navigation.goBack();
  };

  const handleStartCustomWorkout = () => {
    if (selectedExercises.length === 0) {
      Toast.show({ type: 'error', text1: 'En az 1 hareket seçmelisin!' });
      return;
    }
    
    navigation.navigate('ActiveWorkout', { 
      exercises: getValidExercises(), 
      title: routineName.trim() || 'Özel Antrenmanım' 
    });
  };

  const renderExerciseItem = ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
    const index = getIndex() || 0;
    return (
      <ScaleDecorator>
        <View style={[styles.exerciseCard, isActive && styles.exerciseCardActive]}>
          <View style={styles.exerciseCardHeader}>
            <View style={styles.exerciseCardTitleRow}>
              {/* Drag Handle */}
              <TouchableOpacity onLongPress={drag} delayLongPress={100} style={styles.dragHandle} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <MaterialCommunityIcons name="drag" size={24} color={isActive ? COLORS.primary : COLORS.textMuted} />
              </TouchableOpacity>
              
              <View style={styles.exerciseIndexBadge}>
                <Text style={styles.exerciseIndexText}>{index + 1}</Text>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.exerciseMuscle}>{item.muscleGroup}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeExercise(item.id)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          {/* Minimal Configuration Grid (2x2) */}
          <View style={styles.compactGrid}>
            
            {/* Set & Tekrar Row */}
            <View style={styles.compactRow}>
              <View style={styles.compactItem}>
                <Text style={styles.compactLabel}>Set</Text>
                <View style={styles.stepperBox}>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'customSets', Math.max(1, (parseFloat(item.customSets || item.defaultSets || 3)) - 1))} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <TextInput style={styles.stepperValInput} keyboardType="numeric" value={String(item.customSets !== undefined ? item.customSets : (item.defaultSets || 3))} onChangeText={(v) => updateSetRep(item.id, 'customSets', v)} />
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'customSets', (parseFloat(item.customSets || item.defaultSets || 3) || 0) + 1)} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.compactDivider} />

              <View style={styles.compactItem}>
                <Text style={styles.compactLabel}>Tekrar</Text>
                <View style={styles.stepperBox}>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'customReps', Math.max(1, (parseFloat(item.customReps || item.defaultReps || 10)) - 1))} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <TextInput style={styles.stepperValInput} keyboardType="numeric" value={String(item.customReps !== undefined ? item.customReps : (item.defaultReps || 10))} onChangeText={(v) => updateSetRep(item.id, 'customReps', v)} />
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'customReps', (parseFloat(item.customReps || item.defaultReps || 10) || 0) + 1)} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.compactHorizontalDivider} />

            {/* Ağırlık & Dinlenme Row */}
            <View style={styles.compactRow}>
              <View style={styles.compactItem}>
                <Text style={styles.compactLabel}>Ağırlık</Text>
                <View style={styles.stepperBox}>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'targetWeight', Math.max(0, (parseFloat(item.targetWeight || 0)) - 2.5))} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <View style={styles.inputWithUnit}>
                    <TextInput style={styles.stepperValInput} keyboardType="numeric" value={String(item.targetWeight !== undefined ? item.targetWeight : 0)} onChangeText={(v) => updateSetRep(item.id, 'targetWeight', v)} />
                    <Text style={styles.stepperUnit}>kg</Text>
                  </View>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'targetWeight', (parseFloat(item.targetWeight || 0) || 0) + 2.5)} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.compactDivider} />

              <View style={styles.compactItem}>
                <Text style={styles.compactLabel}>Dinlenme</Text>
                <View style={styles.stepperBox}>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'restTimeSec', Math.max(0, (parseFloat(item.restTimeSec || 60)) - 15))} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <View style={styles.inputWithUnit}>
                    <TextInput style={styles.stepperValInput} keyboardType="numeric" value={String(item.restTimeSec !== undefined ? item.restTimeSec : 60)} onChangeText={(v) => updateSetRep(item.id, 'restTimeSec', v)} />
                    <Text style={styles.stepperUnit}>sn</Text>
                  </View>
                  <TouchableOpacity onPress={() => updateSetRep(item.id, 'restTimeSec', (parseFloat(item.restTimeSec || 60) || 0) + 15)} style={styles.stepperBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const renderHeader = () => (
    <View style={styles.routineNameContainer}>
      <Text style={styles.inputLabel}>PROGRAM ADI</Text>
      <TextInput
        style={styles.routineNameInput}
        placeholder="Örn: Sırt ve Biceps"
        placeholderTextColor={COLORS.textMuted}
        value={routineName}
        onChangeText={setRoutineName}
      />
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Hareketler ({selectedExercises.length})</Text>
      </View>
      {selectedExercises.length === 0 && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="drag-horizontal-variant" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Henüz hareket eklemedin.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, COLORS.card, COLORS.background]} style={styles.gradient}>
        
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Yeni Program</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>

        {/* Draggable List */}
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            data={selectedExercises}
            onDragEnd={({ data }) => setSelectedExercises(data)}
            keyExtractor={(item) => item.key || item.id}
            renderItem={renderExerciseItem}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Big Add Exercise Button */}
        <View style={styles.addExerciseWrapper}>
          <TouchableOpacity style={styles.bigAddButton} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.background} />
            <Text style={styles.bigAddButtonText}>Hareket Seç</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.saveBtn, selectedExercises.length === 0 && { opacity: 0.5 }]} 
            onPress={handleSaveRoutine}
            disabled={selectedExercises.length === 0}
          >
            <MaterialCommunityIcons name="content-save" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>KAYDET</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.startBtn, selectedExercises.length === 0 && { opacity: 0.5 }]} 
            onPress={handleStartCustomWorkout}
            disabled={selectedExercises.length === 0}
          >
            <MaterialCommunityIcons name="play" size={20} color={COLORS.background} style={{ marginRight: 4 }} />
            <Text style={styles.startBtnText}>BAŞLA</Text>
          </TouchableOpacity>
        </View>

      </LinearGradient>

      {/* Exercise Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalSafeArea, { paddingTop: Platform.OS === 'android' ? 20 : 0 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hareket Ekle</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalDoneBtn} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
              <Text style={styles.modalDoneText}>Bitti</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Listede yoksa buraya yazıp ekle..."
              placeholderTextColor={COLORS.textMuted}
              value={customExerciseName}
              onChangeText={setCustomExerciseName}
              onSubmitEditing={handleAddCustomExercise}
            />
            <TouchableOpacity style={styles.customAddBtn} onPress={handleAddCustomExercise}>
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.background} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {['Göğüs', 'Sırt', 'Bacak', 'Omuz', 'Kollar', 'Karın', 'Full Body'].map(group => {
              const groupExercises = EXERCISE_DATABASE.filter(e => e.muscleGroup === group);
              if (groupExercises.length === 0) return null;
              return (
                <View key={group} style={styles.muscleGroupContainer}>
                  <Text style={styles.groupHeader}>{group}</Text>
                  {groupExercises.map(item => {
                    const isSelected = selectedExercises.some(e => e.id === item.id);
                    return (
                      <TouchableOpacity 
                        key={item.id}
                        style={[styles.poolCard, isSelected && styles.poolCardSelected]}
                        onPress={() => toggleExercise(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.poolCardInfo}>
                          <Text style={[styles.poolCardName, isSelected && { color: COLORS.background }]}>{item.name}</Text>
                          <Text style={[styles.poolCardDetail, isSelected && { color: COLORS.background }]}>{item.subGroup || item.muscleGroup}</Text>
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.background} />
                        ) : (
                          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, marginTop: Platform.OS === 'android' ? 20 : 0 },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.lg },
  
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 220 },
  
  routineNameContainer: { marginBottom: SPACING.md, marginTop: SPACING.md },
  inputLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: SPACING.sm },
  routineNameInput: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.text, fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, marginBottom: SPACING.xl },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.md },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, marginTop: SPACING.md },

  exerciseCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  exerciseCardActive: { borderColor: COLORS.primary, shadowColor: COLORS.primary, transform: [{ scale: 1.02 }] },
  exerciseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  exerciseCardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dragHandle: { paddingRight: SPACING.xs },
  exerciseIndexBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  exerciseIndexText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 10 },
  exerciseName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.md, flexShrink: 1 },
  exerciseMuscle: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  
  compactGrid: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  compactRow: { flexDirection: 'row', alignItems: 'center' },
  compactItem: { flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, alignItems: 'center' },
  compactLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 10, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  stepperBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  stepperBtn: { padding: 4, backgroundColor: COLORS.background, borderRadius: 12 },
  stepperValInput: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 13, minWidth: 28, textAlign: 'center', marginHorizontal: 2, padding: 0 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', minWidth: 36 },
  stepperUnit: { fontSize: 9, color: COLORS.textMuted, marginLeft: 2 },
  compactDivider: { width: 1, backgroundColor: COLORS.border, height: '100%' },
  compactHorizontalDivider: { height: 1, backgroundColor: COLORS.border, width: '100%' },

  addExerciseWrapper: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  bigAddButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full, ...SHADOWS.card, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  bigAddButtonText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.background, fontSize: FONT_SIZE.md, marginLeft: SPACING.xs },

  bottomActionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full },
  saveBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.primary, marginRight: SPACING.sm },
  saveBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, fontSize: FONT_SIZE.sm },
  startBtn: { backgroundColor: COLORS.primary, marginLeft: SPACING.sm },
  startBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.background, fontSize: FONT_SIZE.sm },

  // Modal Styles
  modalSafeArea: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, paddingTop: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.lg },
  modalDoneBtn: { padding: SPACING.xs },
  modalDoneText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, fontSize: FONT_SIZE.md },
  
  customInputContainer: { flexDirection: 'row', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  customInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 12, color: COLORS.text, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.sm, borderWidth: 1, borderColor: COLORS.border },
  customAddBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm },

  modalScroll: { paddingHorizontal: SPACING.lg },
  muscleGroupContainer: { marginTop: SPACING.lg },
  groupHeader: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 1 },
  
  poolCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  poolCardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  poolCardInfo: { flex: 1 },
  poolCardName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.sm },
  poolCardDetail: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
