"use client";

import { QRCodeSVG } from "qrcode.react";

interface TvQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Crisp SVG QR for big-screen attract — navy on cream to match brand. */
export default function TvQrCode({
  value,
  size = 420,
  className = "",
}: TvQrCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="#f2efe9"
      fgColor="#1a1f36"
      marginSize={2}
      className={className}
      aria-label="QR code to open Hangbyme"
    />
  );
}
