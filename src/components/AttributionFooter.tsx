// 지도 데이터 출처 (CC BY 4.0). 모든 화면 맨 아래에 한 줄로 보여 준다 (COMPONENT_SPEC 3-14)
export function AttributionFooter() {
  return (
    <footer>
      지도 데이터: 통계청 SGIS,{" "}
      <a href="https://github.com/vuski/admdongkor" target="_blank" rel="noopener noreferrer">
        admdongkor
      </a>{" "}
      (CC BY 4.0)
    </footer>
  );
}
