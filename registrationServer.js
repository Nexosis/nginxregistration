var restify = require('restify');
var fs = require('fs');
var exec = require('child_process').exec;
var NginxConfFile = require('nginx-conf').NginxConfFile;
var server = restify.createServer();
var isWin = /^win/.test(process.platform);

var fileLocation = '/etc/nginx/nginx.conf';
if (process.env.NGINX_CONF) {
    fileLocation = process.env.NGINX_CONF;
}

function respondToRegistration(req, res, next) {
    NginxConfFile.create(fileLocation, function(err, conf) {
        if (err) {
            console.log(err);
            return;
        }
        var addedItem = null;
        if (!conf.nginx.http.upstream) {
            conf.nginx.http._add("upstream", "apiserver");
        }
        if (Array.isArray(conf.nginx.http.upstream.server)) {
            var exists = mapAndIndexUpstreamValues(conf.nginx.http.upstream.server, req.params.address) > -1;
            console.log("Request to add " + req.params.address);
            if (!exists) {
                addedItem = req.params.address;
            }
        } else if (conf.nginx.http.upstream.server) {
            var trimmedAddress = conf.nginx.http.upstream.server.toString().trim();
            if (trimmedAddress != "server " + req.params.address + ";") {
                addedItem = req.params.address;
            }
        } else {
            addedItem = req.params.address;
        }
        if (addedItem) {
            console.log("Current upstream is " + conf.nginx.http.upstream);
            conf.nginx.http.upstream._add('server', addedItem);
            res.json(200, "{'RegistrationStatus':'Success'}");
            console.log("upstream is now " + conf.nginx.http.upstream);
            conf.flush();
            reloadConfig();
        } else {
            res.json(203, "{'RegistrationStatus':'Exists'}");
        }
    });

    return next();
}

function respondToDeregistration(req, res, next) {
    NginxConfFile.create(fileLocation, function(err, conf) {
        if (err) {
            console.log(err);
            return;
        }
        var removeAt = -1;
        var itemToRemove = null;
        if (Array.isArray(conf.nginx.http.upstream.server)) {
            removeAt = mapAndIndexUpstreamValues(conf.nginx.http.upstream.server, req.params.address);
            if (removeAt > -1) {
                itemToRemove = conf.nginx.http.upstream.server[removeAt];
                conf.nginx.http.upstream._remove('server', removeAt);
            }
        } else if (conf.nginx.http.upstream.server) {
            trimmedAddress = conf.nginx.http.upstream.server.toString().trim();
            if (trimmedAddress === "server " + req.params.address + ";") {
                itemToRemove = trimmedAddress;
                conf.nginx.http._remove('upstream');
            }
        }
        if (itemToRemove) {
            res.json(200, "{'DeregistrationStatus':'Success'}");
            conf.flush();
            reloadConfig();
        } else {
            res.json(404, "{'DeregistrationStatus':'Not Found'}");
        }
    });

    return next();
}

function mapAndIndexUpstreamValues(serverConf, address) {
    var mapped = serverConf.map(function(x) {
        return x.toString().trim();
    });
    var searchVal = "server " + address + ";";
    return mapped.indexOf(searchVal);
}

function reloadConfig() {
    var cmd = 'docker restart gateway';
    //Ideally docker exec gateway nginx -s reload
    //or nginx -c /etc/nginx/nginx.conf
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            console.error("exec error: " + error);
            return;
        }
        console.log("stdout: " + stdout);
        console.log("stderr: " + stderr);
    });
}

server.get('/register/:address', respondToRegistration);
server.get('/deregister/:address', respondToDeregistration);

server.listen(8086);