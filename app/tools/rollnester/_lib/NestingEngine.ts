export interface PackItem {
  id: string;        // 고유 ID (파일 ID + 인덱스)
  fileId: string;    // 원본 파일 식별자
  pageIndex: number; // 원본 파일의 몇 번째 페이지인지 (0부터 시작)
  width: number;     // 밀리미터 단위
  height: number;    // 밀리미터 단위
}

export interface PlacedItem extends PackItem {
  x: number;
  y: number;
  rotated?: boolean; // 90도 회전 여부 (true일 경우 width/height는 회전 적용된 치수)
}

type OrientedItem = PackItem & { rotated: boolean };

function canFit(width: number, maxWidth: number): boolean {
  return width <= maxWidth + 0.01;
}

/**
 * 방향이 결정된 아이템 목록에 대해 2D Shelf Packing (FFDH)을 수행합니다.
 */
function runShelfPack(
  orientedItems: OrientedItem[],
  maxWidth: number,
  gutter: number
): { placedItems: PlacedItem[]; totalWidth: number; totalHeight: number } {
  const sortedItems = [...orientedItems].sort((a, b) => b.height - a.height || b.width - a.width);

  const placedItems: PlacedItem[] = [];
  const shelves: { y: number; height: number; currentWidth: number }[] = [];
  let totalHeight = 0;
  let maxUsedWidth = 0;

  for (const item of sortedItems) {
    let placed = false;
    const itemW = item.width + gutter;
    const itemH = item.height + gutter;

    for (const shelf of shelves) {
      if (shelf.currentWidth + itemW <= maxWidth + gutter + 0.01 && itemH <= shelf.height + 0.01) {
        placedItems.push({
          ...item,
          x: shelf.currentWidth,
          y: shelf.y,
        });
        shelf.currentWidth += itemW;
        maxUsedWidth = Math.max(maxUsedWidth, shelf.currentWidth);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const shelfY = totalHeight;
      placedItems.push({
        ...item,
        x: 0,
        y: shelfY,
      });
      shelves.push({
        y: shelfY,
        height: itemH,
        currentWidth: itemW,
      });
      totalHeight += itemH;
      maxUsedWidth = Math.max(maxUsedWidth, itemW);
    }
  }

  return {
    placedItems,
    totalWidth: Math.max(0, maxUsedWidth - gutter),
    totalHeight: Math.max(0, totalHeight - gutter),
  };
}

/**
 * 2D Shelf Packing (90도 회전 자동 최적화 포함) 알고리즘
 * 정방향, 가로 눕히기, 세로 세우기 전략을 비교해 롤 소모 길이(totalHeight)가 가장 짧은 최적 배치를 반환합니다.
 */
export function packItems(
  items: PackItem[],
  maxWidth: number,
  gutter: number
): { placedItems: PlacedItem[]; totalWidth: number; totalHeight: number } {
  if (items.length === 0) {
    return { placedItems: [], totalWidth: 0, totalHeight: 0 };
  }

  const orient = (item: PackItem, preferLandscape: boolean | null): OrientedItem => {
    const fitsNormal = canFit(item.width, maxWidth);
    const fitsRotated = canFit(item.height, maxWidth);

    if (preferLandscape === null) {
      // 원본 우선 (단, 원본이 폭을 넘고 회전 시 들어가면 회전)
      if (!fitsNormal && fitsRotated) {
        return { ...item, width: item.height, height: item.width, rotated: true };
      }
      return { ...item, rotated: false };
    }

    const shouldRotate = preferLandscape ? item.width < item.height : item.width > item.height;
    if (shouldRotate && fitsRotated) {
      return { ...item, width: item.height, height: item.width, rotated: true };
    }
    if (!fitsNormal && fitsRotated) {
      return { ...item, width: item.height, height: item.width, rotated: true };
    }
    return { ...item, rotated: false };
  };

  // 3가지 방향 전략 시뮬레이션
  const candidates = [
    runShelfPack(items.map((i) => orient(i, null)), maxWidth, gutter),  // 1. 원본 유지 우선
    runShelfPack(items.map((i) => orient(i, true)), maxWidth, gutter),  // 2. 가로로 눕히기 우선 (높이 최소화)
    runShelfPack(items.map((i) => orient(i, false)), maxWidth, gutter), // 3. 세로로 세우기 우선 (한 줄 개수 최대화)
  ];

  // 총 길이(totalHeight) 최소 -> 총 폭 최소 -> 회전 수 최소 순으로 최적안 선택
  candidates.sort((a, b) => {
    const heightDiff = a.totalHeight - b.totalHeight;
    if (Math.abs(heightDiff) > 0.1) return heightDiff;

    const widthDiff = a.totalWidth - b.totalWidth;
    if (Math.abs(widthDiff) > 0.1) return widthDiff;

    const rotA = a.placedItems.filter((p) => p.rotated).length;
    const rotB = b.placedItems.filter((p) => p.rotated).length;
    return rotA - rotB;
  });

  return candidates[0];
}
