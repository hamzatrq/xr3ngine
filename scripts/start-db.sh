#!/usr/bin/env bash

if which docker > /dev/null 2>&1
then
    if which docker-compose > /dev/null 2>&1
    then
        echo "✅ Docker & Docker-Compose Detected:"
        echo -e "\e[32m💾 Initializing mariadb docker image..."
        docker stop xr3ngine
        docker rm xr3ngine
        docker-compose up
    else
        echo "❌ Please install docker-compose..."
    fi
else
    echo "❌ Please install docker..."
fi
