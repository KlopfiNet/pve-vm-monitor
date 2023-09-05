FROM node:slim

RUN mkdir /app
WORKDIR /app

# Install all the stuff
COPY . /app
RUN npm i \
    && npm install typescript -g

EXPOSE 3000

ENTRYPOINT ["npm", "start"]