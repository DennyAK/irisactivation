import React from 'react';
import { Modal, ScrollView, View, Text, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { PROGRAM_GROUPS, MERCHANDISE_ROWS, WEATHER_STATUS_OPTIONS } from '../constants/salesReportConfig';
import { SalesReportFormData, ValidationIssue } from '../types/salesReport';

interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  formData: SalesReportFormData;
  setFormData: (value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  userRole: string | null;
  assessmentMerchandiseAvailable: boolean | null;
  setAssessmentMerchandiseAvailable: (v: boolean | null) => void;
  validationIssues: ValidationIssue[];
  styles: any; // Parent supplies style sheet
}

const SalesReportModal: React.FC<Props> = ({
  visible,
  mode,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  userRole,
  assessmentMerchandiseAvailable,
  setAssessmentMerchandiseAvailable,
  validationIssues,
  styles,
}) => {
  const invalidKeys = new Set(validationIssues.map(v => v.field));
  const markStyle = (key: string) => invalidKeys.has(key) ? [styles.input, { borderColor: 'red' }] : styles.input;
  const setField = (k: keyof SalesReportFormData, v: any) => setFormData({ ...formData, [k]: v });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{mode === 'add' ? 'Add' : 'Edit'} Report</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Personnel Information</Text>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Assigned to BA:</Text><Text style={styles.fieldValue}>{formData.assignedToBA || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Assigned to TL:</Text><Text style={styles.fieldValue}>{formData.assignedToTL || '-'}</Text></View>
            <Text style={styles.inputLabel}>no of BA / SPG Guinness in charge (for selling program)</Text>
            <TextInput style={markStyle('baCount')} value={formData.baCount} onChangeText={text => setField('baCount', text)} placeholder="# of BA" keyboardType="numeric" />
            <Text style={styles.inputLabel}>no of crew or canvasser in charge (for event or canvasser program)</Text>
            <TextInput style={markStyle('crewCanvasserCount')} value={formData.crewCanvasserCount} onChangeText={text => setField('crewCanvasserCount', text)} placeholder="# of Crew/Canvasser" keyboardType="numeric" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Outlet Information</Text>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Outlet ID:</Text><Text style={styles.fieldValue}>{formData.outletId || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Outlet Name:</Text><Text style={styles.fieldValue}>{formData.outletName || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Province:</Text><Text style={styles.fieldValue}>{formData.outletProvince || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>City:</Text><Text style={styles.fieldValue}>{formData.outletCity || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Activity Name:</Text><Text style={styles.fieldValue}>{formData.activityName || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Channel:</Text><Text style={styles.fieldValue}>{formData.channel || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Tier:</Text><Text style={styles.fieldValue}>{formData.tier || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Outlet Capacity:</Text><Text style={styles.fieldValue}>{formData.outletCapacity || '-'}</Text></View>
            <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Tables Available:</Text><Text style={styles.fieldValue}>{formData.outletNoOfTableAVailable || '-'}</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Weather</Text>
            <Text style={styles.inputLabel}>Weather Status</Text>
            <View style={[styles.input, { padding: 0 }]}> 
              <Picker selectedValue={formData.weatherStatus} onValueChange={value => setField('weatherStatus', value)} style={{ height: 40 }}>
                <Picker.Item label="" value="" />
                {WEATHER_STATUS_OPTIONS.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Sales Report Summary Notes & Learning</Text>
            <Text style={styles.inputLabel}>Issues / Notes / Requests</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={formData.issuesNotesRequests} onChangeText={text => setField('issuesNotesRequests', text)} placeholder="Issues / Notes / Requests" multiline numberOfLines={4} />
            <Text style={styles.inputLabel}>Learning Points</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={formData.learningPoints} onChangeText={text => setField('learningPoints', text)} placeholder="Learning Points" multiline numberOfLines={4} />
          </View>

          {userRole === 'admin' && mode === 'edit' && (
            <>
              <Text style={styles.inputLabel}>Task Sales Report Detail Status</Text>
              <View style={[styles.input, { padding: 0 }]}> 
                <Picker selectedValue={formData.salesReportDetailStatus} onValueChange={value => setField('salesReportDetailStatus', value)} style={{ height: 40 }}>
                  {[
                    { label: '', value: '' },
                    { label: 'Done By BA', value: 'Done By BA' },
                    { label: 'Review back to BA', value: 'Review back to BA' },
                    { label: 'Done by TL', value: 'Done by TL' },
                    { label: 'Review back to TL', value: 'Review back to TL' },
                    { label: 'Done by AM', value: 'Done by AM' },
                  ].map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <View style={styles.actionsRow}>
            <PrimaryButton title={mode === 'add' ? 'Add' : 'Update'} onPress={onSubmit} style={styles.actionBtn} />
            <SecondaryButton title="Cancel" onPress={onCancel} style={styles.actionBtn} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default SalesReportModal;
