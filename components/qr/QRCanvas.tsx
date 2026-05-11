import { View } from "react-native";
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
      : (eyeBR as number[]).map((n) => Math.max(0, n - 4));

  const qrKey = [
    qrStyle.eyeShape,
    qrStyle.pixelShape,
    qrStyle.fgColor,
    qrStyle.bgColor,
    qrStyle.ecl,
    qrStyle.logoUri ?? "none",
  ].join("|");

  return (
    // explicit width + height here — this is what was missing
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: qrStyle.bgColor,
        borderRadius: 24,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isEmpty ? (
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: qrStyle.bgColor,
            borderRadius: 20,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            padding: Math.floor(size * 0.04),
          }}
        />
      ) : (
        <QRCodeStyled
          key={qrKey}
          data={value}
          style={{ width: size, height: size }}
          padding={0}
          pieceSize={Math.floor(size / 35)}
          pieceScale={pc.pieceScale}
          pieceBorderRadius={pc.pieceBorderRadius}
          isPiecesGlued={false}
          color={qrStyle.fgColor}
          errorCorrectionLevel={qrStyle.ecl}
          outerEyesOptions={{ borderRadius: eyeBR, color: qrStyle.fgColor }}
          innerEyesOptions={{
            borderRadius: innerEyeBR,
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
