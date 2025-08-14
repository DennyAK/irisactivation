import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedImage = { canceled: boolean; uri?: string; file?: File };

export async function pickImage(): Promise<PickedImage> {
  if (Platform.OS === 'web') {
    return new Promise<PickedImage>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = (input.files && input.files[0]) || null;
        if (file) {
          const url = URL.createObjectURL(file);
          resolve({ canceled: false, uri: url, file });
        } else {
          resolve({ canceled: true });
        }
      };
      input.click();
    });
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.length) return { canceled: true };
  return { canceled: false, uri: result.assets[0].uri };
}
