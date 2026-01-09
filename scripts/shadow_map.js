/**
 * シャドウマップを管理するクラス
 */
class ShadowMap {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {number} size テクスチャ解像度（1024等）
     */
    constructor(gl, size = 1024) {
        this.gl = gl;
        this.size = size;
        this.framebuffer = null;
        this.texture = null;
        
        this._createFramebuffer();
    }

    /**
     * シャドウマップ用のFBOを構築する
     * @private
     */
    _createFramebuffer() {
        const gl = this.gl;
        
        // 1. フレームバッファの作成
        this.framebuffer = gl.createFramebuffer();

        // 2. 深度テクスチャの作成
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        // 比較モード無効化（デバッグ時は通常のテクスチャとして読む）
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        
        // WebGL 2.0なので DEPTH_COMPONENT24 が使用可能
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
            this.size, this.size, 0,
            gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
        );

        // フィルタリング設定
        // 後にPCFなどを実装する場合は LINEAR に変更することもありますが、最初は NEAREST が確実です
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        // 影の範囲外を「影なし」とするために CLAMP_TO_EDGE を設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // 3. フレームバッファへのアタッチ
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT, // 深度としてアタッチ
            gl.TEXTURE_2D,
            this.texture,
            0
        );

        // 4. カラーバッファ出力を無効化（WebGL 2.0の最適化）
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);

        // ステータスチェック
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        console.log("Shadow Framebuffer status:", status);
        if (status !== gl.FRAMEBUFFER_COMPLETE){
            throw new Error('Framebuffer is incomplete: ' + status);
        }

        // バインドを解除
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * シャドウマップ用FBOをバインド
     */
    bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    }

    /**
     * FBOのバインドを解除
     */
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    /**
     * ビューポートをシャドウマップサイズに設定
     */
    setViewport() {
        this.gl.viewport(0, 0, this.size, this.size);
    }

    /**
     * 深度バッファをクリア
     */
    clear() {
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * シャドウマップテクスチャを取得
     * @returns {WebGLTexture} 深度テクスチャ
     */
    getTexture() {
        return this.texture;
    }

    /**
     * シャドウマップサイズを取得
     * @returns {number} テクスチャ解像度
     */
    getSize() {
        return this.size;
    }

    /**
     * シャドウマップリソースを削除
     */
    dispose() {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }
        if (this.framebuffer) {
            this.gl.deleteFramebuffer(this.framebuffer);
            this.framebuffer = null;
        }
    }
}

/**
 * シャドウマップ用のFBOを構築する関数（互換性のため残す）
 * @deprecated ShadowMapクラスを使用してください
 * @param {WebGL2RenderingContext} gl 
 * @param {number} size テクスチャ解像度（1024等）
 */
function createShadowFramebuffer(gl, size) {
    const shadowMap = new ShadowMap(gl, size);
    return { framebuffer: shadowMap.framebuffer, texture: shadowMap.texture };
}

export { ShadowMap, createShadowFramebuffer };