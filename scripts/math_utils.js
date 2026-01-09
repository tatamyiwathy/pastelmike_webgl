import { vec3, quat, mat4, vec4 } from 'gl-matrix';

// 
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


    quatFromVecToVec: function (outQuat, v0, v1) {
        // const a = vec3.normalize(vec3.create(), v0);
        // const b = vec3.normalize(vec3.create(), v1);
        const a = v0;
        const b = v1;

        const dot = vec3.dot(a, b);
        // 平行/逆平行の処理
        if (dot > 0.999999) {
            quat.identity(outQuat);              // 同じ方向
            return outQuat;
        }
        if (dot < -0.999999) {
            // 反対方向：aに直交する適当な軸を探す
            const axis = vec3.cross(vec3.create(), a, [1, 0, 0]);
            if (vec3.length(axis) < 1e-6) {
                vec3.cross(axis, a, [0, 1, 0]);    // aがx軸に平行だった場合
            }
            vec3.normalize(axis, axis);
            quat.setAxisAngle(outQuat, axis, Math.PI);
            return outQuat;
        }

        // 一般ケース：ハーフベクトルで軸と角を組む
        const axis = vec3.cross(vec3.create(), a, b);
        const s = Math.sqrt((1 + dot) * 2);    // = 2 * cos(θ/2)
        const invS = 1 / s;
        outQuat[0] = axis[0] * invS;
        outQuat[1] = axis[1] * invS;
        outQuat[2] = axis[2] * invS;
        outQuat[3] = s * 0.5;
        return quat.normalize(outQuat, outQuat);
    },

    getFrustumCornersWorldSpace: function (cameraMatrix) {
        const viewProj = mat4.create();
        mat4.multiply(viewProj, cameraMatrix.projection, cameraMatrix.view);

        const invViewProj = mat4.create();
        mat4.invert(invViewProj, viewProj);

        // WebGL(OpenGL) NDC: z = -1 near, +1 far
        const ndc = [
            [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
            [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1],
        ];

        const corners = [];
        for (const p of ndc) {
            const v = vec4.fromValues(p[0], p[1], p[2], p[3]);
            vec4.transformMat4(v, v, invViewProj);
            v[0] /= v[3]; v[1] /= v[3]; v[2] /= v[3];
            corners.push([v[0], v[1], v[2]]);
        }
        return corners;
    },


    fitDirLightOrthoToCamera: function (cameraMatrix, lightView, margin = 5.0) {
        const cornersWS = MathUtils.getFrustumCornersWorldSpace(cameraMatrix);

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (const c of cornersWS) {
            const v = vec4.fromValues(c[0], c[1], c[2], 1.0);
            vec4.transformMat4(v, v, lightView);
            minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
            minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
            minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
        }

        minX -= margin; maxX += margin;
        minY -= margin; maxY += margin;
        minZ -= margin; maxZ += margin;

        const lightProj = mat4.create();
        mat4.ortho(lightProj, minX, maxX, minY, maxY, minZ, maxZ);

        const lightSpace = mat4.create();
        mat4.multiply(lightSpace, lightProj, lightView);

        return { lightProj, lightSpace, bounds: { minX, maxX, minY, maxY, minZ, maxZ } };
    }


};

