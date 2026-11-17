/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { builtinResMgr, instantiate, Material, Node, UIRenderer } from 'cc';

import { journal } from '../core/journal';

/** 材质属性值（覆盖常用标量、向量、数组等 setProperty 可接受的类型） */
export type MaterialPropertyValue = unknown;

/** 材质属性映射表（传给 ApplyFilter 的 properties 参数） */
export type MaterialProperties = Record<string, MaterialPropertyValue | MaterialPropertyValue[]>;

/** 各渲染器被滤镜接管前的原始材质，CancelFilter 据此恢复 */
const originalMaterials = new WeakMap<UIRenderer, Material | null>();

/**
 * 运行时校验节点（JS 调用方可传任意值）
 *
 * null/undefined 与已销毁节点静默跳过；伪 Node（如 {isValid:true} 的普通对象）
 * 在源头抛归一错误，胜过在库内深处抛 getComponentsInChildren is not a function
 *
 * @returns 是否继续处理该节点
 */
function ensureNode(node: Node, tag: string): boolean {
  if (!node) return false;
  if (
    typeof node.isValid !== 'boolean' ||
    typeof (node as unknown as { getComponentsInChildren?: unknown }).getComponentsInChildren !==
      'function'
  ) {
    journal.system.error(`${tag}: node 须为 cc.Node 实例`);
    return false;
  }
  return node.isValid;
}

/**
 * 运行时校验材质（JS 调用方可传任意值）
 * @returns 是否可用
 */
function ensureMaterial(material: Material): boolean {
  if (!material) return false;
  if (typeof (material as unknown as { setProperty?: unknown }).setProperty !== 'function') {
    return false;
  }
  // 尽可能做更强校验：Material 实例通常具备 copy/passes 或继承自 Asset
  const m = material as unknown as { copy?: unknown; passes?: unknown; _uuid?: unknown };
  return typeof m.copy === 'function' || Array.isArray(m.passes) || typeof m._uuid === 'string';
}

/**
 * 设置节点材质（包括子节点）
 *
 * @param node - 目标节点
 * @param material - 滤镜材质（必填，非空）。取消滤镜请使用 CancelFilter
 * @param properties - 材质属性的可选映射表（写入材质私有副本，不污染传入材质）
 * @tip 一次性遍历：接管后新增的子节点渲染器不受滤镜影响，CancelFilter 同样不会处理它们
 */
export function ApplyFilter(node: Node, material: Material, properties?: MaterialProperties): void {
  if (!ensureNode(node, 'ApplyFilter')) return;
  // 运行时校验（JS 调用方可传任意值）：在源头抛明确错误，胜过在库内深处抛 setProperty is not a function
  if (!ensureMaterial(material)) {
    throw new TypeError('ApplyFilter: material 须为 cc.Material 实例；取消滤镜请使用 CancelFilter');
  }

  // 材质是共享资源（内置材质为全局单例）：属性写入私有副本，避免污染原材质影响其他用途
  let target: Material = material;
  if (properties) {
    try {
      target = instantiate(material);
      for (const p of Object.keys(properties)) {
        // Object.keys：仅遍历自有属性，避免 for...in 把原型链上的可枚举属性也写入材质
        target.setProperty(p, properties[p] as never);
      }
    } catch (err) {
      journal.system.error('ApplyFilter: 材质克隆或属性写入失败', err);
      return;
    }
  }

  const renders = node.getComponentsInChildren(UIRenderer);
  for (let i = 0, l = renders.length; i < l; i++) {
    const render = renders[i];
    try {
      if (!originalMaterials.has(render)) {
        originalMaterials.set(render, render.customMaterial); // 首次接管记录原材质，刷新滤镜不覆盖
      }
      render.customMaterial = target;
    } catch (err) {
      // 逐渲染器隔离：单个失败（如材质不兼容）不中断其余，避免留下半应用状态且无告警
      journal.system.error(`ApplyFilter: 应用材质至渲染器失败（第 ${i + 1}/${l} 个）`, err);
    }
  }
}

/**
 * 将节点恢复正常（恢复被滤镜接管前的原始材质）
 * @tip 一次性遍历：仅处理调用时已存在的渲染器，接管后新增的子节点渲染器不在恢复范围
 * @param node - 目标节点
 */
export function CancelFilter(node: Node): void {
  if (!ensureNode(node, 'CancelFilter')) return;
  const renders = node.getComponentsInChildren(UIRenderer);
  for (let i = 0, l = renders.length; i < l; i++) {
    const render = renders[i];
    try {
      // 仅恢复被接管过的渲染器；未接管的保持现状，避免误清调用方已有材质配置
      if (originalMaterials.has(render)) {
        render.customMaterial = originalMaterials.get(render)!;
        originalMaterials.delete(render);
      }
    } catch (err) {
      journal.system.error(`CancelFilter: 恢复渲染器材质失败（第 ${i + 1}/${l} 个）`, err);
    }
  }
}

/**
 * 将节点置灰
 * 使用灰色材质将节点及其子节点设置为灰度显示
 * @param node - 目标节点
 * @param grayMaterial - 可选，自定义灰色材质；不传时使用内置 'ui-sprite-gray-material'
 */
export function TurnGray(node: Node, grayMaterial?: Material): void {
  if (grayMaterial) {
    if (!ensureMaterial(grayMaterial)) {
      journal.system.error('TurnGray: grayMaterial 须为 cc.Material 实例');
      return;
    }
    ApplyFilter(node, grayMaterial);
    return;
  }
  // 内置资源缺失时 get 返回 null，会让置灰退化为清空材质（节点视觉消失）且无法恢复，须显式拦截
  const gray = builtinResMgr.get<Material>('ui-sprite-gray-material');
  if (!gray) {
    journal.system.error('TurnGray: 内置灰色材质不可用');
    return;
  }
  ApplyFilter(node, gray);
}
