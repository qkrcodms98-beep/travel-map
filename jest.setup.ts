// toBeInTheDocument() 같은 화면 확인 문장을 쓸 수 있게 한다
import "@testing-library/jest-dom";

// 가짜 브라우저(jsdom)에는 캔버스 그리기가 없어 부를 때마다 경고를 띄운다. 조용히 "쓸 수 없음"(null)을 돌려주게 한다
HTMLCanvasElement.prototype.getContext = () => null;
