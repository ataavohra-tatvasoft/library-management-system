import { google } from 'googleapis';
import { authorize } from '../utils/googleAuth';
import { GOOGLE_SHEET_ID, RANGE } from '../config/config';

export const fetchSheetData = async (): Promise<any[]> => {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: RANGE,
  });

  return response.data.values;
};

import { MongoClient } from 'mongodb';
import { MONGO_URI, DATABASE_NAME, COLLECTION_NAME } from '../config/config';

let client: MongoClient;

export const connectToMongo = async () => {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(DATABASE_NAME).collection(COLLECTION_NAME);
};

export const insertData = async (data: any[]) => {
  const collection = await connectToMongo();
  await collection.insertMany(data.map((row) => ({
    field1: row[0],
    field2: row[1],
    field3: row[2],
    field4: row[3],
  })));
};
import { fetchSheetData } from './services/googleSheetsService';
import { insertData } from './services/mongoService';

const seedGoogleSheetsToMongo = async () => {
  try {
    const data = await fetchSheetData();

    if (data) {
      await insertData(data);
      console.log('Data seeded successfully!');
    } else {
      console.log('No data found.');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Close the MongoDB connection
    const client = (await import('./services/mongoService')).client;
    if (client) {
      await client.close();
    }
  }
};

// Run the import process
seedGoogleSheetsToMongo();

