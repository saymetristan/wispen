import AWS from 'aws-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

class S3Service {
  async uploadFile(filePath) {
    try {
      const fileContent = await fs.promises.readFile(filePath);
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `reports/${Date.now()}_${filePath.split('/').pop()}`,
        Body: fileContent,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ACL: 'public-read'
      };

      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      logger.error('Error al subir el archivo a S3:', error);
      throw new Error('No se pudo subir el archivo a S3');
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      logger.error('Error al eliminar el archivo temporal:', error);
    }
  }
}

export default new S3Service();