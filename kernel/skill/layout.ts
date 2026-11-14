/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { view, Node, UITransform } from 'cc';

import { Range } from './digit';

/**
 * 水平布局
 * @param container 容器
 * @param options 选项
 * @param options.PaddingLeft 左边距，默认 0
 * @param options.PaddingRight 右边距，默认 0
 * @param options.PaddingTop 上边距，默认 0
 * @param options.PaddingBottom 下边距，默认 0
 * @param options.SpacingX 水平间距，默认 0
 * @param options.AlignVertical 垂直对齐方式，默认 `Center`
 * @param options.Direction 排列方向，默认 `Forward`
 */
export function LayoutHorizontal(
  container: Node,
  options?: {
    PaddingLeft?: number;
    PaddingRight?: number;
    PaddingTop?: number;
    PaddingBottom?: number;
    SpacingX?: number;
    AlignVertical?: 'Top' | 'Center' | 'Bottom';
    Direction?: 'Forward' | 'Backward';
  },
) {
  // 初始化选项
  options = {
    PaddingLeft: 0,
    PaddingRight: 0,
    PaddingTop: 0,
    PaddingBottom: 0,
    SpacingX: 0,
    AlignVertical: 'Center',
    Direction: 'Forward',
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(
      options.PaddingLeft! + options.PaddingRight!,
      options.PaddingTop! + options.PaddingBottom!,
    );
    return;
  }

  // 计算容器尺寸
  const items = container.children;
  let containerWidth =
    options.PaddingLeft! + options.PaddingRight! + (count - 1) * options.SpacingX!;
  let containerHeight = 0;
  const sizes: [width: number, height: number][] = [];

  items.forEach((item) => {
    const { width, height } = item.getComponent(UITransform)!;
    containerWidth += width;
    containerHeight = Math.max(containerHeight, height);
    sizes.push([width, height]);
  });

  containerHeight += options.PaddingTop! + options.PaddingBottom!;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currX = -uit.anchorX * containerWidth + options.PaddingLeft!;
  let currY = (0.5 - uit.anchorY) * containerHeight;
  switch (options.AlignVertical) {
    case 'Top':
      currY += 0.5 * containerHeight - options.PaddingTop!;
      break;
    case 'Bottom':
      currY += -0.5 * containerHeight + options.PaddingBottom!;
      break;
  }

  // 执行布局
  const [start, end] = options.Direction === 'Forward' ? [0, count] : [count, 0];
  for (const i of Range(start, end)) {
    const item = items[i];
    const [width, height] = sizes[i];
    item.x = currX + width * 0.5;
    currX += width + options.SpacingX!;
    switch (options.AlignVertical) {
      case 'Top':
        item.y = currY - height * 0.5;
        break;
      case 'Center':
        item.y = currY;
        break;
      case 'Bottom':
        item.y = currY + height * 0.5;
        break;
    }
  }
}

/**
 * 垂直布局
 * @param container 容器
 * @param options 选项
 * @param options.PaddingLeft 左边距，默认 0
 * @param options.PaddingRight 右边距，默认 0
 * @param options.PaddingTop 上边距，默认 0
 * @param options.PaddingBottom 下边距，默认 0
 * @param options.SpacingY 垂直间距，默认 0
 * @param options.AlignHorizontal 水平对齐方式，默认 `Center`
 * @param options.Direction 排列方向，默认 `Forward`
 */
export function LayoutVertical(
  container: Node,
  options?: {
    PaddingLeft?: number;
    PaddingRight?: number;
    PaddingTop?: number;
    PaddingBottom?: number;
    SpacingY?: number;
    AlignHorizontal?: 'Left' | 'Center' | 'Right';
    Direction?: 'Forward' | 'Backward';
  },
) {
  // 初始化选项
  options = {
    PaddingLeft: 0,
    PaddingRight: 0,
    PaddingTop: 0,
    PaddingBottom: 0,
    SpacingY: 0,
    AlignHorizontal: 'Center',
    Direction: 'Forward',
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(
      options.PaddingLeft! + options.PaddingRight!,
      options.PaddingTop! + options.PaddingBottom!,
    );
    return;
  }

  // 计算容器尺寸
  const items = container.children;
  let containerWidth = 0;
  let containerHeight =
    options.PaddingTop! + options.PaddingBottom! + (count - 1) * options.SpacingY!;
  const sizes: [width: number, height: number][] = [];

  items.forEach((item) => {
    const { width, height } = item.getComponent(UITransform)!;
    containerHeight += height;
    containerWidth = Math.max(containerWidth, width);
    sizes.push([width, height]);
  });

  containerWidth += options.PaddingLeft! + options.PaddingRight!;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currX = (0.5 - uit.anchorX) * containerWidth;
  let currY = (1 - uit.anchorY) * containerHeight - options.PaddingTop!;
  switch (options.AlignHorizontal) {
    case 'Left':
      currX += -containerWidth * 0.5 + options.PaddingLeft!;
      break;
    case 'Right':
      currX += containerWidth * 0.5 - options.PaddingRight!;
      break;
  }

  // 执行布局
  const [start, end] = options.Direction === 'Forward' ? [0, count] : [count, 0];
  for (const i of Range(start, end)) {
    const item = items[i];
    const [width, height] = sizes[i];
    item.y = currY - height * 0.5;
    currY -= height + options.SpacingY!;
    switch (options.AlignHorizontal) {
      case 'Left':
        item.x = currX + width * 0.5;
        break;
      case 'Center':
        item.x = currX;
        break;
      case 'Right':
        item.x = currX - width * 0.5;
        break;
    }
  }
}

/**
 * 流式布局
 * @param container 容器
 * @param options 选项
 * @param options.MaxWidth 最大宽度，默认 0
 * @param options.LineHeight 行高，默认 20
 * @param options.PaddingLeft 左边距，默认 0
 * @param options.PaddingRight 右边距，默认 0
 * @param options.PaddingTop 上边距，默认 0
 * @param options.PaddingBottom 下边距，默认 0
 * @param options.SpacingX 水平间距，默认 0
 * @param options.SpacingY 垂直间距，默认 0
 * @param options.AlignVertical 垂直对齐方式，默认 `Center`
 * @param options.Direction 排列方向，默认 `Forward`
 */
export function LayoutFlow(
  container: Node,
  options: {
    PaddingLeft?: number;
    PaddingRight?: number;
    PaddingTop?: number;
    PaddingBottom?: number;
    SpacingX?: number;
    SpacingY?: number;
    MaxWidth?: number;
    LineHeight?: number;
    AlignVertical?: 'Top' | 'Center' | 'Bottom';
    Direction?: 'Forward' | 'Backward';
  },
) {
  // 初始化选项
  options = {
    PaddingLeft: 0,
    PaddingRight: 0,
    PaddingTop: 0,
    PaddingBottom: 0,
    SpacingX: 0,
    SpacingY: 0,
    MaxWidth: 0,
    AlignVertical: 'Center',
    Direction: 'Forward',
    LineHeight: 20,
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(
      options.PaddingLeft! + options.PaddingRight!,
      options.PaddingTop! + options.PaddingBottom!,
    );
    return;
  }

  // 最大宽度为 0 时，使用屏幕可见宽度
  if (options.MaxWidth === 0) {
    options.MaxWidth = view.getVisibleSize().width;
  }

  // 计算容器尺寸
  const items = container.children;
  const containerWidth = options.MaxWidth!;
  let containerHeight = options.PaddingTop! + options.PaddingBottom!;
  const minWidth = options.PaddingLeft! + options.PaddingRight!;
  let currWidth = minWidth;
  let currLine = 0;
  const lines: { height: number; sizes: [number, number, string][] }[] = [];

  items.forEach((v: Node) => {
    const item = v as Node & { __hyper_char__: string };
    const { width, height } = item.getComponent(UITransform)!;
    if (currLine === 0 && width >= containerWidth) {
      // 如果第一个子项的宽度大于容器宽度或子项为换行符，则添加子项后再换行
      (lines[currLine] ??= { height, sizes: [] }).sizes.push([width, height, item.__hyper_char__]);
      currWidth = minWidth;
      currLine++;
    } else if (item.__hyper_char__ === '\n') {
      // 如果子项为换行符，则换行后再添加子项
      lines[currLine] ??= { height, sizes: [] };
      lines[currLine].height = lines[currLine].sizes
        .map((v) => v[1])
        .reduce((a, b) => Math.max(a, b), 0);
      currWidth = minWidth;
      currLine++;
      (lines[currLine] ??= { height, sizes: [] }).sizes.push([
        0,
        options.LineHeight!,
        item.__hyper_char__,
      ]);
    } else if (currWidth + width > containerWidth) {
      // 如果新增的子项宽度加上当前行宽度大于容器宽度，则换行后再添加子项
      if (!lines[currLine]) {
        lines[currLine] = { height: 0, sizes: [] };
      }
      lines[currLine].height = lines[currLine].sizes
        .map((v) => v[1])
        .reduce((a, b) => Math.max(a, b), 0);
      currWidth = minWidth + width + options.SpacingX!;
      currLine++;
      (lines[currLine] ??= { height: options.LineHeight!, sizes: [] }).sizes.push([
        width,
        height,
        item.__hyper_char__,
      ]);
    } else {
      // 否则继续添加子项
      currWidth += width + options.SpacingX!;
      (lines[currLine] ??= { height: 0, sizes: [] }).sizes.push([
        width,
        height,
        item.__hyper_char__,
      ]);
    }
  });

  if (!lines[currLine]) {
    lines[currLine] = { height: 0, sizes: [] };
  }
  lines[currLine].height = lines[currLine].sizes
    .map((v) => v[1])
    .reduce((a, b) => Math.max(a, b), 0);
  lines.forEach((line) => (containerHeight += line.height));
  containerHeight += (lines.length - 1) * options.SpacingY!;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currY = (1 - uit.anchorY) * containerHeight - options.PaddingTop!;

  // 执行布局
  let index = -1;
  for (const line of Range(0, lines.length)) {
    const { height: lineHeight, sizes: lineSizes } = lines[line];
    let currX = -containerWidth * uit.anchorX + options.PaddingLeft!;
    for (const seq of Range(0, lineSizes.length)) {
      const item = items[++index] as Node & { __hyper_char__: string };
      let [width, height] = lineSizes[seq];
      if (item.__hyper_char__ === '\n') {
        width = height = 0;
      }
      item.x = currX + width * 0.5;
      switch (options.AlignVertical) {
        case 'Top':
          item.y = currY - height * 0.5;
          break;
        case 'Center':
          item.y = currY - lineHeight * 0.5;
          break;
        case 'Bottom':
          item.y = currY - lineHeight + height * 0.5;
          break;
      }
      currX += width + options.SpacingX!;
    }
    currY -= lineHeight + options.SpacingY!;
  }
}

/**
 * 网格布局
 * @param container 容器
 * @param options 选项
 * @param options.PaddingLeft 左边距，默认 0
 * @param options.PaddingRight 右边距，默认 0
 * @param options.PaddingTop 上边距，默认 0
 * @param options.PaddingBottom 下边距，默认 0
 * @param options.SpacingX 水平间距，默认 0
 * @param options.SpacingY 垂直间距，默认 0
 * @param options.Cols 列数，默认 1
 * @param options.CellWidth 单元格宽度，默认 0
 * @param options.CellHeight 单元格高度，默认 0
 * @param options.Direction 排列方向，默认 'horizontal'
 */
export function LayoutGrid(
  container: Node,
  options: {
    Cols?: number;
    CellWidth?: number;
    CellHeight?: number;
    PaddingLeft?: number;
    PaddingRight?: number;
    PaddingTop?: number;
    PaddingBottom?: number;
    SpacingX?: number;
    SpacingY?: number;
    Direction?: 'horizontal' | 'vertical';
  } = {},
) {
  // 初始化选项
  options = {
    PaddingLeft: 0,
    PaddingRight: 0,
    PaddingTop: 0,
    PaddingBottom: 0,
    SpacingX: 0,
    SpacingY: 0,
    CellWidth: 0,
    CellHeight: 0,
    Cols: 1,
    Direction: 'horizontal',
    ...options,
  };
  options.Cols = Math.max(1, Number.isFinite(options.Cols) ? Math.ceil(options.Cols as number) : 1);

  const uit = container.getComponent(UITransform)!;
  const items = container.children;
  const count = items.length;

  // 计算容器宽度
  const containerWidth =
    options.PaddingLeft! +
    options.PaddingRight! +
    options.SpacingX! * (options.Cols - 1) +
    options.CellWidth! * options.Cols;

  if (count === 0) {
    uit.setContentSize(
      containerWidth,
      options.PaddingTop! + options.PaddingBottom! + options.CellHeight!,
    );
    return;
  }

  // 计算容器尺寸
  const rows = Math.ceil(count / options.Cols);
  const containerHeight =
    options.PaddingTop! +
    options.PaddingBottom! +
    options.SpacingY! * (rows - 1) +
    options.CellHeight! * rows;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  const fromX = -uit.anchorX * containerWidth + options.PaddingLeft!;
  const fromY = (1 - uit.anchorY) * containerHeight;
  let currX = fromX;
  let currY = fromY;

  // 执行布局
  if (options.Direction === 'horizontal') {
    for (const i of Range(0, count)) {
      const item = items[i];
      const height = options.CellHeight!;
      const col = i % options.Cols;
      if (col == 0) {
        currX = fromX;
        currY -= height + options.SpacingY!;
      }
      item.x = currX + options.CellWidth! * 0.5;
      currX += options.CellWidth! + options.SpacingX!;
      item.y = currY + height * 0.5;
    }
  } else {
    for (const i of Range(0, count)) {
      const item = items[i];
      const height = options.CellHeight!;
      const row = i % rows; // 把列作为行
      item.y = currY - height * 0.5;
      item.x = currX + options.CellWidth! * 0.5;
      currY -= height + options.SpacingY!;
      if (row === rows - 1) {
        currX += options.CellWidth! + options.SpacingX!;
        currY = fromY;
      }
    }
  }
}
