import dotenv from 'dotenv';
import ThreadService from './ThreadService.js';
import UserService from './UserService.js';
import FeedbackService from './FeedbackService.js';
import SavingGoalService from './SavingGoalService.js';
import SpendingLimitService from './SpendingLimitService.js';
import TransactionService from './TransactionService.js';
import ReportService from './ReportService.js';
import ExcuseService from './ExcuseService.js';
import InstructionService from './InstructionService.js';
import SecurityService from './SecurityService.js';
import RunService from './RunService.js';
import CommandDetectionService from './CommandDetectionService.js';
import MessageProcessingService from './MessageProcessingService.js';
import AssistantService from './AssistantService.js';
import logger from '../utils/logger.js';
import openai from '../config/openai.js';
import DateService from './DateService.js'; // This line was changed based on the instructions

dotenv.config();

class OpenAIService {
  constructor() {
    this.assistantId = process.env.ASSISTANT_ID;
  }

  async processMessage(message, userId, mediaUrl = null) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        if (message) {
          if (CommandDetectionService.detectCommand(message, '/feedback')) {
            logger.info(`Procesando feedback para el usuario ${userId}: ${message}`);
            return await FeedbackService.processFeedback(message.replace('/feedback', '').trim(), userId);
          }

          if (CommandDetectionService.detectCommand(message, '/instrucciones')) {
            logger.info(`Procesando solicitud de instrucciones para el usuario ${userId}`);
            return InstructionService.provideInstructions();
          }

          if (CommandDetectionService.detectCommand(message, '/seguridad')) {
            logger.info(`Procesando solicitud de seguridad para el usuario ${userId}`);
            return await SecurityService.provideSecurity();
          }
        }

        const user = await UserService.findUserById(userId);
        logger.info(`Procesando mensaje para el usuario ${userId}. Assistant ID actual: ${user.assistant_ID}`);

        let threadId = await ThreadService.getOrCreateThread(userId);

        const runs = await openai.beta.threads.runs.list(threadId);
        const activeRun = runs.data.find(run => run.status === 'in_progress' || run.status === 'queued');
        if (activeRun) {
          await RunService.waitForRunCompletion(threadId, activeRun.id);
        }

        const content = await MessageProcessingService.processContent(message, mediaUrl);
        await MessageProcessingService.createMessage(threadId, content);

        let run = await AssistantService.createRun(threadId, user.assistant_ID);
        logger.info(`Run creado para el usuario ${userId}. Assistant ID: ${user.assistant_ID}, Thread ID: ${threadId}`);

        run = await AssistantService.handleRunCompletion(threadId, run, userId, this.handleFunctionCalls.bind(this));

        const response = await AssistantService.getAssistantResponse(threadId);

        user.threadId = threadId;
        await UserService.updateUser(user);

        logger.info(`Mensaje procesado para el usuario ${userId}. Assistant ID final: ${user.assistant_ID}, Thread ID final: ${user.threadId}`);

        return response;
      } catch (error) {
        logger.error(`Error en el intento ${retries + 1}:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error('Se alcanzó el número máximo de intentos');
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }
  }

  async handleFunctionCalls(toolCalls, userId) {
    const toolOutputs = [];
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      let functionResult;
      switch (functionName) {
        case 'registrar_transaccion':
          functionResult = await TransactionService.registrarTransaccion(userId, functionArgs);
          break;
        case 'consultar_saldo':
          functionResult = await TransactionService.consultarSaldo(userId);
          break;
        case 'generar_reporte':
          logger.info(`Generando reporte para usuario ${userId} con parámetros:`, functionArgs);
          functionResult = await ReportService.generarReporte(userId, functionArgs);
          break;
        case 'actualizar_perfil_usuario':
          functionResult = await UserService.actualizarUsuario(userId, functionArgs);
          break;
        case 'mostrar_info_usuario':
          functionResult = await UserService.mostrarInfoUsuario(userId);
          break;
        case 'creador_excusas':
          functionResult = await ExcuseService.creadorExcusas(functionArgs);
          break;
        case 'meta_ahorro':
          functionResult = await SavingGoalService.crearMetaAhorro(userId, functionArgs);
          break;
        case 'mostrar_progreso_meta':
          functionResult = await SavingGoalService.mostrarProgresoMeta(userId);
          break;
        case 'crear_limite_gasto':
          functionResult = await SpendingLimitService.crearLimiteGasto(userId, functionArgs);
          break;
        case 'mostrar_progreso_limite':
          functionResult = await SpendingLimitService.mostrarProgresoLimite(userId, functionArgs.period, functionArgs.category);
          break;
        case 'fecha_actual':
          functionResult = { currentDate: DateService.getCurrentDate() };
          break;
        default:
          throw new Error(`Función no reconocida: ${functionName}`);
      }

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(functionResult)
      });
    }
    return toolOutputs;
  }
}

export default new OpenAIService();