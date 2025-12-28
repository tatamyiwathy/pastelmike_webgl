import * as glMatrix from 'gl-matrix';
import { describe, test, expect } from 'vitest';
import { PerspectiveCamera } from '../scripts/camera.js';

describe('Camera', () => {
    test('PerspectiveCameraの初期化', () => {
        const fov = 60;
        const aspect = 16 / 9;
        const near = 0.1;
        const far = 1000;
        const camera = new PerspectiveCamera(fov, aspect, near, far);
        expect(camera).toBeTruthy();
        expect(camera.type).toBe('camera');
        expect(camera.fov).toBe(fov);
        expect(camera.aspect).toBe(aspect);
        expect(camera.near).toBe(near);
        expect(camera.far).toBe(far);
    });

    test('カメラの位置設定', () => {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [1, 2, 3];
        expect([camera.position[0], camera.position[1], camera.position[2]]).toEqual([1, 2, 3]);
    });

    test('カメラのlookAt', () => {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [0, 0, 0];
        camera.lookAt(0, 0, -1);
        expect(camera.mdlViewMtx).toBeTruthy();
    });

    test('カメラのlook', () => {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [0, 0, 0];
        camera.lookAt(0, 0, -1);
        expect(camera.mdlViewMtx).toBeTruthy();
    });
});