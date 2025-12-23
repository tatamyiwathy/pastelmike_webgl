import { parseMtl } from './mtl_parser.js';
import { parseObj } from './obj_parser.js';
import { TextureLoader } from './texture.js';
import { Geometry } from './geometry.js';
import { Material } from './material.js';
import { ShaderName } from './shader.js';
import { Mesh } from './mesh.js';

class ObjLoader {
    async load(gl,url) {
        const dir = url.substring(0, url.lastIndexOf('/'));

        // OBJファイルの読み込み
        const obj = await parseObj(url);
        console.log("OBJ directory:", obj);

        let texture = null;
        if (obj[1].length > 0) {
            // MTLファイルの読み込み
            const mtl_url = dir + '/' + obj[1][0];
            console.log("Loading MTL file from:", mtl_url);
            const mtl = await parseMtl(mtl_url);
            
            if(mtl.map_Kd) {
                // テクスチャの読み込み
                const mtlDir  = mtl_url.substring(0, mtl_url.lastIndexOf('/') + 1);
                const loader = new TextureLoader();
                texture = await loader.load(gl, mtlDir + mtl.map_Kd)
            };
        }

        // メッシュ
        const geometry = new Geometry(gl, ...obj[0])
        const material = new Material({
            textures: texture,
            useTexture: texture ? true : false,
            shaderName: ShaderName.BASIC,
            specular: true,
            isWireframe: false,
            color: [1, 1, 1, 1] // 白色に設定

        });
        const mesh = new Mesh(gl, geometry, material);
        mesh.position = [0, 0, 0];
        mesh.scale = [1, 1, 1];

        return mesh;
    }
}

export { ObjLoader };