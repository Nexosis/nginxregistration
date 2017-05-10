FROM gliderlabs/alpine:3.4

RUN apk --no-cache add nodejs curl \
    && npm install --silent restify \
    && npm install --silent nginx-conf \
    && mkdir /etc/nginx

WORKDIR /app

ADD . /app

EXPOSE 8086

CMD []

ENTRYPOINT ["/usr/bin/npm", "start"]