const http = require('http'),
    httpProxy = require('http-proxy');

let arguments = process.argv.splice(2),
    image = arguments[0],
    numberProcesses = parseInt(arguments[1]),
    host = arguments[2],
    port = parseInt(arguments[3]),
    hostDaemon = arguments[4],
    portDaemon = parseInt(arguments[5]),
    spawn = require('child_process').spawn;


let cmd = 'load("' + image + '"); .load_pkgs(); jug::serve_it(.JUG, port={port})';


let env = Object.create(process.env);
env.JUG_PARALLEL = 1
let processPort = 10000
// define jug processes
let processes = Array(numberProcesses)
    .fill(0)
    .map((x, i) => ({
        host: 'localhost',
        port: processPort + i
    }))
    .map((x) => {
        x.target = 'http://' + x.host + ':' + x.port
        return x
    });

// spin up jug processes

for (let i = 0; i < processes.length; i++) {
    let rCmd = cmd.replace('{port}', processes[i].port);
    console.log('Creating instance ' + i + ' at port ' + processes[i].port);

    let child = spawn('Rscript',
        args = ['-e', rCmd],
        options = {
            env: env,
            detached: true
        });

    processes[i].pid = child.pid;

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

}

process.on('exit', function() {
    process.stdout.write('Stopping servers...')
    for (let i = 0; i < processes.length; i++) {
        process.kill(-processes[i].pid);
    }
    console.log('success')
});

let proxy = httpProxy.createProxyServer(options);
proxy.on('error', function(e) {
    console.log('Proxy error:' + e);
});


let p = 0;
http.createServer(function(req, res) {
    proxy.web(req, res, processes[p]);
    p = (p + 1) % processes.length;
}).listen(port);


http.createServer(function(req, res) {
    if (req.url == '/stop') {
        res.end('stopping servers...');
        process.exit(0)
    }
}).listen(portDaemon);