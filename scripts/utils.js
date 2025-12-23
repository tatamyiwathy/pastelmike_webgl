


/**
 * 色相環から色を取得（HSV→RGB変換）
 * @param {number} angle - 0～2πの範囲の角度（ラジアン）
 * @returns {Array<number>} [r, g, b, a] の配列（各値は 0.0～1.0）
 */
function pickColor(angle) {
    // 角度を0～360度の色相に変換
    if( angle < 0){     
        while(angle < 0){
            angle += Math.PI * 2;
        }   
    }

    const hue = ((angle % (Math.PI * 2)) / (Math.PI * 2)) * 360;
    
    // HSV (彩度=1, 明度=1) → RGB 変換
    const c = 1; // chroma
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    
    let r, g, b;
    if (hue < 60) { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return [r, g, b, 1.0];
}

function variable_validation(variable){
    if(variable === null || variable === undefined){
        throw new Error('Variable is null or undefined');
    }
    return variable;
}

export { pickColor, variable_validation };