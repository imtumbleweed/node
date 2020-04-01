let http = require('http');
let fs = require('fs');
let path = require('path');

/* note, mysql must be installed (npm install mysql) and mysql server running on localhost or elsewhere*/
let { API, database } = require('./module/api/api.js');

database.create();

process.env.node_env = "localhost";

// replace xx.xx.xx.xxx with your own remote IP address or localhost (127.0.0.1)
const ip = '23.239.21.207';
const port = process.env.node_env === 'production' ? 80 : 3000;

http.createServer(function(request, response) {

    console.log('request ', request.url);

    let filename = '.' + request.url;
    if (filename == './')
        filename = './index.html';

    let extension = String(path.extname(filename)).toLowerCase();
    let mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg', '.gif': 'image/gif', }
    let contentType = mime[extension] || 'application/octet-stream';

    fs.readFile(filename, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                if (API.catchAPIrequest( request.url ))
                    API.exec(request, response);
                else
                    fs.readFile('./404.html', function (error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
          } else {
              response.writeHead(500)
              response.end('Server error: ' + error.code + ' ..\n');
              response.end();
          }
        } else {
            console.log("API request detecting...");
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(port, ip);

process.on('exit', function () { database.connection.end(); console.log('process.exit'); });
process.on('SIGINT', function () { console.log('Ctrl-C...'); database.connection.end(); process.exit(2) });
process.on('uncaughtException', function(e) { console.log(e.stack); database.connection.end(); process.exit(99); });

console.log('Server running at http://' + ip + ':' + port + '/');