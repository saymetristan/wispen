import AWS from 'aws-sdk';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);
console.log('AWS_REGION:', process.env.AWS_REGION);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const uploadFileToS3 = async (filePath) => {
  try {
    const fileContent = await fs.promises.readFile(filePath);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `test/${Date.now()}_${filePath.split('/').pop()}`,
      Body: fileContent,
      ContentType: 'text/csv'
    };

    console.log('Upload params:', params);

    const data = await s3.upload(params).promise();
    console.log('File uploaded successfully. URL:', data.Location);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

// Ruta del archivo que quieres subir
const filePath = './test.csv';

// Crear un archivo de prueba
fs.writeFileSync(filePath, 'id,tipo,monto,categoria,subcategoria,descripcion,fecha\n1,gasto,100,comida,restaurante,almuerzo,2024-08-01');

uploadFileToS3(filePath);