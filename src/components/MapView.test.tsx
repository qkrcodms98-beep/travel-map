import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapView, type MapViewport } from "@/components/MapView";
import type { RegionCode } from "@/types/region";
import { FAKE_REGION_FEATURES } from "../../tests/fixtures/map";

interface RenderOptions {
  visitCounts?: Record<RegionCode, number>;
  viewport?: MapViewport | null;
}

// 테스트마다 필요한 값만 바꿔 그린다
function renderMap({ visitCounts = {}, viewport = null }: RenderOptions = {}) {
  const onRegionClick = jest.fn<void, [RegionCode]>();
  const onViewportChange = jest.fn<void, [MapViewport]>();
  render(
    <MapView
      regions={FAKE_REGION_FEATURES}
      visitCounts={visitCounts}
      onRegionClick={onRegionClick}
      viewport={viewport}
      onViewportChange={onViewportChange}
    />,
  );
  return { onRegionClick, onViewportChange };
}

const regionA = () => screen.getByLabelText("테스트시 가구");
const regionB = () => screen.getByLabelText("테스트시 나구");

// 지역들을 감싼 묶음(<g>)의 확대·이동 상태. d3의 확대 상태 글자 "translate(x,y) scale(k)"
const mapTransform = () => regionA().closest("g")?.getAttribute("transform");

// 마지막으로 알려 준 확대 상태
const lastViewport = (onViewportChange: jest.Mock<void, [MapViewport]>) => onViewportChange.mock.calls.at(-1)?.[0];

describe("MapView 그리기와 색칠", () => {
  it("UI-01 가짜 지도의 두 지역이 화면 읽기용 이름으로 보인다", () => {
    renderMap();
    expect(regionA()).toBeInTheDocument();
    expect(regionB()).toBeInTheDocument();
  });

  it("UI-02 1번 가 본 A는 연두색(once), 안 가 본 B는 흰색(none)이다", () => {
    renderMap({ visitCounts: { "99010": 1 } });
    expect(regionA()).toHaveAttribute("data-color-stage", "once");
    expect(regionB()).toHaveAttribute("data-color-stage", "none");
  });

  it("UI-03 2번 가 본 A는 진한 초록(many)이다", () => {
    renderMap({ visitCounts: { "99010": 2 } });
    expect(regionA()).toHaveAttribute("data-color-stage", "many");
  });
});

describe("MapView 누르기와 확대·이동", () => {
  it("UI-05 A를 짧게 누르면 onRegionClick('99010')이 한 번 불린다", async () => {
    const user = userEvent.setup();
    const { onRegionClick } = renderMap();

    await user.click(regionA());

    expect(onRegionClick).toHaveBeenCalledTimes(1);
    expect(onRegionClick).toHaveBeenCalledWith("99010");
  });

  it("UI-06 A 위에서 누른 채 끌다가 A 위에서 손을 떼면 지역을 누른 것으로 치지 않는다", async () => {
    const user = userEvent.setup();
    const { onRegionClick, onViewportChange } = renderMap();

    await user.pointer([
      { keys: "[MouseLeft>]", target: regionA(), coords: { clientX: 10, clientY: 10 } },
      { target: regionA(), coords: { clientX: 60, clientY: 60 } },
      { keys: "[/MouseLeft]", target: regionA(), coords: { clientX: 60, clientY: 60 } },
    ]);

    // 정말 끌었는지(지도가 옮겨졌는지) 먼저 확인한다
    await waitFor(() => expect(onViewportChange).toHaveBeenCalled());
    expect(onRegionClick).not.toHaveBeenCalled();
  });

  it("UI-07 마우스 휠로 확대하면 onViewportChange가 불리고 scale이 1보다 크다", async () => {
    const { onViewportChange } = renderMap();

    // 휠은 user-event에 없어서 fireEvent로 보낸다. deltaY가 음수면 확대
    fireEvent.wheel(regionA(), { deltaY: -500 });

    await waitFor(() => expect(onViewportChange).toHaveBeenCalled());
    expect(lastViewport(onViewportChange)?.scale).toBeGreaterThan(1);
  });

  it("UI-08 끌어서 옮기면 onViewportChange가 불리고 x 또는 y가 바뀐다", async () => {
    const user = userEvent.setup();
    const { onViewportChange } = renderMap();

    await user.pointer([
      { keys: "[MouseLeft>]", target: regionA(), coords: { clientX: 10, clientY: 10 } },
      { target: regionB(), coords: { clientX: 80, clientY: 40 } },
      { keys: "[/MouseLeft]", target: regionB(), coords: { clientX: 80, clientY: 40 } },
    ]);

    await waitFor(() => expect(onViewportChange).toHaveBeenCalled());
    const viewport = lastViewport(onViewportChange);
    expect(viewport?.x !== 0 || viewport?.y !== 0).toBe(true);
  });

  it("UI-09 viewport = { scale: 2, x: 10, y: 20 }으로 그리면 그 확대 상태로 그려진다", () => {
    renderMap({ viewport: { scale: 2, x: 10, y: 20 } });
    expect(mapTransform()).toBe("translate(10,20) scale(2)");
  });

  it("UI-10 viewport = null이면 전국(가짜 지도 전체)이 보이는 처음 상태다", () => {
    renderMap({ viewport: null });
    expect(mapTransform()).toBe("translate(0,0) scale(1)");
    expect(regionA()).toBeInTheDocument();
    expect(regionB()).toBeInTheDocument();
  });
});

describe("MapView 진짜 브라우저의 마우스 붙잡기", () => {
  it("UI-98 A를 짧게 눌렀는데 손 뗄 때의 대상이 svg로 바뀌어도 onRegionClick('99010')이 한 번 불린다", async () => {
    const user = userEvent.setup();
    const { onRegionClick } = renderMap();
    // 마우스를 붙잡으면 브라우저는 손 뗄 때의 대상을 붙잡은 요소(svg)로 바꾼다
    // 그러면 클릭은 누른 곳(A)과 뗀 곳(svg)의 공통 조상인 svg에서 일어난다
    const svg = regionA().closest("svg");
    if (!svg) throw new Error("지도(svg)를 찾지 못했어요.");

    await user.pointer([
      { keys: "[MouseLeft>]", target: regionA(), coords: { clientX: 10, clientY: 10 } },
      { keys: "[/MouseLeft]", target: svg, coords: { clientX: 10, clientY: 10 } },
    ]);

    expect(onRegionClick).toHaveBeenCalledTimes(1);
    expect(onRegionClick).toHaveBeenCalledWith("99010");
  });
});
