
function _parseMtl(text) {
    const lines = text.split('\n');

    function isNumelic(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    const materials = {};
    lines.forEach(line => {
        const tokens = line.trim().split(' ');
        const key = tokens.shift();
        if( key === '#' || key === '' ){
            return;
        }
        console.log('key:', key);
        if( isNumelic(tokens[0]) ){
            const values = tokens.map(parseFloat);
            materials[key] = values.length === 1 ? values[0] : values;
            return;
        }
        else {
            //valueは文字列
            if (key.startsWith('map_')) {
                // //valueはパスなのでベースファイル名だけ抽出する
                // const path = tokens.join(' ');
                // const parts = path.split('/');
                // const filename = parts[parts.length - 1];
                // materials[key] = filename;
                materials[key] = tokens.join(' ');
                return;
            }
            materials[key] = tokens.length === 1 ? tokens[0] : tokens;
        }
    });

    return materials;
}

export async function parseMtl(url) {
    console.log(`Loading MTL file from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return _parseMtl(text);
}

