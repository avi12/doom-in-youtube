 
class SamplesQueue {
    constructor() {
        this.samplesQueue = [];
        this.started = false;
    }

    push(samples) {
        if (this.started) {
            this.samplesQueue.push(samples);
        }
        if (this.length() > 8192) {
            console.error("samples queue is too long, dropping samples");
            this.samplesQueue = [samples];
        }
    }

    length() {
        let total = 0;
        for (const next of this.samplesQueue) {
            total += next.length;
        }
        return total;
    }

    writeTo(dst, bufferSize) {
        this.started = true;
        let writeIt = 0;
        while (this.samplesQueue.length > 0) {
            const src = this.samplesQueue[0];
            const toRead = Math.min(bufferSize - writeIt, src.length);
            if (toRead === src.length) {
                dst.set(src, writeIt);
                this.samplesQueue.shift();
            } else {
                dst.set(src.slice(0, toRead), writeIt);
                this.samplesQueue[0] = src.slice(toRead);
            }

            writeIt += toRead;

            if (writeIt === bufferSize) {
                break;
            }
        }

        if (writeIt < bufferSize) {
            dst.fill(0, writeIt);
        }
    }
}

class Processor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.queue = new SamplesQueue();
  
      this.port.onmessage = (e) => {
        const chunk = e.data;
        if (chunk instanceof Float32Array) {
          this.queue.push(chunk);
        }
      };
    }
  
    process(inputs, outputs) {
      const output = outputs[0][0];
      this.queue.writeTo(output, output.length);
      return true;
    }
}
  
registerProcessor('jsdos-audio', Processor);
