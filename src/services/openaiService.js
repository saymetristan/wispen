import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { Op } from 'sequelize';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, unlink, createReadStream } from 'fs';
import { promisify } from 'util';
import openai from '../config/openai.js';
import logger from '../utils/logger.js';

dotenv.config();

const THREAD_EXPIRY_DAYS = 30;
const unlinkAsync = promisify(unlink);

class OpenAIService {
  constructor() {
    this.assistantId = process.env.ASSISTANT_ID;
  }

  async getOrCreateThread(userId) {
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }
  
    let user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
  
    if (!user.threadId || this.isThreadExpired(user.threadCreatedAt)) {
      const thread = await openai.beta.threads.create();
      user.threadId = thread.id;
      user.threadCreatedAt = new Date();
      await user.save();
    }
  
    return user.threadId;
  }

  isThreadExpired(threadCreatedAt) {
    if (!threadCreatedAt) return true;
    const expiryDate = new Date(threadCreatedAt.getTime() + THREAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return new Date() > expiryDate;
  }

  async uploadImage(mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });

      // Crear un nombre de archivo temporal único
      const tempFileName = `temp_${uuidv4()}.jpg`;
      const tempFilePath = path.join('/tmp', tempFileName);

      // Guardar el archivo temporalmente
      await fs.promises.writeFile(tempFilePath, response.data);

      // Cargar el archivo a OpenAI
      const file = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: "vision"
      });

      // Eliminar el archivo temporal
      await fs.promises.unlink(tempFilePath);

      return file.id;
    } catch (error) {
      logger.error('Error al subir la imagen a OpenAI:', error);
      throw error;
    }
  }

  async processMessage(message, userId, mediaUrl = null) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        logger.info(`Procesando mensaje para el usuario ${userId}. Assistant ID actual: ${user.assistant_ID}`);

        let threadId = await this.getOrCreateThread(userId);

        // Verificar si hay un run activo
        const runs = await openai.beta.threads.runs.list(threadId);
        const activeRun = runs.data.find(run => run.status === 'in_progress' || run.status === 'queued');
        if (activeRun) {
          // Esperar a que el run activo se complete
          await this.waitForRunCompletion(threadId, activeRun.id);
        }

        // Crear el contenido del mensaje
        const content = [];

        if (message) {
          content.push({
            type: "text",
            text: message
          });
        }

        if (mediaUrl) {
          const fileId = await this.uploadImage(mediaUrl);
          content.push({
            type: "image_file",
            image_file: { file_id: fileId }
          });
        }

        if (content.length === 0) {
          throw new Error('No se proporcionó contenido para el mensaje');
        }

        // Añadir el mensaje del usuario al thread
        await openai.beta.threads.messages.create(
          threadId,
          {
            role: "user",
            content: content
          }
        );

        // Ejecutar el assistant en el thread
        let run = await openai.beta.threads.runs.create(
          threadId,
          { 
            assistant_id: user.assistant_ID,
          }
        );

        logger.info(`Run creado para el usuario ${userId}. Assistant ID: ${user.assistant_ID}, Thread ID: ${threadId}`);

        // Esperar a que el run se complete con un tiempo límite
        const maxWaitTime = 60000; // 60 segundos
        const startTime = Date.now();
        
        while (run.status !== 'completed' && Date.now() - startTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          run = await openai.beta.threads.runs.retrieve(threadId, run.id);

          if (run.status === 'requires_action') {
            const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = await this.handleFunctionCalls(toolCalls, userId);
            
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

        // Obtener los mensajes después de que el run se haya completado
        const messages = await openai.beta.threads.messages.list(threadId);
        
        // Obtener el último mensaje del asistente
        const assistantMessages = messages.data.filter(m => m.role === 'assistant');
        if (assistantMessages.length > 0) {
          const response = assistantMessages[0].content[0].text.value;

          // Actualizar el threadId del usuario
          user.threadId = threadId;
          await user.save();

          logger.info(`Mensaje procesado para el usuario ${userId}. Assistant ID final: ${user.assistant_ID}, Thread ID final: ${user.threadId}`);

          return response;
        } else {
          throw new Error('No se recibió respuesta del asistente');
        }
      } catch (error) {
        logger.error(`Error en el intento ${retries + 1}:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error('Se alcanzó el número máximo de intentos');
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * retries)); // Espera exponencial
      }
    }
  }

  async processVoiceMessage(mediaUrl, userId) {
    try {
      // Descargar el archivo de audio con autenticación
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });
      const tempFilePath = `/tmp/temp_${uuidv4()}.ogg`;
      const writer = createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Convertir el archivo a mp3
      const mp3FilePath = tempFilePath.replace('.ogg', '.mp3');
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(mp3FilePath);
      });

      // Transcribir el audio usando la API de OpenAI
      const audioFile = createReadStream(mp3FilePath);
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        response_format: "text"
      });

      logger.info('Respuesta de transcripción:', transcription);

      if (!transcription) {
        throw new Error('La transcripción está vacía o no se obtuvo correctamente');
      }

      logger.info('Transcripción obtenida:', transcription);

      // Eliminar archivos temporales
      await unlinkAsync(tempFilePath);
      await unlinkAsync(mp3FilePath);

      // Procesar el mensaje transcrito
      return await this.processMessage(transcription, userId);
    } catch (error) {
      logger.error('Error al procesar la nota de voz:', error);
      throw error;
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
          functionResult = await this.registrarTransaccion(userId, functionArgs);
          break;
        case 'consultar_saldo':
          functionResult = await this.consultarSaldo(userId);
          break;
        case 'generar_reporte':
          logger.info(`Generando reporte para usuario ${userId} con parámetros:`, functionArgs);
          functionResult = await this.generarReporte(userId, functionArgs);
          break;
        case 'actualizar_usuario':
          functionResult = await this.actualizarUsuario(userId, functionArgs);
          break;
        case 'mostrar_info_usuario':
          functionResult = await this.mostrarInfoUsuario(userId);
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

  async registrarTransaccion(userId, args) {
    const { tipo, monto, descripcion, categoria, subcategoria } = args;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const transaction = await Transaction.create({
      userId,
      type: tipo,
      amount: monto,
      description: descripcion,
      category: categoria,
      subcategory: subcategoria
    });

    // Actualizar el saldo del usuario
    if (tipo === 'ingreso') {
      user.balance = parseFloat(user.balance) + parseFloat(monto);
    } else if (tipo === 'gasto') {
      user.balance = parseFloat(user.balance) - parseFloat(monto);
    }
    await user.save();

    return { success: true, transactionId: transaction.id, newBalance: user.balance };
  }

  async consultarSaldo(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return { balance: user.balance };
  }

  async generarReporte(userId, args) {
    const { tipo_periodo, periodo, fecha_inicio, fecha_fin } = args;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let startDate, endDate;
    if (tipo_periodo === 'predefinido') {
      const now = new Date();
      switch (periodo) {
        case 'semanal':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'mensual':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          endDate = new Date();
          break;
        case 'anual':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          endDate = new Date();
          break;
        default:
          throw new Error('Periodo no reconocido');
      }
    } else if (tipo_periodo === 'personalizado') {
      startDate = new Date(fecha_inicio);
      endDate = new Date(fecha_fin);
    } else {
      throw new Error('Tipo de periodo no reconocido');
    }

    const transactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const gastos = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);

    return {
      periodo: {
        inicio: startDate.toISOString().split('T')[0],
        fin: endDate.toISOString().split('T')[0]
      },
      resumen: {
        ingresos,
        gastos,
        balance: ingresos - gastos
      },
      transacciones: transactions.map(t => ({
        id: t.id,
        tipo: t.type,
        monto: t.amount,
        categoria: t.category,
        subcategoria: t.subcategory,
        descripcion: t.description,
        fecha: t.createdAt.toISOString().split('T')[0]
      }))
    };
  }

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

  async actualizarUsuario(userId, args) {
    const { nombre, ocupacion, ingreso_mensual_promedio, limite_gasto_mensual, moneda_preferencia, ahorros_actuales } = args;
    
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.name = nombre;
    user.ocupacion = ocupacion;
    user.ingresoMensualPromedio = ingreso_mensual_promedio;
    user.limiteGastoMensual = limite_gasto_mensual;
    user.monedaPreferencia = moneda_preferencia;
    user.ahorrosActuales = ahorros_actuales;

    await user.save();

    return {
      success: true,
      message: 'Información del usuario actualizada correctamente',
      updatedUser: {
        nombre: user.name,
        ocupacion: user.ocupacion,
        ingreso_mensual_promedio: user.ingresoMensualPromedio,
        limite_gasto_mensual: user.limiteGastoMensual,
        moneda_preferencia: user.monedaPreferencia,
        ahorros_actuales: user.ahorrosActuales
      }
    };
  }

  async mostrarInfoUsuario(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      nombre: user.name,
      ocupacion: user.ocupacion,
      ingreso_mensual_promedio: user.ingresoMensualPromedio,
      limite_gasto_mensual: user.limiteGastoMensual,
      moneda_preferencia: user.monedaPreferencia,
      ahorros_actuales: user.ahorrosActuales,
      balance: user.balance
    };
  }
}

export default new OpenAIService();