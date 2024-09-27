// src/kafkaConsumer.ts
import { Kafka } from 'kafkajs';
import { updateGoogleSheet } from '../services/googleSheetServices';

const kafka = new Kafka({
  clientId: 'google-sheet-sync',
  brokers: ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'google-sheet-sync-group' });

export const consumeDatabaseChanges = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'dbserver1.public.spreadsheets', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const changeEvent = JSON.parse(message.value?.toString() || '{}');

      if (changeEvent.payload && changeEvent.payload.after) {
        const updatedRow = changeEvent.payload.after; 
        const formattedData = Object.values(updatedRow);

        await updateGoogleSheet([formattedData], 'Sheet1!A1:D4');
        console.log('Google Sheet updated with:', formattedData);
      }
    },
  });
};
