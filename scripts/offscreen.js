/**
 * シャドウマップ用のFBOを構築する関数
 * @param {WebGL2RenderingContext} gl 
 * @param {number} size テクスチャ解像度（1024等）
 */
function createShadowFramebuffer(gl, size) {
    // 1. フレームバッファの作成
    const framebuffer = gl.createFramebuffer();

    // 2. 深度テクスチャの作成
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    
    // 比較モード無効化（デバッグ時は通常のテクスチャとして読む）
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
    
    // WebGL 2.0なので DEPTH_COMPONENT24 が使用可能
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
        size, size, 0,
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT, // 深度としてアタッチ
        gl.TEXTURE_2D,
        depthTexture,
        0
    );


// 2. 【デバッグ用追加】カラーテクスチャもとりあえず貼ってみる
    // これでエラーが消えるなら、環境が「カラー無し」に対応していません
    /*
    const colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    */


    // 4. カラーバッファ出力を無効化（WebGL 2.0の最適化）
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);

    // ステータスチェック
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    console.log("Shadow Framebuffer status:", status);
    if (status !== gl.FRAMEBUFFER_COMPLETE){
        // console.error("Framebuffer is incomplete:", status);
        throw new Error('Framebuffer is incomplete: ' + status);
    }

    // バインドを解除
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { framebuffer, texture: depthTexture };
}
export { createShadowFramebuffer };