FROM node:20.17.0

WORKDIR /frontend

COPY . .

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]