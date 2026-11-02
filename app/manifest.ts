import type { MetadataRoute } from "next";

// 웹 앱 설명서: 휴대폰 홈 화면에 설치할 때 쓰는 이름·아이콘·여는 방식 (COMPONENT_SPEC 11-1)
// Next.js가 /manifest.webmanifest 주소로 내보낸다
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "트레이스",
    short_name: "트레이스",
    description: "나만의 여행 지도",
    start_url: "/",
    display: "standalone", // 주소창 없이 앱처럼 연다
    background_color: "#f3f5f7",
    theme_color: "#f3f5f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // 안드로이드가 동그라미 등으로 잘라 쓰는 아이콘. 핀은 가운데 60% 안에 있어 잘리지 않는다
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
