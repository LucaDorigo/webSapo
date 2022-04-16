FROM node:16.14.2

WORKDIR "/usr/src/sapo"
COPY ["package*.json", "./"]

RUN npm install

# install dependencies for sapo
RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y zip wget tar
RUN apt-get install -y gcc cmake make flex

RUN wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz
RUN tar -zxvf bison-3.8.2.tar.gz && cd bison-3.8.2 && ./configure && make && make install

# GNU MP (for GLPK)
RUN apt-get install -y libgmp-dev

# GLPK
RUN wget http://ftp.gnu.org/gnu/glpk/glpk-5.0.tar.gz
RUN tar -zxvf glpk-5.0.tar.gz && cd glpk-5.0 && ./configure --with-gmp && make && make install

COPY . . 

RUN cd sapoCore && cmake . && make

RUN chown -R node /usr/src/sapo
USER node

EXPOSE 3001
CMD ["npm", "start"]
