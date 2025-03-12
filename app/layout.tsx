import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
// 部分的な事前レンダリングの実装するため experimental_ppr セグメント構成オプションを追加。
export const experimental_ppr = true;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
