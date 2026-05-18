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

  const innerEyeBR =
    typeof eyeBR === "number"
      ? Math.max(0, eyeBR - 4)
      : (eyeBR as number[]).map((n: number) => Math.max(0, n - 4));

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
      style={{
        width: size,
        height: size,
        backgroundColor: qrStyle.bgColor,
        borderRadius: 16,
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
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: size * 0.175,
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
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <QRCodeStyled
            key={qrKey}
            data={value}
            style={{ width: size, height: size }}
            padding={size * 0.04}
            pieceBorderRadius={pc.pieceBorderRadius}
            isPiecesGlued={false}
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
            logo={
              qrStyle.logoUri
                ? {
                    href: qrStyle.logoUri as string,
                    scale: 0.22,
                    hidePieces: true,
                    padding: 4,
                  }
                : undefined
            }
          />
        </View>
      )}
    </View>
  );
}
