---
id: doc2
title: Installation
---


![xr3ngine](https://github.com/xr3ngine/xr3ngine/raw/dev/xrengine%20black.png)

## Getting Started

Getting up and running requires only a few steps.

IF ON WINDOWS, go to Native Windows Preinstall below

For on OSX / Linux / WSL2 for Windows:

First, make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed (and if you are using it, [docker](https://docs.docker.com/)).

1. Install your dependencies
    ```
    cd path/to/xr3ngine
    yarn install
    ```
    Error with mediasoup? Optional: https://mediasoup.org/documentation/v3/mediasoup/installation/

    If on WSL2:
	```
	sudo apt-get update
	sudo apt-get install build-essential
	npm install -g node-gypPYTHON=python3 yarn install
	npm config set python /usr/bin/python
	PYTHON=python3 yarn install
	```
2. Make sure you have a mysql database installed and running -- our recommendation is Mariadb. We've provided a docker container for easy setup:
    ```
    cd scripts && sudo bash start-db.sh
    ```
    This creates a Docker container of mariadb named xr3ngine_db. You must have docker installed on your machine for this script to work.
    If you do not have Docker installed and do not wish to install it, you'll have to manually create a MariaDB server.

   The default username is 'server', the default password is 'password', the default database name is 'xr3ngine', the default hostname is '127.0.0.1', and the default port is '3306'.

   Seeing errors connecting to the local DB? Shut off your local firewall.

3. Open a new tab and start the Agones sidecar in local mode

    ```
   cd scripts
   sudo bash start-agones.sh
   ```

   You can also go to vendor/agones/ and run

   ```./sdk-server.linux.amd64 --local```

   If you are using a Windows machine, run

   ```sdk-server.windows.amd64.exe --local```

   and for mac, run

   ```./sdk-server.darwin.amd64 --local```

4. Obtain .env.local file with configuration variable.
   Many parts of XR3ngine are configured using environment variables.
   For simplicity, it's recommended that you create a file called ```.env.local``` in the top level of xr3ngine,
   and have all of your ENV_VAR definitions here in the form ```<VAR_NAME>=<VALUE>```.
   If you are actively working on this project, contact one of the developers for a copy of the file
   that has all of the development settings and keys in it.

5. Start the server in database seed mode

   Several tables in the database need to be seeded with default values.
   Run ```cd packages/server```, then run ```yarn dev-reinit-db```.
   After several seconds, there should be no more logging.
   Some of the final lines should read like this:
   ```Executing (default): SELECT 'id', 'name', 'sceneId', 'locationSettingsId', 'slugifiedName', 'maxUsersPerInstance', 'createdAt', 'updatedAt' FROM 'location' AS 'location' WHERE ('location'.'id' = '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d61') AND 'location'.'id' IN ('98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d61'); Seeded```

    At this point, the database has been seeded. You can shut down the server with CTRL+C.

6. Open two separate tabs and start the server (non-seeding) and the client
   In /packages/server, run ```sudo yarn dev```.
   In the other tab, go to /packages/client and run ```sudo yarn dev```.

7. In a browser, navigate to https://127.0.0.1:3000/location/home
   The database seeding process creates a test empty location called 'test'.
   It can be navigated to by going to 'https://127.0.0.1:3000/location/home'.
   See the sections below about invalid certificates if you are encountering errors
   connecting to the client, API, or gameserver.

   ### Native Windows Preinstall

   1. Add Env Variable
   ```
   PUPPETEER_SKIP_DOWNLOAD='true'
   ```
   2. install python 2 and add python installation directory path to 'path' env variable.

   3. Install node js

   4. install Visual studio community edition with build tools. follow next steps. If mediasoup will not installed properly then modify Visual studio setup to add c++ and Node.js support.

   5. add environmental variable
   ```
   GYP_MSVS_VERSION=<vs-year>
   for example, GYP_MSVS_VERSION=2019
   ```

   6. add path to MSbuild.exe (which is present into vs installation folder) into 'path' variable
   for example:``` C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin```

   7. remove mediasoup and mediasoup-client from every package.json. This will enable us to add all the dependencies except mediasoup, this way we can save time while dealing with mediasoup.

   8. rename 'postinstall' to 'postinstall-1' so that it will not run after installing dependencies.

   9. install all dependences using yarn.

   10. add back all removed mediasoup and mediasoup-client dependencies.

   11. Rerun yarn command to install dependencies to install newly added mediasoup and mediasoup-client dependencies.

   12. If error persists then check for typos in evironment variables.

   13. If you are on Windows, you can use docker-compose to start the scripts/docker-compose.yml file, or install mariadb and copy the login/pass and database name from docker-compose or .env.local -- you will need to create the database with the matching name, but you do not need to populate it

   ./start-db.sh only needs to be run once. If the docker image has stopped, start it again with:

   ```
       docker container start xr3ngine_db
   ```

   ### OSX DB Native Initialization Commands
   ```
   brew install mysql

   mysql_secure_installation
   server
   password

   mysql -uroot -ppassword
   mysql -userver -ppassword

   create database xr3ngine;
   create user 'server'@'127.0.0.1' identified by 'password';
   grant all on xr3ngine.* to 'server'@'127.0.0.1';

   show databases;

   mysql.server start
   mysql.server stop
   ```
   ### Troubleshooting

   #### Invalid Certificate errors in local environment

   As of this writing, the cert provided in the xr3ngine package for local use
   is not adequately signed. Browsers will throw up warnings about going to insecure pages.
   You should be able to tell the browser to ignore it, usually by clicking on some sort
   of 'advanced options' button or link and then something along the lines of 'go there anyway'.

   Chrome sometimes does not show a clickable option on the warning. If so, just
   type ```badidea``` or ```thisisunsafe``` when on that page. You don't enter that into the
   address bar or into a text box, Chrome is just passively listening for those commands.

   ##### Allow gameserver address connection via installing local Certificate Authority
   For more detailed instructions check: https://github.com/FiloSottile/mkcert

   Short version (common for development process on Ubuntu):
   1. `sudo apt install libnss3-tools`
   2. `brew install mkcert` (if you don't have brew, check it's page: https://brew.sh/)
   3. `mkcert --install`
   4. navigate to `./certs` folder
   5. mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1

   ##### Allow gameserver address connection with invalid certificate

   The gameserver functionality is hosted on an address other than 127.0.0.1 in the local
   environment. Accepting an invalid certificate for 127.0.0.1 will not apply to this address.
   Open the dev console for Chrome/Firefox by pressing ```Ctrl+Shift+i``` simultaneously, and
   go to the Console or Network tabs.

   If you see errors about not being able to connect to
   something like ```https://192.168.0.81/socket.io/?location=<foobar>```, right click on
   that URL and open it in a new tab. You should again get a warning page about an invalid
   certificate, and you again need to allow it.  

   #### AccessDenied connecting to mariadb

   Make sure you don't have another instance of mariadb running on port 3306
   ```
       lsof -i :3306
   ```

   On Linux, you can also check if any processes are running on port 3306 with
   ```sudo netstat -utlp | grep 3306```
   The last column should look like ```<ID>/<something```
   You can kill any running process with ```sudo kill <ID>```

   #### Error: listen EADDRINUSE :::3030

   check which process is using port 3030 and kill
   ```
       killall -9 node
   ```
       OR
   ```
       lsof -i :3030
   	kill -3 <proccessIDfromPreviousCommand>
   ```

   #### 'TypeError: Cannot read property 'position' of undefined' when accessing /location/home
       As of this writing, there's a bug with the default seeded test location.
       Go to /editor/projects and open the 'Test' project. Save the project, and
       the error should go away.

   #### Weird issues with your database?
   Try
   ```
   yarn run dev-reinit-db // in server package
   ```
