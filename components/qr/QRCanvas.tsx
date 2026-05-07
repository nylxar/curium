import { View, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { QRStyle, EYE_BORDER_RADIUS, PIXEL_CONFIG } from "@/types/qr";

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || value.trim().length === 0;
  const eyeBR = EYE_BORDER_RADIUS[qrStyle.eyeShape];
  const pc = PIXEL_CONFIG[qrStyle.pixelShape];

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
        <View style={styles.inner}>
          <View style={[styles.dot, { borderColor: qrStyle.fgColor + "50" }]} />
        </View>
      ) : (
        <QRCodeStyled
          key={qrKey}
          data={value}
          style={{ backgroundColor: qrStyle.bgColor }}
          padding={18}
          pieceSize={pc.pieceSize}
          pieceScale={pc.pieceScale}
          pieceBorderRadius={pc.pieceBorderRadius}
          isPiecesGlued={false}
          color={qrStyle.fgColor}
          errorCorrectionLevel={qrStyle.ecl}
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
  inner: { flex: 1, alignItems: "center", justifyContent: "center" },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
  },
});
