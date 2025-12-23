import { Geometry } from './geometry.js';
import { Mesh } from './mesh.js';
import { CubeMapMaterial } from './material.js';
import { mat4 } from './math_utils.js';

class Skybox extends Mesh {
    constructor(gl, size, paths) {
        super(gl, new Geometry(gl,Skybox.positions), new CubeMapMaterial(gl,paths));
    }

    updateMatrix(projection, view, proj_view) 
    {
        // スカイボックス用の行列を計算: ビュー行列から平行移動成分を削除
        const viewDirectionMatrix = mat4.getDirectionMatrix(view);

        // ビュー方向行列と射影行列を結合
        this.mvpMtx = mat4.multiply4x4(projection, viewDirectionMatrix);

    }

    // キューブの頂点データ
    static positions = new Float32Array([
        -1, -1, -1,
        1,1,-1,
        -1,1,-1,
        
        -1,-1,-1,
        1,-1,-1,
        1,1,-1,

        -1,-1,1,
        1,1,1,
        -1,1,1,
        
        -1,-1,1,
        1,-1,1,
        1,1,1,

        -1,-1,1,
        -1,1,-1,
        -1,1,1,

        -1,-1, 1,
        -1,-1,-1,
        -1, 1,-1,

        1,-1, 1,
        1, 1,-1,
        1, 1, 1,

        1,-1, 1,
        1,-1,-1,
        1, 1,-1,

        -1, 1, 1,
        1, 1,-1,
        -1, 1,-1,

        -1, 1, 1,
        1, 1, 1,
        1, 1,-1,

        -1,-1, 1,
        1,-1,-1,
        -1,-1,-1,

        -1,-1, 1,
        1,-1, 1,
        1,-1,-1,
    ]);

}

export { Skybox };