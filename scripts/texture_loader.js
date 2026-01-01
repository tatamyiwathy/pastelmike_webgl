import { variable_validation } from "./utils.js";

class TextureLoader {

    load(gl, url) {
        variable_validation(gl);
        variable_validation(url);
        const texture = gl.createTexture();
        const image = new Image();
        image.onload = () => {
            // テクスチャをアップロードする前に設定
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            console.log("Texture loaded:", url);
        };
        image.onerror = () => {
            console.error("画像の読み込みに失敗しました:", url);
            // 必要に応じて追加のエラー処理をここに記述
        };
        image.src = url;
        return texture;
    }            
}


class CubeTexureLoader {
    load(gl, urls){
        console.log('createTexture called');
        const target = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, // 右
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, // 左
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, // 上
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, // 下
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, // 前
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, // 後
        ];


        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        // まずはプレースホルダー（1x1ピクセル）を設定
        for (let i = 0; i < 6; i++) {
            gl.texImage2D(target[i], 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
        }


        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        let loadedFaces = 0;
        for( let i=0; i<6; i++) {
            const image = new Image();
            image.onload = () => {
                console.log('Image loaded for face:', urls[i]);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(target[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                loadedFaces++;
                // 全ての画像がロードされたら mipmap を生成 (オプション)
                if (loadedFaces === 6) {
                    // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                }
            };
            image.onerror = function () {
                console.error('Failed to load cube map face:', urls[i]);
            };
            image.src = urls[i];
        }
        console.log('createTexture finished');
        return texture;
    }

}
export { TextureLoader, CubeTexureLoader };