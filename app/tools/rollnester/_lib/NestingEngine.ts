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
}

/**
 * 2D Shelf Packing (First Fit Decreasing Height) 알고리즘을 사용합니다.
 * 롤 용지의 특징(세로로 무한정 확장 가능)에 가장 적합한 방식입니다.
 */
export function packItems(
  items: PackItem[],
  maxWidth: number,
  gutter: number
): { placedItems: PlacedItem[]; totalWidth: number; totalHeight: number } {
  // 높이 기준으로 내림차순 정렬 (높이가 큰 것부터 배치해야 공간 낭비가 적음)
  const sortedItems = [...items].sort((a, b) => b.height - a.height);
  
  const placedItems: PlacedItem[] = [];
  const shelves: { y: number; height: number; currentWidth: number }[] = [];
  let totalHeight = 0;
  let maxUsedWidth = 0;

  for (const item of sortedItems) {
    let placed = false;
    // 여백(Gutter)을 더한 가상의 공간을 차지한다고 계산합니다.
    const itemW = item.width + gutter;
    const itemH = item.height + gutter;

    // 기존에 생성된 선반(Shelf)들 중에서 들어갈 공간이 있는지 찾습니다.
    for (const shelf of shelves) {
      if (shelf.currentWidth + itemW <= maxWidth + gutter) { // 마지막 여백 허용 위해 + gutter
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

    // 들어갈 선반이 없다면 새로운 선반을 윗층에 쌓습니다.
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

  // 실제 조판된 결과물의 최대 가로/세로 길이를 반환합니다. (마지막 여백 제외)
  const finalWidth = Math.max(0, maxUsedWidth - gutter);
  const finalHeight = Math.max(0, totalHeight - gutter);

  return {
    placedItems,
    totalWidth: finalWidth,
    totalHeight: finalHeight
  };
}
