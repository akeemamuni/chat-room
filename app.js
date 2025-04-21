require('dotenv').config()
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const currentTime = () => {
    return Intl.DateTimeFormat(
        'en-US', 
        {
            dateStyle: 'short', 
            timeStyle: 'short', 
            timeZone: 'America/New_York'
        }
    ).format(new Date());
}

const clients = new Map();

wss.on('connection', ws => {
    // Set UNIX epoch time as ID
    const clientId = Date.now();

    clients.set(clientId, ws);
    console.log(`${currentTime()}\tClient connected: ${clientId}`);

    // Message on connect
    ws.send(JSON.stringify(
        {
            type: 'userJoined',
            datetime: `${currentTime()}`,
            message: `You joined the chat as user ${clientId}`
        }
    ));
    // Notify other clients about the new user
    clients.forEach((client, id) => {
        if (id !== clientId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(
                {
                    type: 'userJoined',
                    datetime: `${currentTime()}`,
                    message: `User ${clientId} joined the chat`
                }
            ));
        }
    });
    // Message event
    ws.on('message', message => {
        console.log(`${currentTime()}\tReceived message from ${clientId}: ${message}`);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(
                    {
                        type: 'newMessage', 
                        sender: clientId,
                        datetime: `${currentTime()}`,
                        text: message.toString()
                    }
                ));
            }
        });
    });
    // Close event
    ws.on('close', () => {
        console.log(`${currentTime()}\tClient disconnected: ${clientId}`);
        clients.delete(clientId);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(
                    {
                        type: 'userLeft',
                        datetime: `${currentTime()}`,
                        message: `User ${clientId} left the chat`
                    }
                ));
            }
        });
    });
    // Error event
    ws.on('error', error => {
        console.error(`${currentTime()}\tWebSocket error for client ${clientId}: ${error}`);
        clients.delete(clientId);
    });
});

const PORT = process.env.PORT || 8000;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`${currentTime()}\tServer listening on port ${PORT}`);
});
