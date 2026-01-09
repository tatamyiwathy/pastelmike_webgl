import { describe, it, expect, test } from 'vitest';
import { Object3d, Animator } from '../scripts/object_3d.js';

describe('Object3d', () => {
  test('初期値が正しい', () => {
    const obj = new Object3d('test');
    expect(obj.type).toBe('test');
    expect(Array.from(obj.position)).toEqual([0,0,0]);
    expect(Array.from(obj.rotation)).toEqual([0,0,0]);
    expect(Array.from(obj.scale)).toEqual([1,1,1]);
    expect(Array.from(obj.up)).toEqual([0,1,0]);
    expect(Array.from(obj.clip)).toEqual([0,0,0,0]);
    expect(obj.children).toEqual([]);
    expect(obj.parent).toBeNull();
    expect(obj.animator).toBeNull();
  });

  test('setterでFloat32Arrayを受け付ける', ()=>{
    const obj = new Object3d();
    obj.position = new Float32Array([1,2,3]);
    obj.position.forEach((v, i) => expect(v).toBeCloseTo([1,2,3][i]));
    obj.rotation = new Float32Array([0.1,0.2,0.3]);
    obj.rotation.forEach((v, i) => expect(v).toBeCloseTo([0.1,0.2,0.3][i]));
    obj.scale = new Float32Array([2,2,2]);
    obj.scale.forEach((v, i) => expect(v).toBeCloseTo([2,2,2][i]));
    obj.up = new Float32Array([0,0,1]);
    obj.up.forEach((v, i) => expect(v).toBeCloseTo([0,0,1][i]));
    obj.clip = new Float32Array([1,2,3,4]);
    obj.clip.forEach((v, i) => expect(v).toBeCloseTo([1,2,3,4][i]));
    
  });

  test('position/rotation/scale/up/clipのsetterが配列も受け付ける', () => {
    const obj = new Object3d();
    obj.position = [1,2,3];
    obj.position.forEach((v, i) => expect(v).toBeCloseTo([1,2,3][i]));
    obj.rotation = [0.1,0.2,0.3];
    obj.rotation.forEach((v, i) => expect(v).toBeCloseTo([0.1,0.2,0.3][i]));
    obj.scale = [2,2,2];
    obj.scale.forEach((v, i) => expect(v).toBeCloseTo([2,2,2][i]));
    obj.up = [0,0,1];
    obj.up.forEach((v, i) => expect(v).toBeCloseTo([0,0,1][i]));
    obj.clip = [1,2,3,4];
    obj.clip.forEach((v, i) => expect(v).toBeCloseTo([1,2,3,4][i]));
  });
  test('position/rotation/scale/up/clipのsetterが配列/Float32Array以外を受け付けない', () => {
    const obj = new Object3d();
    expect(() => {
        obj.position = "invalid";
    }).toThrow('position must be Float32Array or array');
    expect(() => {
        obj.rotation = 123;
    }).toThrow('rotation must be Float32Array or array');
    expect(() => {
        obj.scale = {x:1, y:1, z:1};
    }).toThrow('scale must be Float32Array or array');
    expect(() => {
        obj.up = null;
    }).toThrow('up must be Float32Array or array');
    expect(() => {
        obj.clip = undefined;
    }).toThrow('clip must be Float32Array or array');
  });

  test('addで子が追加され親子関係ができる', () => {
    const parent = new Object3d('parent');
    const child = new Object3d('child');
    parent.add(child);
    expect(parent.children[0]).toBe(child);
    expect(child.parent).toBe(parent);
  });

  test('rotateX/rotateYでクォータニオンが変化する', () => {
    const obj = new Object3d();
    const before = obj.quaternion.slice();
    obj.rotateY(Math.PI/2);
    expect(obj.quaternion).not.toEqual(before);
    obj.rotateX(Math.PI/2);
    expect(obj.quaternion).not.toEqual(before);
  });

  test('animatorがあればupdateFrameで呼ばれる', () => {
    let called = false;
    const animator = { update: () => { called = true; } };
    const obj = new Object3d('', { animator });
    obj.updateFrame(0.016);
    expect(called).toBe(true);
  });

  test('updateMatrixでmvpMtx, worldMtx, normalMtx, clipが更新される', () => {
    const obj = new Object3d();
    // 単位行列とする
    const identity = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    obj.position = [1,2,3];
    obj.scale = [2,2,2];
    obj.rotation = [0,0,0];
    // クォータニオンは初期値(回転なし)
    const cameraMatrix = {
      view: identity,
      projection: identity
    };
    obj.updateMatrix(cameraMatrix, identity);
    // mvpMtx, worldMtx, normalMtx, clipがFloat32Arrayであること
    expect(obj.mvpMtx).toBeInstanceOf(Float32Array);
    expect(obj.worldMtx).toBeInstanceOf(Float32Array);
    expect(obj.normalMtx).toBeInstanceOf(Float32Array);
    expect(obj.clip).toBeInstanceOf(Float32Array);
    // clip座標は[1,2,3,1]に近い（単位行列なので）
    [1,2,3,1].forEach((v,i)=>expect(obj.clip[i]).toBeCloseTo(v));
  });


  test('tagNameが設定できる', () => {
    const obj = new Object3d('test', { tagName: 'myTag' });
    expect(obj.tagName).toBe('myTag');
  });
});

describe('Animator', () => {
  test('インスタンス化できる', () => {
    const animator = new Animator();
    expect(animator).toBeInstanceOf(Animator);
  });
  test('updateは何も起こさない', () => {
    const animator = new Animator();
    expect(animator.update({}, 0.016)).toBeUndefined();
  });
});
