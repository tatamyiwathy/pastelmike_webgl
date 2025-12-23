// 例：Frustum オブジェクトの構造
class Frustum {
    // 6つの平面（各平面は [A, B, C, D] の配列）
    planes = [];

    constructor() {
    }

    
    // クリッピング行列 (P * V) から平面を抽出・正規化するメソッド
    extractPlanes(clipMatrix) {
        // ... 上記の計算を行い、各平面ベクトルを正規化して this.planes に格納 ...
        const m = clipMatrix;
        this.planes = [
            [m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]], //left
            [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]], //right
            [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]], //bottom
            [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]], //top
            [m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]], //near
            [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]], //far 
        ];
    }

    isSphereInside(center, radius) {
        const [x, y, z] = center;
        
        // 6つの平面すべてに対してテストを行う
        for (const plane of this.planes) {
            const [A, B, C, D] = plane;
            
            // 中心から平面までの符号付き距離を計算
            // A*x + B*y + C*z + D = 距離d
            const distance = A * x + B * y + C * z + D;
            
            // 距離dが負（外側）であり、かつ、その絶対値が半径より大きい場合
            // つまり、完全に平面の外側にある場合
            if (distance < -radius) {
                // 描画不要 (カリング)
                return false; 
            }
        }
        
        // すべての平面テストを通過した場合、描画する必要がある
        return true; 
    }
}

export { Frustum };