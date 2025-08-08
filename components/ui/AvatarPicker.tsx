import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { palette, spacing } from '../../constants/Design';

interface Props {
  uri?: string | null;
  onChange: (uri: string) => void;
  size?: number;
}

export const AvatarPicker: React.FC<Props> = ({ uri, onChange, size = 110 }) => {
  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity onPress={pick} activeOpacity={0.85} style={{ position: 'relative' }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size/2, borderWidth: 2, borderColor: '#e5e7eb' }} />
      ) : (
        <Ionicons name="person-circle-outline" size={size} color="#c7c7c7" />
      )}
      <View style={[styles.badge, { right: size*0.06, bottom: size*0.06 }]}>
        <Ionicons name="camera" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: { position: 'absolute', backgroundColor: palette.primary, borderRadius: 14, padding: 4, borderWidth: 2, borderColor: '#fff' }
});

export default AvatarPicker;
