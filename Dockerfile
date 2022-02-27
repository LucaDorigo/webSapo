FROM node:14.18.1

WORKDIR "/usr/src/sapo"
COPY ["package*.json", "./"]

#RUN apt-get update && apt-get install git

RUN npm install

# install dependencies for sapo
RUN apt-get update && apt-get install -y gcc cmake make

RUN wget https://github.com/westes/flex/releases/download/v2.6.4/flex-2.6.4.tar.gz
RUN tar -zxvf flex-2.6.4.tar.gz && cd flex-2.6.4 && ./configure && make && make install

RUN wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz
RUN tar -zxvf bison-3.8.2.tar.gz && cd bison-3.8.2 && ./configure && make && make install

RUN apt-get update && apt-get install -y zip
RUN apt-get update && apt-get install -y wget tar

# GNU MP (for GLPK)
RUN wget ftp.gnu.org/gnu/gmp/gmp-6.2.1.tar.xz
RUN tar -xvf gmp-6.2.1.tar.xz && cd gmp-6.2.1 && ./configure && make && make check && make install

# GLPK
RUN wget http://ftp.gnu.org/gnu/glpk/glpk-5.0.tar.gz
RUN tar -zxvf glpk-5.0.tar.gz && cd glpk-5.0 && ./configure --with-gmp && make && make install

COPY . . 

RUN cd sapoCore && cmake . && make

RUN chown -R node /usr/src/sapo
USER node

EXPOSE 3001
CMD ["npm", "start"]
