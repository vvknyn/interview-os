
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local checks for better browser compatibility
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, {
                progress_callback
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;

    if (message.type === 'load') {
        try {
            await PipelineFactory.getInstance((data) => {
                self.postMessage({
                    type: 'download',
                    data
                });
            });
            self.postMessage({ type: 'ready' });
        } catch (error) {
            self.postMessage({ type: 'error', data: error.message });
        }
        return;
    }

    if (message.type === 'generate') {
        try {
            const transcriber = await PipelineFactory.getInstance();
            const output = await transcriber(message.audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: false
            });

            self.postMessage({
                type: 'result',
                data: output.text
            });
        } catch (error) {
            self.postMessage({ type: 'error', data: error.message });
        }
    }
});
