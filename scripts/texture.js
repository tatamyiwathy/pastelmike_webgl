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

export { TextureLoader };