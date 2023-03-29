#!/bin/sh

# Assumes $PWD is the `ws` dir.

# Install the node deps.
docker run --rm -it -v "${PWD}:/usr/src" -w /usr/src node npm install

# Run the server
docker run -d --restart unless-stopped -v "${PWD}:/usr/src" -v "/etc/letsencrypt:/etc/letsencrypt" -w /usr/src -p 8080:8080 node server.js
