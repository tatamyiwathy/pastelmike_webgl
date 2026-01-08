class Debug {

    static caches = [];
    static enableLog = false;
    static log(message,count=1) {
        if (!Debug.enableLog) {
            return;
        }
        if( !Debug.caches.includes(message) ){
            Debug.caches.push(message);
            console.log(`[Debug] ${message}`);
            return;
        }
    }

    static checkGlError(gl, msg) {
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            throw new Error(msg + ' - WebGL Error: ' + error);
        }
    }

}


export { Debug };