var http = require('http'),
    express = require('express'),
    app = express(),
    qs = require('querystring'),
    OAuth = require('oauth').OAuth,
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    util = require('util'),
    fitbitClient = require('./fitbitClient.js');


var sess = {
    secret: 'keyboard cat',
    cookie: {},
    resave: true,
    saveUninitialized: true,
    userId: '-'}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

app.set('views', __dirname + '/views'); //
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(session(sess));
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// Fitbit initialization
fitbitClient.init(process.env.CONSUMERKEY,process.env.CONSUMERSECRET,process.env.OAUTH_CB_URL)

// Routes

app.get('/', function(request, response) {
    fitbitClient.getRequestToken(function (error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log(error);
        } else {
            request.session.oauth_token = oauth_token;
            request.session.oauth_token_secret = oauth_token_secret;

            response.redirect(fitbitClient.getAuthorizeURL(oauth_token));
        }
    });
});

app.get('/oauth_callback', function (request, response) {
    // Checked the oauth verifier value => console.log(request.query.oauth_verifier);
    fitbitClient.getAccessToken(request.session.oauth_token, request.session.oauth_token_secret, request.query.oauth_verifier, function (error, oauth_access_token, oauth_access_token_secret, results) {
            if (error) {
                console.log(error);
            } else {
                //Store in session variable
                request.session.oauth_access_token = oauth_access_token;
                request.session.oauth_access_token_secret = oauth_access_token_secret;
                //var ex_data = request.session.oauth_access_token;
                //var ex_data = JSON.stringify(request);
                fitbitClient.setToken(oauth_access_token);
                fitbitClient.setTokenSecret(oauth_access_token_secret);
                
                var result = {
                    oauthAccessToken : oauth_access_token,
                    oauthAccessTokenSecret : oauth_access_token_secret,
                    userId : '-'
                };
                var location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(result));
                console.log("Warping to: " + location);
                //response.redirect('/getWeight')
                response.redirect(location);
                //response.render('index', {ex_data: ex_data}); //
            }
    });
   
});

app.get('/test', function (request, response) {
    console.log('got started');
    var tn = request.query.tn;
    var tns = request.query.tns;
    var userId = '-';
    response.send(tn + tns);
   //fitbitClient.requestResource(
    //    '/activities/date/2015-08-12.json', 
    //    'GET', 
    //    tn,
    //    tns,
    //    //fitbitClient.getToken(),
    //    //fitbitClient.getTokenSecret(),
    //    userId,
    //    function (error, data, result) {
    //        var feed = JSON.parse(data);
    //        response.send(feed);
    //        console.log(feed);
    //    }
    //);
    fitbitClient.requestResource(
        '/body/log/weight/date/2015-03-01/30d.json', 
        'GET', 
        fitbitClient.getToken(),
        fitbitClient.getTokenSecret(),
        fitbitClient.getTokenSecret(),
        userId,
        function (error, data, result) {
            var feed = JSON.parse(data);
            response.send(feed);
            console.log(error);
            console.log(feed);
        }
    );
});

// Run evernote version
//http.createServer(app).listen(app.get('port'), function(){
//  console.log("Express server listening on port " + app.get('port'));
//});
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
