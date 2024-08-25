import openai from '../config/openai.js';
import logger from '../utils/logger.js';

class RunService {
  async waitForRunCompletion(threadId, runId) {
    const maxWaitTime = 60000; // 60 segundos
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('El run no se completó en el tiempo esperado');
  }
}

export default new RunService();