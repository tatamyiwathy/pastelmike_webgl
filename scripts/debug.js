class DebugLogger {
    cnt = 0;
    log(message,count=1) {
        if(this.cnt>=count) return;
        console.log(`[Debug ${this.cnt}] ${message}`);
        this.cnt++;
    }
}


export { DebugLogger };