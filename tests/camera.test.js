import { PerspectiveCamera } from '../scripts/camera.js';
// camera.jsをインポートする必要がある場合は、<script>タグでqunit.htmlに追加してください。
// ここでは仮にCameraクラスがグローバルで利用可能と仮定します。

QUnit.module('Camera', function() {
    QUnit.test('PerspectiveCameraの初期化', function(assert) {
        // 仮のコンストラクタ: new PerspectiveCamera(fov, aspect, near, far)
        const fov = 60;
        const aspect = 16 / 9;
        const near = 0.1;
        const far = 1000;
        const camera = new PerspectiveCamera(fov, aspect, near, far);

        assert.ok(camera, 'カメラインスタンスが生成される');
        assert.ok(camera.type === 'camera', 'カメラのタイプが正しく設定される');
        assert.equal(camera.fov, fov, 'fovが正しく設定される');
        assert.equal(camera.aspect, aspect, 'aspectが正しく設定される');
        assert.equal(camera.near, near, 'nearが正しく設定される');
        assert.equal(camera.far, far, 'farが正しく設定される');
    });

    QUnit.test('カメラの位置設定', function(assert) {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [1, 2, 3];

        assert.deepEqual(
            [camera.position[0], camera.position[1], camera.position[2]],
            [1, 2, 3],
            'カメラの位置が正しく設定される'
        );
    });

    QUnit.test('カメラのlookAt', function(assert) {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [0, 0, 0];
        camera.lookAt(0, 0, -1);

        // lookAtの結果を検証（実装によって異なるため、適宜修正）
        assert.ok(camera.mdlViewMtx, 'カメラのワールド行列が存在する');
    });

    QUnit.test('カメラのlook', function(assert) {
        const camera = new PerspectiveCamera(60, 1.0, 0.1, 1000);
        camera.position = [0, 0, 0];
        camera.lookAt(0, 0, -1);
        assert.ok(camera.mdlViewMtx, 'カメラのワールド行列が存在する');
    });

});