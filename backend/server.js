import http from 'http';
import Koa from 'koa';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import koaBody from 'koa-body';
// import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import { v4 as uuidv4 } from 'uuid';

const app = new Koa();
const port = 7070;

const uploadDir = path.resolve('uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

function createBotMessage(text) {
    return {
      id: uuidv4(),
      author: 'bot',
      type: 'text',
      text,
      time: getCurrentTime(),
      pinned: false,
      favorite: false,
    };
  }
// const messages = [];
const messages = [
    createBotMessage('Демо 1'),
    createBotMessage('Демо 2'),
    createBotMessage('Демо 3'),
    createBotMessage('Демо 4'),
    createBotMessage('Демо 5'),
  ];

function getCurrentTime() {
  return new Date().toLocaleString();
}

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return 'file';
}



app.use(cors());

app.use(koaBody({
  urlencoded: true,
  multipart: true,
  json: true,
}));

app.use(async (ctx) => {
  if (ctx.method === 'GET' && ctx.path.startsWith('/uploads/')) {
    const fileName = ctx.path.replace('/uploads/', '');
    const filePath = path.join(uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = { error: 'Файл не найден' };
      return;
    }

    ctx.body = fs.createReadStream(filePath);
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/messages') {
    const limit = Number(ctx.query.limit) || 10;
    const offset = Number(ctx.query.offset) || 0;

    const end = messages.length - offset;
    const start = Math.max(end - limit, 0);

    const items = messages.slice(start, end);

    ctx.body = {
      messages: items,
      hasMore: start > 0,
    };
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/favorite') {

    const favoriteArray = messages.filter(function(message) {
        return message.favorite === true; 
      });
    //   console.log(favoriteArray);
    ctx.body = {
      messages: favoriteArray,
    };
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/image') {

    const imageArray = messages.filter(function(message) {
        return message.type === 'image'; 
      });
    ctx.body = {
      messages: imageArray,
    };
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/video') {

    const array = messages.filter(function(message) {
        return message.type === 'video'; 
      });
    ctx.body = {
      messages: array,
    };
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/audio') {

    const array = messages.filter(function(message) {
        return message.type === 'audio'; 
      });
    ctx.body = {
      messages: array,
    };
    return;
  }

  if (ctx.method === 'GET' && ctx.path === '/file') {

    const array = messages.filter(function(message) {
        return message.fileName; 
      });
    ctx.body = {
      messages: array,
    };
    return;
  }


  if (ctx.method === 'GET' && ctx.path === '/pinned') {

    const pinnedMessage = messages.find(function(message) {
        return message.pinned === true; 
      });
    //   console.log(pinnedMessage);
    ctx.body = pinnedMessage;
    return;
  }

  if (ctx.method === 'POST' && ctx.path === '/messages') {
    const { text } = ctx.request.body;

    if (!text || !text.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'Пустое сообщение' };
      return;
    }

    const userMessage = {
      id: uuidv4(),
      author: 'user',
      type: 'text',
      text: text.trim(),
      time: getCurrentTime(),
      pinned: false,
      favorite: false,
    };

    const botMessage = createBotMessage('Сообщение сохранено');

    messages.push(userMessage, botMessage);
    // console.log('messages after text:', messages);

    ctx.body = {
      messages: [userMessage, botMessage],
    };
    return;
  }

  if (ctx.method === 'POST' && ctx.path === '/files') {
    const file = ctx.request.files?.file;

    if (!file) {
      ctx.status = 400;
      ctx.body = { error: 'Файл не получен' };
      return;
    }

    const id = uuidv4();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const savedName = `${id}${ext}`;
    const savedPath = path.join(uploadDir, savedName);

    await fsp.copyFile(file.path, savedPath);

    const fileType = getFileType(file.type);

    const userMessage = {
      id: uuidv4(),
      author: 'user',
      type: fileType,
      fileName: originalName,
      fileUrl: `http://localhost:${port}/uploads/${savedName}`,
      mimeType: file.type,
      time: getCurrentTime(),
      pinned: false,
      favorite: false,
    };

    const botMessage = createBotMessage('Файл сохранён');

    messages.push(userMessage, botMessage);
    // console.log('messages after file:', messages);

    ctx.body = {
      messages: [userMessage, botMessage],
    };
    return;
  }

  if (ctx.method === 'PATCH' && ctx.path.endsWith('/favorite')) {
    const id = ctx.path.split('/')[2];
  
    const message = messages.find((item) => item.id === id);
  
    if (!message) {
      ctx.status = 404;
      ctx.body = { error: 'Сообщение не найдено' };
      return;
    }
    
    message.favorite = !message.favorite;
  
    ctx.body = message;
    return;
  }

  if (ctx.method === 'PATCH' && ctx.path.endsWith('/pinned')) {
    const id = ctx.path.split('/')[2];
  
    const message = messages.find((item) => item.id === id);
  
    if (!message) {
      ctx.status = 404;
      ctx.body = { error: 'Сообщение не найдено' };
      return;
    }
    
    message.pinned = !message.pinned;
  
    ctx.body = message;
    return;
  }

  ctx.status = 404;
  ctx.body = { error: 'Not found' };
});

const server = http.createServer(app.callback());

server.listen(port, (err) => {
  if (err) {
    console.log('Error occured:', err);
    return;
  }

  console.log(`Server is listening on ${port}`);
});