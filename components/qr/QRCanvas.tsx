import { View, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { QRStyle, EYE_BORDER_RADIUS, PIXEL_BORDER_RADIUS } from "@/types/qr";

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

// pieceScale per shape — dots/liquid need gap to prevent bleed
const PIECE_SCALE: Record<string, number> = {
  sharp: 1.0,
  soft: 1.0,
  round: 0.95,
  dots: 0.85, // biggest gap — prevents circular bleed
  liquid: 0.88,
  glued: 0.92,
};

export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || value.trim().length === 0;
  const eyeBR = EYE_BORDER_RADIUS[qrStyle.eyeShape];
  const pieceBR = PIXEL_BORDER_RADIUS[qrStyle.pixelShape];
  // No isPiecesGlued — it causes the bleed. Use borderRadius only.
  const pieceScale = PIECE_SCALE[qrStyle.pixelShape] ?? 0.9;

  const qrKey = [
    qrStyle.eyeShape,
    qrStyle.pixelShape,
    qrStyle.fgColor,
    qrStyle.bgColor,
    qrStyle.ecl,
    qrStyle.logoUri ?? "none",
  ].join("|");

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          backgroundColor: qrStyle.bgColor,
          borderRadius: 28,
        },
      ]}
    >
      {isEmpty ? (
        <View style={styles.emptyInner}>
          <View
            style={[styles.emptyDot, { borderColor: qrStyle.fgColor + "50" }]}
          />
        </View>
      ) : (
        <QRCodeStyled
          key={qrKey}
          data={value}
          style={{ backgroundColor: qrStyle.bgColor }}
          padding={20}
          pieceSize={8}
          pieceScale={pieceScale}
          color={qrStyle.fgColor}
          errorCorrectionLevel={qrStyle.ecl}
          pieceBorderRadius={pieceBR}
          isPiecesGlued={false} // ← always false, prevents bleed
          outerEyesOptions={{
            borderRadius: eyeBR,
            color: qrStyle.fgColor,
          }}
          innerEyesOptions={{
            borderRadius:
              typeof eyeBR === "number"
                ? Math.max(0, (eyeBR as number) - 4)
                : 4,
            color: qrStyle.fgColor,
          }}
          logo={
            qrStyle.logoUri
              ? {
                  href: qrStyle.logoUri,
                  scale: 0.22,
                  hidePieces: true,
                  padding: 6,
                }
              : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  emptyInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
  },
});
