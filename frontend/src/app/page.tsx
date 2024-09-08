'use client'

import { FC } from 'react';
import {useEffect, useState} from 'react';

const Home: FC = () => {
  const [recordCount, setRecordCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5002');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'getCount' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'countResponse') {
        setRecordCount(data.count); // Update state with the received count
        if(data.count > 0) { setSelectedRecord(1); }
      } else if (data.type === 'error') {
        setError(data.message); // Handle any error messages
      }
    };

    // Log any errors that occur
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket error occurred.');
    };

    // Log when the WebSocket connection is closed
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup: close WebSocket connection when the component unmounts
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center w-full max-w-lg bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-1">
          <button className="focus:outline-none">
            <span className="material-icons">&#x25B2;</span> {/* Up arrow icon */}
          </button>
          <button className="focus:outline-none">
            <span className="material-icons">&#x25BC;</span> {/* Down arrow icon */}
          </button>
        </div>
        <span className="text-gray-600">{recordCount} records</span> {/* Right aligned */}
      </div>

      {/* Profile Section */}
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-6 mt-2">
        <h1 className="text-2xl font-bold mb-4">No</h1>
        <h2 className="text-4xl font-bold text-gray-800 mb-6">{selectedRecord}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">UserName</label>
            <input
              type="text"
              value="ProgrammingHero1"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value="Programming Hero"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value=""
              readOnly
              placeholder="Not available"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Followers</label>
            <input
              type="number"
              value="17995"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Repositories</label>
            <input
              type="number"
              value="608"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stars</label>
            <input
              type="number"
              value="3396"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
