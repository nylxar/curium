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

  // Quiet zone = 4 modules worth of space inside the bg container
  const quietZone = Math.round(size * 0.035);
  const innerSize = size - quietZone * 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: qrStyle.bgColor,
        borderRadius: 20,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isEmpty ? (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: qrStyle.fgColor + "50",
          }}
        />
      ) : (
        <QRCodeStyled
          key={qrKey}
          data={value}
          width={innerSize}
          height={innerSize}
          padding={0}
          pieceSize={10}
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
