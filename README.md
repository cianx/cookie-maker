# SAWTOOTH COOKIE MAKER TRANSACTION FAMILY/PROCESSOR EXAMPLE

CookieMaker is a minimal example of a Sawtooth application. It
allows a 'Baker' to keep track of how many cookies they have in
their cookie jar. 

Each Baker can perfom two actions: 
- bake - Creates a cookie - ie: `cookies++`
- eat - Destroys(consumes) a cookie  - ie: `cookies--`

The Baker is identified by their public key, the public key of the 
key pair they use to sign their transactions. The Bakers Cookie Jar 
is located at an address(into the merkle tree) which is derived 
from the hash of the public key plus the transaction processor namespace.
The basic algorithm is as follows:

```javascript
namespace = sha512(‘cookie-maker’).hex().substr(0, 6)
address =  sha512(public_key).hex().substr(64, 64)
globalState[namespace + address] = number of cookies(stored as string)
```


# ARCHTECTURAL OVERVIEW

The CookieMaker application consists of 2 parts. The Client and the Processor

The Client is a single page application, written in Javascript and HTML using 
the aurelia framework(http://aurelia.io/) and webpack(https://webpack.js.org/) as a build tool.

The Processor is a C++ transaction processor written with the Sawtooth C++ 
SDK. It is written to the C++11 standard and uses CMake(https://cmake.org/) as 
a build tool. 

# DEPENDENCIES

The CookieMaker example depends on Docker and Docker Compose being installed and available from the command line. If you do not already have these installed please follow the instructions here: https://docs.docker.com/install/

# BASIC OPERATION

The CookieMaker uses Docker Compose to configure and setup a build environment. To start the environment for the first time:
```bash
docker-compose up
```
This may take awhile as docker images need to be built and downloaded.

Subsequent runs can be started with:
```bash
docker-compose up --build
```

The environment is up and running at this point, you can exit it by hitting 'ctrl-c', which will shutdown all the docker containers and return you to your 
command prompt.

When the environment comes up, the 'cookie-client' runs from the client at"
http://localhost:3000
'cookie-client' runs in the WebpackDevServer, so edits to the client you make on the host are automatically built and refreshed to the client. 

The Sawtooth REST-API is availible at:
http://localhost:8008

The 'cookie-processor' automatically rebuilds and launches everytime the Docker Compose session is started. This is nice to update but a little slow 
for standard development, it is often convienet to open a shell directly on the 'cookie-processor', this can be done via the following command:

```bash
docker-compose run cookie-processor bash
```

The standard build procedure for the 'cookie-processor' is:
```bash
mkdir -p build 
cd build
cmake ..
make
```

The `make` step can be repeated by it's self as you fix errors in you build.

Similarly the 'cookie-client' can be accessed in a similar way. 

```bash
docker-compose run cookie-client bash
```

From this console, `npm` commands can be issued to manipulate the project. 





