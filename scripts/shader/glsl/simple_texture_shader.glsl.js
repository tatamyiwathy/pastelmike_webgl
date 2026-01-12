export const simpleTextureVertexShaderSource = `
    in vec3 position;
    in vec2 texcoord; // UV座標
    uniform mat4 mvpMtx;
    out vec2 v_texcoord; // フラグメントシェーダーへ渡すUV座標

    void main() {
        v_texcoord = texcoord; // そのままフラグメントシェーダーへ
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;


export const simpleTextureFragmentShaderSource = `
precision mediump float;

// ユニフォーム変数
uniform sampler2D samples; // 貼り付ける画像データ
uniform float u_alpha;       // 透明度（必要に応じて）

// 頂点シェーダーから受け取る変数
in vec2 v_texcoord;          // 頂点シェーダーから届いたUV座標

// 出力する色
out vec4 outColor;

void main() {
    // 1. v_texcoord（UV座標）を使ってテクスチャの色をそのまま取り出す
    vec4 texColor = texture(samples, v_texcoord);

    // 2. 取り出した色をそのまま出力（ライト計算なし）
    outColor = texColor;
    
    // もし全体の透明度を調整したい場合は以下のようにします
    // outColor.a *= u_alpha;
}
`;

