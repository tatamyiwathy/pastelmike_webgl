import { ShaderManager } from "./shader.js";
import { ShaderName } from "./shader.js";

class Material {
    constructor(materialContext = {}) {
        this.shaderName = materialContext.shaderName || ''
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.isWireframe = materialContext.isWireframe || false;
        this.textures = materialContext.textures || null;
        this.specular = materialContext.specular || false;
        this.useTexture = materialContext.useTexture || false;
    }

    dispose(gl) {
        if (this.textures) {
            gl.deleteTexture(this.textures);
        }
    }
}

class MeshSimpleMaterial extends Material {
    constructor(gl, params = {}) {
        super(params);
        this.shaderName = ShaderName.SIMPLE;
    }
}

class MeshSpecularMaterial extends Material {
    constructor(gl, params = {}) {
        super(params);
        this.shaderName = ShaderName.BASIC;
    }
}


class CubeMapMaterial extends Material {
    constructor(gl, imageSet) {
        super({shaderName: ShaderName.SKYBOX});
        this.textures = this.createTexture(gl, imageSet);
    }

    createTexture(gl, imageSet) {
        console.log('createTexture called');
        const faceInfos = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: imageSet.right }, // 右
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: imageSet.left }, // 左
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: imageSet.up }, // 上
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: imageSet.down }, // 下
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: imageSet.front }, // 前
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: imageSet.back }  // 後
        ];


        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        // まずはプレースホルダー（1x1ピクセル）を設定
        for (let i = 0; i < 6; i++) {
            gl.texImage2D(faceInfos[i].target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
        }


        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        let loadedFaces = 0;
        faceInfos.forEach((face) => {
            const image = new Image();
            image.onload = () => {
                console.log('Image loaded for face:', face.url);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures);
                gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                loadedFaces++;
                // 全ての画像がロードされたら mipmap を生成 (オプション)
                if (loadedFaces === 6) {
                    // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                }
            };
            image.onerror = function () {
                console.error('Failed to load cube map face:', face.url);
            };
            image.src = face.url;
        });
        console.log('createTexture finished');
        return texture;
    }


}

class ParticleMaterial extends Material {
    constructor(gl, options = {}) {
        super();
        this.shaderName = ShaderName.PARTICLE;
        this.size = options.size || 50.0;
        this.alphaScale = options.alphaScale || 1.0;
        this.color = options.color || [1.0, 1.0, 1.0, 1.0];
    }

}

export { CubeMapMaterial, ParticleMaterial, MeshSpecularMaterial, MeshSimpleMaterial, Material };