import type { Metadata } from "next";
import { AttributionFooter } from "@/components/AttributionFooter";
import { TripStoreProvider } from "@/components/TripStoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "나만의 여행 지도",
  description: "우리나라 시·군·구 지도에 내 여행을 기록하는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 모든 페이지가 같은 저장소를 쓰게 가장 바깥에 둔다 */}
        <TripStoreProvider>{children}</TripStoreProvider>
        <AttributionFooter />
      </body>
    </html>
  );
}
