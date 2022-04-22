FROM node:16.14.2-bullseye

WORKDIR "/usr/src/sapo"
COPY ["package*.json", "./"]

RUN npm install

# install dependencies for sapo
RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y gcc cmake make flex bison 

# sapo dependencies
RUN apt-get install -y libgmp-dev libglpk-dev

# polyprojector depedencies
RUN apt-get install -y libgmp-dev libglpk-dev nlohmann-json3-dev


COPY . . 

RUN cd sapoCore && cmake . && make
RUN cd polyprojector && cmake . && make

RUN chown -R node /usr/src/sapo
USER node

EXPOSE 3001
CMD ["npm", "start"]
