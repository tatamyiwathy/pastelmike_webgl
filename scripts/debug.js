class Debug {
    static enableLog = false;
    static log(message,count=1) {
        if (!Debug.enableLog) {
            return;
        }
        console.log(`[Debug ${this.cnt}] ${message}`);
    }
}


export { Debug };