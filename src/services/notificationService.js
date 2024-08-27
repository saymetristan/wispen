import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import schedule from 'node-schedule';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.loadNotifications();
  }

  loadNotifications() {
    logger.info('Iniciando carga de notificaciones');
    const results = [];
    fs.createReadStream(path.join(process.cwd(), 'src', 'utils', 'notifications.csv'))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        this.notifications = results;
        logger.info(`Notificaciones cargadas: ${results.length}`);
        this.scheduleNotifications();
      })
      .on('error', (error) => {
        logger.error('Error al cargar notificaciones:', error);
      });
  }

  async scheduleNotifications() {
    logger.info('Iniciando programación de notificaciones');
    const users = await User.findAll();
    logger.info(`Usuarios encontrados: ${users.length}`);
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    this.notifications.forEach((notification) => {
      const [hour, minute] = notification.hora.split(':').map(Number);
      const dayOfWeek = this.getDayOfWeek(notification.día);
      
      logger.info(`Programando notificación para ${notification.día} a las ${hour}:${minute}`);
      
      if (dayOfWeek === currentDay && (hour > currentHour || (hour === currentHour && minute > currentMinute))) {
        // Crear notificaciones para hoy si la hora aún no ha pasado
        users.forEach(user => this.createNotification(user.id, notification));
      }
      
      // Programar para futuros días
      schedule.scheduleJob(`${minute} ${hour} * * ${dayOfWeek}`, () => {
        users.forEach(user => this.createNotification(user.id, notification));
      });
    });
    
    logger.info('Notificaciones programadas');
  }

  async createNotification(userId, notification) {
    logger.info(`Creando notificación para usuario ${userId}`);
    const message = this.getRandomMessage(notification);
    try {
      const createdNotification = await Notification.create({
        userId,
        message,
        scheduledFor: new Date(),
        sent: false
      });
      logger.info(`Notificación creada con ID: ${createdNotification.id}`);
    } catch (error) {
      logger.error(`Error al crear notificación para usuario ${userId}:`, error);
    }
  }

  async sendNotifications(notification) {
    const users = await User.findAll();
    for (const user of users) {
      const message = this.getRandomMessage(notification);
      await Notification.create({
        userId: user.id,
        message: message,
        scheduledFor: new Date(),
        sent: false
      });
    }
    this.processNotificationQueue();
  }

  async processNotificationQueue() {
    logger.info('Procesando cola de notificaciones');
    const pendingNotifications = await Notification.findAll({
      where: { sent: false },
      order: [['scheduledFor', 'ASC']],
      limit: 100
    });
    logger.info(`Notificaciones pendientes encontradas: ${pendingNotifications.length}`);

    for (const notification of pendingNotifications) {
      try {
        const user = await User.findByPk(notification.userId);
        if (user) {
          logger.info(`Enviando notificación ${notification.id} a usuario ${user.id}`);
          await WhatsAppService.sendMessage(user.phoneNumber, notification.message);
          notification.sent = true;
          await notification.save();
          logger.info(`Notificación ${notification.id} enviada y marcada como enviada`);
        } else {
          logger.warn(`Usuario no encontrado para la notificación ${notification.id}`);
        }
      } catch (error) {
        logger.error(`Error al procesar notificación ${notification.id}:`, error);
      }
    }

    if (pendingNotifications.length === 100) {
      logger.info('Programando próximo lote de notificaciones');
      setTimeout(() => this.processNotificationQueue(), 1000);
    } else {
      logger.info('Procesamiento de cola de notificaciones completado');
    }
  }

  getRandomMessage(notification) {
    const options = Object.values(notification).slice(2); // Excluir día y hora
    return options[Math.floor(Math.random() * options.length)];
  }

  getDayOfWeek(day) {
    const days = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
    return days[day] || '*';
  }

  init() {
    logger.info('Iniciando servicio de notificaciones');
    this.loadNotifications();
    this.scheduleNotifications();
    this.startNotificationQueue();
    this.handleSpecialNotifications();
    logger.info('Servicio de notificaciones iniciado');
  }

  startNotificationQueue() {
    setInterval(() => this.processNotificationQueue(), 60000); // Procesar la cola cada minuto
  }

  handleSpecialNotifications() {
    schedule.scheduleJob('0 20 L * *', async () => { // Último día del mes a las 20:00
      const users = await User.findAll();
      const notification = this.notifications.find(n => n.día === 'Último día del mes');
      if (notification) {
        users.forEach(user => this.createNotification(user.id, notification));
      }
    });
  }
}

export default new NotificationService();