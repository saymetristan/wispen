import openai from '../config/openai.js';
import logger from '../utils/logger.js';
import RunService from './RunService.js';

class AssistantService {
  async createRun(threadId, assistantId) {
    return await openai.beta.threads.runs.create(
      threadId,
      { 
        assistant_id: assistantId,
      }
    );
  }

  async handleRunCompletion(threadId, run, userId, handleFunctionCalls) {
    const maxWaitTime = 60000;
    const startTime = Date.now();
    
    while (run.status !== 'completed' && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);

      if (run.status === 'requires_action') {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await handleFunctionCalls(toolCalls, userId);
        
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          run.id,
          { tool_outputs: toolOutputs }
        );
      }
    }

    if (run.status !== 'completed') {
      throw new Error('El asistente no completó la tarea en el tiempo esperado');
    }

    return run;
  }

  async getAssistantResponse(threadId) {
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter(m => m.role === 'assistant');
    if (assistantMessages.length > 0) {
      return assistantMessages[0].content[0].text.value;
    } else {
      throw new Error('No se recibió respuesta del asistente');
    }
  }
}

export default new AssistantService();