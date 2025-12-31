import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Scene, ObjGroup } from '../scripts/scene.js';
import { Object3d } from '../scripts/object_3d.js';

// ダミーのLightクラス
class DummyLight extends Object3d {
  constructor(kind = 'point') {
    super('light');
    this.lightKind = kind;
  }
}

describe('Scene', () => {
  let scene;

  beforeEach(() => {
    scene = new Scene();
  });

  it('初期化時に3つのObjGroupを持つ', () => {
    expect(scene.children.length).toBe(3);
    expect(scene.children[0]).toBeInstanceOf(ObjGroup);
    expect(scene.children[1]).toBeInstanceOf(ObjGroup);
    expect(scene.children[2]).toBeInstanceOf(ObjGroup);
  });

  it('addでオブジェクトを指定レイヤーに追加できる', () => {
    const obj = new Object3d('test');
    scene.add(obj, { layer: 1 });
    expect(scene.children[1].children).toContain(obj);
  });

  it('addでtypeがlightの時lights配列に追加される', () => {
    const light = new DummyLight('point');
    scene.add(light, { layer: 0 });
    expect(scene.lights).toContain(light);
  });

  it('getPointLightsでpointライトのみ取得できる', () => {
    const pointLight = new DummyLight('point');
    const dirLight = new DummyLight('directional');
    dirLight.lightKind = 'directional';
    scene.add(pointLight, { layer: 0 });
    scene.add(dirLight, { layer: 0 });
    const points = scene.getPointLights();
    expect(points).toContain(pointLight);
    expect(points).not.toContain(dirLight);
  });

  it('disposeで各グループのdisposeが呼ばれる', () => {
    const mockDispose = vi.fn();
    scene.children.forEach(g => g.dispose = mockDispose);
    scene.dispose('dummyGL');
    expect(mockDispose).toHaveBeenCalledTimes(3);
  });
  it('ObjGroupのdisposeが子のdisposeを呼ぶ', () => {
    const group = new ObjGroup();
    const child1 = new Object3d('child1');
    const child2 = new Object3d('child2');
    group.add(child1);
    group.add(child2);
    const mockDispose = vi.fn();
    child1.dispose = mockDispose;
    child2.dispose = mockDispose;
    group.dispose('dummyGL');
    expect(mockDispose).toHaveBeenCalledTimes(2);
  });

  it('SceneのupdateFrameが各子のupdateFrameを呼ぶ', () => {
    // 3レイヤーの各グループに1つずつObject3dを追加
    scene.children.forEach((group, i) => {
      const obj = new Object3d('obj'+i);
      group.add(obj);
      obj.updateFrame = vi.fn();
    });
    scene.updateFrame(0.16);
    scene.children.forEach(group => {
      group.children.forEach(obj => {
        expect(obj.updateFrame).toHaveBeenCalledWith(0.16);
      });
    });
  });
});
