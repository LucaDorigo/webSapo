# webSapo
GUI for SAPO as a web app.
This is already online [here](http://encase.uniud.it:3001/#/).

## Installation

### SAPO dependencies
We need dependencies for SAPO to work (see also [SAPO](https://github.com/dreossi/sapo))
- [GiNaC](www.ginac.de)
- [CLN](www.ginac.de/cln)
- [GLPK](https://www.gnu.org/software/glpk/)

We also need a C++11 compatible compiler.
If we want to modify parser and lexer, also [Flex](https://github.com/westes/flex)/[Bison](https://www.gnu.org/software/bison/) must be installed.

### Interface dependencies
We need nodejs and npm installed.
All dependencies will be automatically installed in the following.


### Downloading and installing
If thes dependencies are met, we can download and install the tool
```
git clone --recurse-submodules https://github.com/LucaDorigo/webSapo
cd webSapo
#install dependencies for server
npm install
#install dependencies for client
(cd client && npm install)
#build SAPO
(cd sapoCore && cmake . && make)
```

## Usage
Running
```
npm run start:dev
```
will start a server listening on `localhost:3001` and a development server for the front--end listening on `localhost:3000`.

The two servers can be started separately by calling
```
npm run server
npm run client
```

Once both servers are up, the tool will be available on `localhost:3000`.

## Docker
WebSapo can be executed in a docker container. In order to build the docker image, complete the following steps:
1. Build the client using the command:
```
(cd client && npm install && npm run build)
```
2. Build the docker image by executing:
```
docker build -t <NAME OF THE IMAGE> .
```
<br/>

Once the image has been built, the docker container can be instanciated and run by using the command:
```
docker run -p 3001:3001 --name <NAME OF THE CONTAINER> <NAME OF THE IMAGE>
```

WebSapo will be available from any web browser at [http://localhost:3001](http://localhost:3001).

In order to restart it, use [Docker Desktop](https://www.docker.com/products/docker-desktop) or simply run:
```
docker restart <NAME OF THE CONTAINER>
```
<br/>

For more details about docker, see [this page](https://docs.docker.com).
