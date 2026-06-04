import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, FontSize, Spacing, Fonts } from "@/constants/theme";

interface Props {
  logoUri?: string;
  onChange: (uri: string | undefined) => void;
}

export function LogoPicker({ logoUri, onChange }: Props) {
  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to embed a logo.",
      );
      return;
    }
    // SDK 55: mediaTypes is string array, not enum [web:82]
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChange(result.assets[0].uri);
    }
  };

  const remove = () => {
    Haptics.selectionAsync();
    onChange(undefined);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Logo (optional)</Text>
      <View style={styles.row}>
        {logoUri ? (
          <View style={styles.logoPreview}>
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={remove}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.pickBtn}
          onPress={pick}
          activeOpacity={0.75}
        >
          <Ionicons
            name={logoUri ? "refresh-outline" : "image-outline"}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.pickLabel}>
            {logoUri ? "Change" : "Pick Logo"}
          </Text>
        </TouchableOpacity>
        {logoUri && <Text style={styles.hint}>Logo auto-centered in QR</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
    color: Colors.textFaint,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  logoPreview: { position: "relative" },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtn: { position: "absolute", top: -8, right: -8 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pickLabel: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
    color: Colors.primary,
    fontWeight: "600",
  },
  hint: { fontSize: FontSize.xs, fontFamily: Fonts.mono, color: Colors.textFaint, flex: 1 },
});
