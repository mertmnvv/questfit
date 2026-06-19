import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

export default function DietSelectionModal({ visible, onClose, currentPlan, onSave }) {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const [timing, setTiming] = useState('standard');
  const [macroSplit, setMacroSplit] = useState('balanced');
  
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoOption, setSelectedInfoOption] = useState(null);

  const TIMING_OPTIONS = [
    { id: 'standard', title: t('diet.standard'), icon: 'food-apple', desc: t('diet.standardDesc'), warning: t('diet.standardWarning'), article: t('diet.standardArticle') },
    { id: 'if_16_8', title: t('diet.if168'), icon: 'timer-outline', desc: t('diet.if168Desc'), warning: t('diet.if168Warning'), article: t('diet.if168Article') },
    { id: 'omad', title: t('diet.omad'), icon: 'fire', desc: t('diet.omadDesc'), warning: t('diet.omadWarning'), article: t('diet.omadArticle') },
  ];

  const MACRO_OPTIONS = [
    { id: 'balanced', title: t('diet.balanced'), icon: 'scale-balance', desc: t('diet.balancedDesc'), warning: t('diet.balancedWarning'), article: t('diet.balancedArticle') },
    { id: 'keto', title: t('diet.keto'), icon: 'leaf', desc: t('diet.ketoDesc'), warning: t('diet.ketoWarning'), article: t('diet.ketoArticle') },
    { id: 'high_protein', title: t('diet.highProtein'), icon: 'arm-flex', desc: t('diet.highProteinDesc'), warning: t('diet.highProteinWarning'), article: t('diet.highProteinArticle') },
  ];

  useEffect(() => {
    if (currentPlan) {
      setTiming(currentPlan.timing || 'standard');
      setMacroSplit(currentPlan.macroSplit || 'balanced');
    }
  }, [currentPlan, visible]);

  const handleSave = () => {
    onSave({ timing, macroSplit });
    onClose();
  };

  const openInfo = (item) => {
    setSelectedInfoOption(item);
    setInfoModalVisible(true);
  };

  const renderOption = (item, selectedId, onSelect) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => onSelect(item.id)}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name={item.icon} size={24} color={isSelected ? COLORS.background : COLORS.primary} />
          <Text style={[styles.cardTitle, isSelected && { color: COLORS.background }]}>{item.title}</Text>
          
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => openInfo(item)} style={{ padding: 4, marginRight: isSelected ? 8 : 0 }}>
              <MaterialCommunityIcons name="information-outline" size={20} color={isSelected ? COLORS.background : COLORS.textMuted} />
            </TouchableOpacity>
            {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.background} />}
          </View>
        </View>
        <Text style={[styles.cardDesc, isSelected && { color: COLORS.background }]}>{item.desc}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('diet.title')}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.sectionTitle}>{t('diet.mealTiming')}</Text>
              {TIMING_OPTIONS.map(item => renderOption(item, timing, setTiming))}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>{t('diet.macroGoal')}</Text>
              {MACRO_OPTIONS.map(item => renderOption(item, macroSplit, setMacroSplit))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t('diet.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoModalVisible} animationType="fade" transparent={true} onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.infoOverlay}>
          <View style={styles.infoContainer}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoHeaderTitle}>{selectedInfoOption?.title}</Text>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.infoDesc}>{selectedInfoOption?.desc}</Text>
            
            {selectedInfoOption?.warning ? (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color="#FFA500" />
                <Text style={styles.warningText}>{selectedInfoOption.warning}</Text>
              </View>
            ) : null}

            {selectedInfoOption?.article ? (
              <TouchableOpacity 
                style={styles.articleButton} 
                onPress={() => Linking.openURL(selectedInfoOption.article)}
              >
                <MaterialCommunityIcons name="text-box-search-outline" size={20} color={COLORS.primary} />
                <Text style={styles.articleButtonText}>{t('diet.readArticle') || 'Read Scientific Article'}</Text>
                <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.primary} style={{marginLeft: 'auto'}} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.card, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.md, marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  card: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitle: { ...TYPOGRAPHY.h3, fontSize: FONT_SIZE.md, color: COLORS.text, marginLeft: SPACING.sm },
  cardDesc: { ...TYPOGRAPHY.body, fontSize: FONT_SIZE.sm, color: COLORS.textMuted, lineHeight: 20 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.md },
  saveButtonText: { ...TYPOGRAPHY.h3, color: COLORS.background },
  
  infoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  infoContainer: { width: '100%', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  infoHeaderTitle: { ...TYPOGRAPHY.h2, color: COLORS.text, flex: 1 },
  infoDesc: { ...TYPOGRAPHY.body, fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 22, marginBottom: SPACING.lg },
  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(255, 165, 0, 0.1)', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  warningText: { ...TYPOGRAPHY.body, fontSize: FONT_SIZE.sm, color: '#FFA500', marginLeft: SPACING.sm, flex: 1, lineHeight: 20 },
  articleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(64, 192, 87, 0.1)', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
  articleButtonText: { ...TYPOGRAPHY.h3, fontSize: FONT_SIZE.sm, color: COLORS.primary, marginLeft: SPACING.sm },
});
