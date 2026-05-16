// components/qr/QRCanvas.tsx — FULL REWRITE
import React from "react";
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
  const innerEyeBR =
    typeof eyeBR === "number"
      ? Math.max(0, eyeBR - 4)
      : (eyeBR as number[]).map((n: number) => Math.max(0, n - 4));

  const pc = PIXEL_CONFIG[qrStyle.pixelShape];

  const qrKey = [
    qrStyle.eyeShape,
    qrStyle.pixelShape,
    qrStyle.fgColor,
    qrStyle.bgColor,
    qrStyle.ecl,
    qrStyle.logoUri ?? "none",
  ].join("|");

  // QR modules = 21 + (ecl version overhead). Safe to assume ~37 modules for version 3-4.
  // pieceSize drives the rendered size: totalSize ≈ pieceSize * numModules
  // We want the QR to fill ~size px, with quiet zone handled by QRCodeStyled's padding.
  // Set pieceSize so QR fills fully, let the outer bg View handle the quiet zone visually.
  const quietZonePx = Math.round(size * 0.04);
  const innerSize = size - quietZonePx * 2;
  // pieceSize = innerSize / 37 (approximate module count for typical QR)
  const pieceSize = Math.floor(innerSize / 37);

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
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size * 0.25,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: qrStyle.fgColor + "50",
          }}
        />
      ) : (
        <QRCodeStyled
          key={qrKey}
          data={value}
          style={{
            width: innerSize,
            height: innerSize,
            alignSelf: "center",
          }}
          padding={0}
          // NO pieceSize — not supported in this version
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
                  padding: 6,
                }
              : undefined
          }
        />
      )}
    </View>
  );
}
