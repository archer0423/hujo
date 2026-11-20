/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import {
  sp,
  AnimationClip,
  AudioClip,
  BitmapFont,
  BufferAsset,
  ImageAsset,
  JsonAsset,
  ParticleAsset,
  Prefab,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TiledMapAsset,
  TTFFont,
  VideoClip,
} from 'cc';

import { CargoCtor, CargoType, CargoURI } from './typings';

/** 资产类型 */
const CARGO_TYPES: CargoType[] = [
  'image',
  'texture',
  'sprite-frame',
  'sprite-atlas',
  'ttfont',
  'bmfont',
  'buffer',
  'text',
  'json',
  'skeleton',
  'audio',
  'video',
  'particle',
  'tiledmap',
  'animation',
  'prefab',
] as const;

/** 资产类型与资源类型映射 */
const CARGO_MAPPINGS: Record<string, CargoCtor> = {
  ['image']: ImageAsset,
  ['texture']: Texture2D,
  ['sprite-frame']: SpriteFrame,
  ['sprite-atlas']: SpriteAtlas,
  ['ttfont']: TTFFont,
  ['bmfont']: BitmapFont,
  ['buffer']: BufferAsset,
  ['text']: TextAsset,
  ['json']: JsonAsset,
  ['skeleton']: sp.SkeletonData,
  ['audio']: AudioClip,
  ['video']: VideoClip,
  ['particle']: ParticleAsset,
  ['tiledmap']: TiledMapAsset,
  ['animation']: AnimationClip,
  ['prefab']: Prefab,
};

/**
 * 解析资产标识
 * @param uri 资产标识
 * @returns
 */
export function ParseCargoURI(uri: CargoURI): [string, string, CargoType, string] {
  const ea = uri.lastIndexOf('.');
  const hash = uri.lastIndexOf('#');
  const at = uri.indexOf('@');
  const protocol = at > 0 ? uri.slice(0, at) : '';
  const path = at > 0 ? uri.slice(at + 1, hash > at ? hash : undefined) : '';
  const type = hash > at ? uri.slice(hash + 1, ea > hash ? ea : undefined) : '';
  const ext = ea > hash ? uri.slice(ea) : '';
  return [protocol, path, type as CargoType, ext];
}

/**
 * 是否有效的资产标识
 * @param uri 资产标识
 * @returns
 */
export function IsValidCargoURI(uri: CargoURI) {
  const [protocol, path, type] = ParseCargoURI(uri);
  if (typeof protocol !== 'string' || typeof path !== 'string' || typeof type !== 'string') {
    return false;
  }
  if (!protocol || !path || !type || !CARGO_TYPES.includes(type)) {
    return false;
  }
  return true;
}

/** 获取资产构造工厂 */
export function GetCargoFactory(type: CargoType): CargoCtor {
  return CARGO_MAPPINGS[type];
}
