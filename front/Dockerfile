# Build React app
FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build && ls -la dist/

# Serve using Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Créer un fichier mime.types complet
RUN echo "types {" > /etc/nginx/mime.types && \
    echo "    text/html                             html htm shtml;" >> /etc/nginx/mime.types && \
    echo "    text/css                              css;" >> /etc/nginx/mime.types && \
    echo "    application/javascript                js mjs;" >> /etc/nginx/mime.types && \
    echo "    application/json                      json;" >> /etc/nginx/mime.types && \
    echo "    image/png                             png;" >> /etc/nginx/mime.types && \
    echo "    image/jpeg                            jpeg jpg;" >> /etc/nginx/mime.types && \
    echo "    image/gif                             gif;" >> /etc/nginx/mime.types && \
    echo "    image/svg+xml                         svg svgz;" >> /etc/nginx/mime.types && \
    echo "    application/font-woff                 woff;" >> /etc/nginx/mime.types && \
    echo "    application/font-woff2                woff2;" >> /etc/nginx/mime.types && \
    echo "    application/pdf                       pdf;" >> /etc/nginx/mime.types && \
    echo "    application/octet-stream              bin exe dll;" >> /etc/nginx/mime.types && \
    echo "}" >> /etc/nginx/mime.types

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]