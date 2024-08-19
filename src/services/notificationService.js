import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import schedule from 'node-schedule';
import User from '../models/User.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.loadNotifications();
  }

  loadNotifications() {
    const filePath = path.join(__dirname, '../utils/notifications.csv');
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        this.notifications.push(row);
      })
      .on('end', () => {
        logger.info('Notificaciones cargadas correctamente');
        this.scheduleNotifications();
      });
  }

  scheduleNotifications() {
    this.notifications.forEach((notification) => {
      const { día, hora, ...alternativas } = notification;
      const time = hora.split(':');
      const dayOfWeek = this.getDayOfWeek(día);

      schedule.scheduleJob({ hour: time[0], minute: time[1], dayOfWeek }, async () => {
        const message = this.getRandomMessage(alternativas);
        await this.sendNotifications(message);
      });
    });
  }

  getDayOfWeek(day) {
    const days = {
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Domingo': 0,
      'Último día del mes': 'L'
    };
    return days[day];
  }

  getRandomMessage(alternativas) {
    const keys = Object.keys(alternativas);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return alternativas[randomKey];
  }

  async sendNotifications(message) {
    try {
      const users = await User.findAll();
      for (const user of users) {
        await WhatsAppService.sendMessage(user.phoneNumber, message);
      }
      logger.info('Notificaciones enviadas correctamente');
    } catch (error) {
      logger.error('Error al enviar notificaciones:', error);
    }
  }
}

export default new NotificationService();
