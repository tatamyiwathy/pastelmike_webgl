// パーティクル用頂点シェーダー
export const particleVertexShaderSource = `
            in vec3 position;
            uniform mat4 mvpMtx;
            uniform float pointSize;
            
            void main() {
                gl_Position = mvpMtx * vec4(position, 1.0);
                gl_PointSize = pointSize;
            }
        `;

// パーティクル用フラグメントシェーダー
export const particleFragmentShaderSource = `
            precision mediump float;
            uniform vec3 particleColor;
            uniform float alphaScale;
            out vec4 outColor;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= alphaScale; // 淡く光る効果
                outColor = vec4(particleColor, alpha);
            }
        `;

