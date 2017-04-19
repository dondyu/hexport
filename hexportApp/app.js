var express = require('express');
var app = express();
var path = require('path');
var routes = require('./routes/index');

//ROUTES
app.use('/', routes);

app.set('port', (process.env.PORT || 3000))

app.listen(app.get('port'), function(){
  console.log('Server started on port '+ app.get('port'))
})
