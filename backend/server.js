const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Airtable = require('airtable');
const { setupWSConnection } = require('y-websocket/bin/utils');
const dotenv = require('dotenv');
const cors = require('cors');
const {bundleAirtableData} = require('./bundleData.js');

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

// Helper function to handle WebSocket connection and send bundled data
async function handleConnection(ws, req, table, recordId, view) {
    if (req.url === `/${recordId}`) {
      setupWSConnection(ws, req, { docName: `room-${recordId}` });
      console.log('sss');
      try {
        const bundledData = await bundleAirtableData(table, recordId, view);
        ws.send(JSON.stringify(bundledData));
        console.log(`Client connected to record: ${recordId}`);
      } catch (error) {
        console.error('Error sending bundled data:', error);
      }
    } 
}

async function countRecords(table) {
  return new Promise((resolve, reject) => {
    let recordCount = [];
    base(table).select({}).eachPage(
      (records, fetchNextPage) => {
        recordCount += records.length; // Count records on each page
        fetchNextPage();
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(recordCount); // Resolve with the total count
      }
    );
  });
}

// Fetch all records and set up WebSocket channels per record
async function setupAllRecordChannels(table,view) {
    base(table).select().eachPage(async (records, fetchNextPage) => {
      for (const record of records) {
        const recordId = record.id;
        console.log(recordId);
        // Set up WebSocket connection handler for each record
        wss.on('connection', (ws, req) => {
          // Use the helper function to handle the connection asynchronously
          handleConnection(ws, req, table, recordId, view);
          ws.on('message', async (message) => {
            try {
              const data = JSON.parse(message);
              
              // Check if the message is a request for record count
              if (data.type === 'getCount') {
                const count = await countRecords(table);
                ws.send(JSON.stringify({ type: 'countResponse', count }));
              }
            } catch (error) {
              console.error('Error handling WebSocket message:', error);
              ws.send(JSON.stringify({ type: 'error', message: 'Error processing your request.' }));
            }
          });
        });
      }
  
      fetchNextPage();
    }, (err) => {
      if (err) { console.error(err); return; }
    });
}
  
setupAllRecordChannels(process.env.AIRTABLE_TABLE, process.env.AIRTABLE_VIEW);
  
server.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});