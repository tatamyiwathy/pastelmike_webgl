
export const vec3 = {
    // ベクトルの正規化
    normalize: function (v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 0, 0];
    },

    // 外積
    cross: function (a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    },

    // 内積
    dot: function (a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    add: function (a, b) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2]
        ];
    }
};

export const mat4 = {
    // 単位行列の生成
    identity: function () {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },

    // 4x4行列の乗算（列優先：column-major）
    multiply4x4: function (a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    // 列優先: result[j*4+i] = a[k*4+i] * b[j*4+k]
                    sum += a[k * 4 + i] * b[j * 4 + k];
                }
                result[j * 4 + i] = sum;
            }
        }
        return result;
    },

    // 平行移動行列
    translation: function (x, y, z) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    },

    // Y軸回転行列
    rotationY: function (angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Float32Array([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    },

    // 拡大縮小行列
    scaling: function (sx, sy, sz) {
        return new Float32Array([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1
        ]);
    },

    // 任意の軸周りの回転行列（ロドリゲスの回転公式）
    rotationAxis: function (axis, angleInRadians) {
        const [x, y, z] = this.normalize(axis);
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        const t = 1 - c;

        const mtx = new Float32Array([
            t * x * x + c, t * x * y - z * s, t * x * z + y * s, 0,
            t * x * y + z * s, t * y * y + c, t * y * z - x * s, 0,
            t * x * z - y * s, t * y * z + x * s, t * z * z + c, 0,
            0, 0, 0, 1
        ]);
        return mtx;
    },


    // 法線行列の計算（モデルビュー行列の逆転置行列）
    normal4x4: function (modelView) {
        // 3x3 部分を抽出して逆転置
        const m = new Float32Array(9);
        // 逆行列を求める
        const det = modelView[0] * (modelView[5] * modelView[10] - modelView[6] * modelView[9]) -
            modelView[1] * (modelView[4] * modelView[10] - modelView[6] * modelView[8]) +
            modelView[2] * (modelView[4] * modelView[9] - modelView[5] * modelView[8]);

        if (Math.abs(det) < 0.0001) {
            // 特異行列の場合は単位行列を返す
            return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        }

        const invDet = 1.0 / det;
        m[0] = (modelView[5] * modelView[10] - modelView[6] * modelView[9]) * invDet;
        m[1] = (modelView[2] * modelView[9] - modelView[1] * modelView[10]) * invDet;
        m[2] = (modelView[1] * modelView[6] - modelView[2] * modelView[5]) * invDet;
        m[3] = (modelView[6] * modelView[8] - modelView[4] * modelView[10]) * invDet;
        m[4] = (modelView[0] * modelView[10] - modelView[2] * modelView[8]) * invDet;
        m[5] = (modelView[2] * modelView[4] - modelView[0] * modelView[6]) * invDet;
        m[6] = (modelView[4] * modelView[9] - modelView[5] * modelView[8]) * invDet;
        m[7] = (modelView[1] * modelView[8] - modelView[0] * modelView[9]) * invDet;
        m[8] = (modelView[0] * modelView[5] - modelView[1] * modelView[4]) * invDet;

        // 転置（3x3）
        const result = new Float32Array(16);
        result[0] = m[0]; result[4] = m[3]; result[8] = m[6];
        result[1] = m[1]; result[5] = m[4]; result[9] = m[7];
        result[2] = m[2]; result[6] = m[5]; result[10] = m[8];
        result[15] = 1;
        return result;
    },

    // ビュー行列の平行移動成分をリセットするカスタム関数
    getDirectionMatrix: (viewMatrix) => {
        const m = new Float32Array(viewMatrix);
        m[12] = m[13] = m[14] = 0; // x, y, zの平行移動成分を0に
        return m;
    }
};

export const MathUtils = {

    // 透視射影行列
    perspectiveMatrix: function (fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    },

    // ビュー行列（カメラ位置とターゲット位置から）
    lookAt: function (cameraPos, target, up) {
        // Z軸（カメラの前方向の逆）
        const zAxis = vec3.normalize([
            cameraPos[0] - target[0],
            cameraPos[1] - target[1],
            cameraPos[2] - target[2]
        ]);

        // X軸（右方向）
        const xAxis = vec3.normalize(vec3.cross(up, zAxis));

        // Y軸（上方向）
        const yAxis = vec3.cross(zAxis, xAxis);

        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -vec3.dot(xAxis, cameraPos),
            -vec3.dot(yAxis, cameraPos),
            -vec3.dot(zAxis, cameraPos),
            1
        ]);
    },

    look: function (cameraPos, forward, up) {
        // cameraPos: [x, y, z]
        // forward: [x, y, z] (カメラの視線方向。必ず単位ベクトルにすること)
        // up: [x, y, z] (世界の真上 [0, 1, 0] など)

        const zAxis = vec3.normalize([-forward[0], -forward[1], -forward[2]]);
        const xAxis = vec3.normalize(vec3.cross(up, zAxis));
        const yAxis = vec3.cross(zAxis, xAxis); // 正規化済みベクトル同士の外積なので再正規化不要

        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -vec3.dot(xAxis, cameraPos),
            -vec3.dot(yAxis, cameraPos),
            -vec3.dot(zAxis, cameraPos),
            1
        ]);
    }

};

