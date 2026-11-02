import type { Metadata, Viewport } from "next";
import { Gowun_Batang, IBM_Plex_Sans_KR } from "next/font/google";
import { AttributionFooter } from "@/components/AttributionFooter";
import { MapViewportProvider } from "@/components/MapViewportProvider";
import { TripStoreProvider } from "@/components/TripStoreProvider";
import "./globals.css";

// 글꼴은 빌드할 때 받아 앱과 함께 둔다 (TRD 2장). 한글 글꼴은 파일이 많아 미리 받기(preload)는 끈다
const plex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
  preload: false,
});

// 여행일기 글꼴 (COMPONENT_SPEC 10-3)
const gowun = Gowun_Batang({
  weight: ["400", "700"],
  variable: "--font-gowun",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "트레이스",
  description: "우리나라 시·군·구 지도에 내 여행을 기록하는 앱",
  // 아이폰 홈 화면에 설치했을 때의 이름과 모양 (COMPONENT_SPEC 11-2)
  appleWebApp: { capable: true, title: "트레이스", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  // 배포 주소를 알리지 않으므로 검색 사이트에도 나오지 않게 한다 (TRD 7장 보안)
  robots: { index: false, follow: false },
};

// 화면 끝(노치 아래)까지 쓰고, 안전 영역 여백은 globals.css가 준다 (COMPONENT_SPEC 10-4)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${plex.variable} ${gowun.variable}`}>
      <body className="antialiased">
        {/* 본문 폭은 최대 640px, 가운데 (COMPONENT_SPEC 10-4) */}
        <div className="mx-auto max-w-[640px] px-4">
          {/* 모든 페이지가 같은 저장소를 쓰게 가장 바깥에 둔다 */}
          <TripStoreProvider>
            <MapViewportProvider>{children}</MapViewportProvider>
          </TripStoreProvider>
          <AttributionFooter />
        </div>
      </body>
    </html>
  );
}
