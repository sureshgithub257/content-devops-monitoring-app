Add the Prometheus Client Library and Collect Default Metrics
In the Application server terminal, move into the forethought directory:

cd forethought
Install the prom-client via npm, Node.js's package manager:

npm install prom-client --save
Open the index.js file, where we'll be adding all of our metrics code:

$EDITOR index.js
Require the use of the prom-client by adding it to our variable list:

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const prom = require('prom-client');
With prom being the name we'll use when calling the client library.

Enable default metrics scraping:

const collectDefaultMetrics = prom.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'forethought_' });
Use Express to create the /metrics endpoint and call in the Prometheus data:

app.get('/metrics', function (req, res) {
  res.set('Content-Type', prom.register.contentType);
  res.end(prom.register.metrics());
});
Add the forethought_tasks_added Metric
Define the metric:

// Metric Definitions

const tasksadded = new prom.Counter({
  name: 'forethought_tasks_added',
  help: 'The number of items added to the to-do list, total'
});
Call the new metric in the addtask post function so it increases by one every time the function is called while adding a task:

// add a task
app.post("/addtask", function(req, res) {
  var newTask = req.body.newtask;
  task.push(newTask);
  res.redirect("/");
  tasksadded.inc();
});
Add the forethought_tasks_complete Metric
Define the metric:

const tasksdone = new prom.Counter({
  name: 'forethought_tasks_complete',
  help: 'The number of items completed'
});
Call the new metric in the /removetask post function so it increases by one every time the function is called:

// remove a task
app.post("/removetask", function(req, res) {
  var completeTask = req.body.check;
  if (typeof completeTask === "string") {
    complete.push(completeTask);
    task.splice(task.indexOf(completeTask), 1);
  }
  else if (typeof completeTask === "object") {
    for (var i = 0; i < completeTask.length; i++) {
      complete.push(completeTask[i]);
      task.splice(task.indexOf(completeTask[i]), 1);
      tasksdone.inc()
    }
  }
  res.redirect("/");
});
Add the forethought_current_tasks Metric
Define the metric:

const taskgauge = new prom.Gauge({
  name: 'forethought_current_tasks',
  help: 'Amount of incomplete tasks'
});
Add an increase to the /addtask method:

// add a task
app.post("/addtask", function(req, res) {
  var newTask = req.body.newtask;
  task.push(newTask);
  res.redirect("/");
  tasksadded.inc();
  taskgauge.inc();
});
Add a decrease to the /removetask method:

// remove a task
app.post("/removetask", function(req, res) {
  var completeTask = req.body.check;
  if (typeof completeTask === "string") {
    complete.push(completeTask);
    task.splice(task.indexOf(completeTask), 1);
  }
  else if (typeof completeTask === "object") {
    for (var i = 0; i < completeTask.length; i++) {
      complete.push(completeTask[i]);
      task.splice(task.indexOf(completeTask[i]), 1);
      tasksdone.inc();
      taskgauge.dec();
    }
  }
  res.redirect("/");
});
Save and exit.

Add the forethought_response_time_summary Metric
Add the response-time module:

npm install response-time --save
Reopen the index.js file.

Define the metric:

const responsetimesumm = new prom.Summary ({
  name: 'forethought_response_time_summary',
  help: 'Latency in percentiles',
});
Add response-time:

var responseTime = require('response-time');
Write the code to retrieve the response time:

// tracking response time

app.use(responseTime(function (req, res, time) {
  responsetimesumm.observe(time);
}));
Add the forethought_response_time_histogram Metric
Define the metric:

const responsetimehist = new prom.Histogram ({
  name: 'forethought_response_time_histogram',
  help: 'Latency in history form',
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});
Call the histogram in the existing response-time code:

app.use(responseTime(function (req, res, time) {
  responsetimesumm.observe(time);
  responsetimehist.observe(time);
}));
Redeploy the Application
Stop the current Docker container for our application:

docker stop ft-app
Remove the container:

docker rm ft-app
Remove the image:

docker image rm forethought
Rebuild the image:

docker build -t forethought .
Deploy the new container:

docker run --name ft-app -p 80:8080 -d forethought
Switch to the Monitoring server terminal.

Add our application endpoint to Prometheus (replacing PRIVATE_IP with the private IP for the Application server listed on the lab page):

sudo $EDITOR /etc/prometheus/prometheus.yml

  - job_name: 'forethought'
    static_configs:
    - targets: ['PRIVATE_IP:80']
Save and exit.

Restart Prometheus:

sudo systemctl restart prometheus
