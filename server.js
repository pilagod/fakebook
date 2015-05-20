/**
 * Created by pilagod on 10/9/14.
 */

var mysql = require('mysql');
//
//var db_config = {
//    host: 'sdm2.im.ntu.edu.tw',
//    port: '3306',
//    user: 'r03725029',
//    password: 'GAXAsWIj',
//    database: 'r03725029'
//};

var db_config = {
    host: '140.112.107.74',
    port: '3306',
    user: 'r03725029',
    password: 'r03725029',
    database: 'fakebook'
};

var connection;
handleDisconnect();

var bodyparser = require('body-parser');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Array();

server.listen(8000, function(){
    console.log("listening on *:8000");
});

// Very Important!!!!
// It can get static file via URL
app.use(express.static(__dirname));
app.use(bodyparser());



app.get('/forum', function(req, res){
    res.sendFile('forum.html', {"root": __dirname});
});

app.get('/login', function(req, res){
    res.sendFile('login.html', {"root": __dirname});
});

app.get(/^\//, function(req, res){
    res.redirect("/login");
});


io.on('connection', function(socket){

    console.log(socket.id + ' a user connected.');

    socket.on(
        "user_data",
        function(username, userid){
            console.log(userid);
            connection.query(
                "SELECT id FROM `hw2_user` WHERE `id`=" + userid,
                function(err, data, field){
                    if(err)
                        console.log(err);
                    if(data.length == 0){
                        console.log(userid);
                        connection.query(
                            "INSERT INTO `hw2_user`(id, name) VALUES " +
                                "('" + userid + "', '" + username + "')",
                            function(err){
                                if(err)
                                    console.log(err);
                            }
                        );
                    }
                }
            );
        }
    );
    //io.sockets.in(room).emit(...) : to all socket in room include self
    //socket.broadcast.to(room).emit(...): to all socket in room except self

    page_load(socket);

    // Topic Event
    socket.on(
        "new_topic",
        function(topic, author_id, content){
            var time = new Date();
            var data = {
                "topic": topic,
                "author_id": author_id,
                "content": content,
                "time": time
            };
            console.log(data);
            add_topic(data, function(id, author){
                data["id"] = id;
                data["author"] = author;
                io.emit('add_topic', data);
            });
        }
    );

    socket.on(
        "get_more_topics",
        function(oldest_time, oldest_id){
            connection.query(
                "SELECT * FROM `topic_data`" +
                "WHERE `time` <= '" + oldest_time + "' AND `id` < " + oldest_id + " " +
                "ORDER BY `time` DESC, `id` DESC LIMIT 10",
                function(err, data, field){
                    //console.log(data);
                    io.sockets.in(socket.id).emit('load_more_topics', data);
                }
            );
        }
    );

    socket.on(
        "delete_topic",
        function(id){
            delete_topic(id);
        }
    );

    // Comment Event
    socket.on(
        "new_comment",
        function(topic_id, author_id, content){
            //console.log(topic_id, author, content);
            var time = new Date();
            var data = {
                "topic_id": topic_id,
                "author_id": author_id,
                "content": content,
                "time": time
            };
            add_comment(data, function(id, author){
                data["id"] = id;
                data["author"] = author;
                io.emit('add_comment', data);
            });
        }
    );

    socket.on(
        "get_comment",
        function(topic_id){
            connection.query(
                    "SELECT * from `comment_data`" +
                    "WHERE `topic_id` = '" + topic_id + "' " +
                    "ORDER BY `time` DESC, `id` DESC LIMIT 6",
                function(err, data, field){
                    //console.log(socket.id);
                    //console.log(data);
                    io.sockets.in(socket.id).emit('load_comments', data);
                }
            );
        }
    );

    socket.on(
        "get_more_comments",
        function(oldest_time, oldest_id, post_id){
            connection.query(
                "SELECT * FROM `comment_data`" +
                "WHERE `topic_id` = " + post_id + " AND `time` <= '" + oldest_time + "' AND `id` < " + oldest_id + " " +
                "ORDER BY `time` DESC, `id` DESC LIMIT 6",
                function(err, data, field){
                    io.sockets.in(socket.id).emit("load_more_comments", post_id, data);
                }
            );
        }
    );

    socket.on(
        "delete_comment",
        function(id){
            delete_comment(id);
        }
    );

    socket.on('disconnect', function(){
        console.log('a user disconnected.');
    });
});

function page_load(socket){
    connection.query(
        "SELECT * FROM `topic_data` ORDER BY `time` DESC, `id` DESC LIMIT 10",
        function(err, data, field){
            //io.emit('load_topics', data);
            io.sockets.in(socket.id).emit('load_topics', data);
        }
    );
}

function add_topic(data, return_id){

    var time = get_time(data.time);

    console.log(data);
    console.log(time);

    connection.query(
        "INSERT INTO `hw2_topics`(topic, author_id, content, time) VALUES" +
            "('" + data.topic + "', (SELECT id FROM `hw2_user` WHERE `id`=" + data.author_id + "), '" + data.content + "', '" + time + "')",
        function(err){
            if(err)
                console.log(err);
        }
    );

    connection.query(
        "SELECT id, author FROM `topic_data` WHERE `time`='" + time + "'",
        function(err, id_author_json){
            if(err)
                console.log(err);

            return_id(id_author_json[0].id, id_author_json[0].author);
        }
    );
}
function delete_topic(id){
    connection.query(
        "DELETE FROM `hw2_comment` WHERE `topic_id`=" + id,
        function(err){
            if(err)
                console.log(err);
        }
    )

    connection.query(
        "DELETE FROM `hw2_topics` WHERE `id`=" + id,
        function(err){
            if(err)
                console.log(err);
        }
    )

    io.emit("delete_topic", id);
}

function add_comment(data, return_id){
    var time = get_time(data.time);

    connection.query(
        "INSERT INTO `hw2_comment`(topic_id, author_id, content, time) VALUES" +
            "('" + data.topic_id + "', (SELECT id FROM `hw2_user` WHERE id=" + data.author_id + "), '" + data.content + "', '" + time + "')",
        function(err){
            if(err)
                console.log(err);
        }
    );

    connection.query(
        "SELECT id, author FROM `comment_data` WHERE `time`='" + time + "'",
        function(err, id_author_json){
            if(err)
                console.log(err);

            return_id(id_author_json[0].id, id_author_json[0].author);
        }
    )
}
function delete_comment(id){
    connection.query(
        "DELETE FROM `hw2_comment` WHERE `id`=" + id,
        function(err){
            if(err)
                console.log(err);
        }
    );
    io.emit("delete_comment", id);
}

function get_time(now) {
    now = now.getFullYear() + "-" +
        (parseInt(now.getMonth())+1 > 9? (parseInt(now.getMonth())+1).toString() : "0" + (parseInt(now.getMonth())+1).toString()) + "-" +
        (now.getDate() > 9? now.getDate() : "0" + now.getDate()) + " " +
        (now.getHours() > 9? now.getHours() : "0" + now.getHours()) + ":" +
        (now.getMinutes() > 9? now.getMinutes() : "0" + now.getMinutes()) + ":" +
        (now.getSeconds() > 9? now.getSeconds() : "0" + now.getSeconds());

    return now ;
}

function handleDisconnect() {
    connection = mysql.createConnection(db_config);
    // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}









