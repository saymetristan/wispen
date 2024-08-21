import fs from 'fs';
import csv from 'csv-parser';
import schedule from 'node-schedule';
import axios from 'axios';
import User from '../models/User.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.init();
  }

  async init() {
    try {
      await this.loadNotifications();
      this.scheduleNotifications();
      logger.info('Servicio de notificaciones inicializado correctamente');
    } catch (error) {
      logger.error('Error al inicializar el servicio de notificaciones:', error);
    }
  }

  async loadNotifications() {
    const url = 'https://wispen-files.s3.us-east-2.amazonaws.com/notifications.csv';
    try {
      const response = await axios.get(url);
      const data = response.data;

      return new Promise((resolve, reject) => {
        const results = [];
        const parser = csv()
          .on('data', (data) => results.push(data))
          .on('end', () => {
            this.notifications = results;
            logger.info(`${this.notifications.length} notificaciones cargadas correctamente`);
            resolve();
          })
          .on('error', (error) => {
            logger.error('Error al parsear el CSV:', error);
            reject(error);
          });

        parser.write(data);
        parser.end();
      });
    } catch (error) {
      logger.error('Error al cargar las notificaciones:', error);
      throw error;
    }
  }

  scheduleNotifications() {
    this.notifications.forEach((notification, index) => {
      const { día, hora, ...alternativas } = notification;
      const time = hora.split(':');
      const dayOfWeek = this.getDayOfWeek(día);

      const job = schedule.scheduleJob({ hour: time[0], minute: time[1], dayOfWeek }, async () => {
        const message = this.getRandomMessage(alternativas);
        await this.sendNotifications(message);
        logger.info(`Notificación #${index + 1} enviada: ${message}`);
      });

      logger.info(`Notificación #${index + 1} programada para ${día} a las ${hora}`);
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