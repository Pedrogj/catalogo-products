import QRCode from "qrcode";

export async function makeQrDataUrl(text: string) {
  return await QRCode.toDataURL(text, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
