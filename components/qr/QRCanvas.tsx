import { View, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { QRStyle, EYE_BORDER_RADIUS } from "@/types/qr";

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

// Natural render size — QR renders at this, then scaled up
const NATURAL_SIZE = 200;

export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || value.trim().length === 0;
  const scale = size / NATURAL_SIZE;

  const eyeBR = EYE_BORDER_RADIUS[qrStyle.eyeShape];
  const innerEyeBR =
    typeof eyeBR === "number"
      ? Math.max(0, eyeBR - 4)
      : (eyeBR as number[]).map((n: number) => Math.max(0, n - 4));

  // pieceBorderRadius: proportional to natural piece size (~10px at NATURAL_SIZE=200)
  // This prevents "splash" eyes on high-version QRs
  const getBorderRadius = (shape: QRStyle["pixelShape"]): number => {
    const map: Record<QRStyle["pixelShape"], number> = {
      sharp: 0,
      soft: 2,
      round: 4,
      dots: 5, // fully round relative to piece
      liquid: 3,
      glued: 2,
      diamond: 2,
      cross: 0,
      star: 1,
    };
    return map[shape];
  };

  const qrKey = [
    qrStyle.eyeShape,
    qrStyle.pixelShape,
    qrStyle.fgColor,
    qrStyle.bgColor,
    qrStyle.ecl,
  ].join("|");

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: qrStyle.bgColor,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {isEmpty ? (
        <View style={StyleSheet.absoluteFillObject}>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <View
              style={{
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: size * 0.15,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: qrStyle.fgColor + "50",
              }}
            />
          </View>
        </View>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          {/* Scale wrapper — forces QR to fill container always */}
          <View
            style={{
              width: NATURAL_SIZE,
              height: NATURAL_SIZE,
              transform: [{ scale }],
            }}
          >
            <QRCodeStyled
              key={qrKey}
              data={value}
              style={{ width: NATURAL_SIZE, height: NATURAL_SIZE }}
              padding={4}
              pieceBorderRadius={getBorderRadius(qrStyle.pixelShape)}
              isPiecesGlued={
                qrStyle.pixelShape === "glued" ||
                qrStyle.pixelShape === "liquid"
              }
              color={qrStyle.fgColor}
              errorCorrectionLevel={qrStyle.ecl}
              outerEyesOptions={{
                borderRadius: eyeBR as number,
                color: qrStyle.fgColor,
              }}
              innerEyesOptions={{
                borderRadius: innerEyeBR as number,
                color: qrStyle.fgColor,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
