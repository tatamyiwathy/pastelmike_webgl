import { mat4, vec3, vec4 } from 'gl-matrix';
import { Object3d } from './object_3d.js';
import { ShadowMap } from './shadow_map.js';
import { MathUtils } from './math_utils.js';


class DirectionLight extends Object3d {
    constructor(gl, args = {}) {
        super('light');
        // 位置を設定（指定がなければ上空のデフォルト位置）
        this.position = args.position || [0, 10, 0];
        this.targetPosition = args.targetPosition || [0, 0, 0];
        this.color = args.color || [1, 1, 1]; // 白色光源
        this.lightKind = "directional";
        this.enableShadow = args.enableShadow || false;
        this._direction = vec3.create();
        vec3.sub(this._direction, this.targetPosition, this.position);
        vec3.normalize(this._direction, this._direction);
        // Y軸ベクトルとdirectionベクトルが平行かどうか
        const d = vec3.dot(this._direction, [0, 1, 0]);
        if (Math.abs(d) > 0.999) {
            // 平行ならばZ軸を上向きベクトルにする
            this.up = vec3.fromValues(0, 0, 1);
        } else {
            this.up = vec3.fromValues(0, 1, 0);
        }

        // シャドウマップ用のパラメータ
        if (this.enableShadow) {
            this.near = args.near || 1.0;
            this.far = args.far || 50.0;

            this.shadowBoxSize = args.shadowBoxSize || 10; // シャドウマップに含める範囲の半分の長さ
            this.lightSpaceMatrix = mat4.create();

            const shadowMapSize = 1024;
            this.shadowMap = new ShadowMap(gl, shadowMapSize);

            // 互換性のため、古いプロパティ名も保持
            this.frameBuffer = this.shadowMap.framebuffer;
            this.texture = this.shadowMap.texture;
            this.frameBufferSize = shadowMapSize;
        }
    }

    get targetPosition() {
        return this._targetPosition;
    }

    set targetPosition(v) {
        if (v instanceof Float32Array) {
            this._targetPosition = v;
        } else if (Array.isArray(v)) {
            this._targetPosition = vec3.fromValues(...v);
        } else {
            throw new Error('targetPosition must be Float32Array or array');
        }
    }

    // directionはpositionとtargetPositionから自動計算されるため、setterは用意しない
    get direction() {
        return this._direction;
    }

    updateMatrix(cameraMatrix, proj_view) {
        // direction更新
        vec3.sub(this._direction, this.targetPosition, this.position);
        vec3.normalize(this._direction, this._direction);

        if (!this.enableShadow) return;

        // light view
        const target = vec3.create();
        vec3.add(target, this.position, this._direction);
        const lightViewMatrix = mat4.lookAt(mat4.create(), this.position, target, this.up);

        // inv VP (camera)
        const invViewProj = mat4.create();
        mat4.invert(invViewProj, proj_view);

        // frustum corners in world
        const ndcCorners = [
            [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
            [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1],
        ];

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (const p of ndcCorners) {
            const v = vec4.fromValues(p[0], p[1], p[2], p[3]);
            vec4.transformMat4(v, v, invViewProj);
            v[0] /= v[3]; v[1] /= v[3]; v[2] /= v[3];
            v[3] = 1.0;

            const lv = vec4.create();
            vec4.transformMat4(lv, v, lightViewMatrix);

            minX = Math.min(minX, lv[0]); maxX = Math.max(maxX, lv[0]);
            minY = Math.min(minY, lv[1]); maxY = Math.max(maxY, lv[1]);
            minZ = Math.min(minZ, lv[2]); maxZ = Math.max(maxZ, lv[2]);
        }

        // margins (safe for angled lights)
        const marginXY = 12.0;
        const marginZ = 80.0;
        minX -= marginXY; maxX += marginXY;
        minY -= marginXY; maxY += marginXY;
        minZ -= marginZ; maxZ += marginZ;

        // ensure near <= far
        let nearZ = minZ - marginZ, farZ = maxZ + marginZ;
        if (nearZ > farZ) { const t = nearZ; nearZ = farZ; farZ = t; }

        const lightProjMatrix = mat4.ortho(mat4.create(), minX, maxX, minY, maxY, nearZ, farZ);

        mat4.multiply(this.lightSpaceMatrix, lightProjMatrix, lightViewMatrix);
    }
}



class PointLight extends Object3d {
    constructor(gl, args = {}) {
        super('light', args);
        this.lightKind = "point";
        this.color = args.color || [1, 1, 1]; // 白色光源
        this.constant = args.constant || 1.0; // 減衰係数（定数項）
        this.linear = args.linear || 0.001; // 減衰係数（一次項）
        this.quadratic = args.quadratic || 0; // 減衰係数（二次項）
    }
}
export { DirectionLight, PointLight };