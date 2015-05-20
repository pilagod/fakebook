/**
 * Created by pilagod on 10/9/14.
 */

$(function(){

    var socket = io();
    var load_more_topics_flag = true;

    var username = window.localStorage["username"];
    var userid = window.localStorage["userid"];

    socket.emit("user_data", username, userid);

    // Load Event
    socket.on(
        "load_topics",
        function (data) {
            $('#topic_content').empty();
            load_topics(data);
        }
    );

    socket.on(
        "load_more_topics",
        function (data) {
            load_topics(data);

            if(data.length > 0)
                load_more_topics_flag = true;
            else
                load_more_topics_flag = false;
        }
    );

    socket.on(
        "load_comments",
        function (data) {
            load_comments(data);
        }
    );

    socket.on(
        "load_more_comments",
        function (post_id, data) {
            $("#" + post_id + ">.comment>.comment_block>.block").remove(":first-child");
            //console.log($("#" + post_id + ">.comment>.comment_block>.block:first-child"));
            load_comments(data);
        }
    );

    // Operation on topic (add, delete)
    socket.on(
        "add_topic",
        function (data){
            add_topic(data);
        }
    );

    socket.on(
        "delete_topic",
        function (id){
            $("#" + id).remove();
        }
    )

    // Operation on comment (add, delete)
    socket.on(
        "add_comment",
        function(data){
            add_comment(data);
        }
    )

    socket.on(
        "delete_comment",
        function(id){
            $("#" + id + "_comment").remove();
        }
    );

    $('#topic_info button').click(function(){
        var topic = $('#txt_new_topic').val();
        var author_id = userid;//"pilagod";
        var content = $('#txt_new_content').val();

        if(topic.trim().length == 0){
            alert("Topic can't be none.");
            $('#txt_new_topic').focus();
            return false;
        }

        if(content.trim().length == 0){
            alert("Content can't be none.");
            $('#txt_new_content').focus();
            return false;
        }

        socket.emit('new_topic', topic, author_id, content);

        $('#txt_new_topic').val('');
        $('#txt_new_content').val('');
        $('#topic_info').hide(500);
    });

    window.onscroll = function(event) {
        //console.log(window.innerHeight, document.body.scrollTop, window.innerHeight + document.body.scrollTop,  document.body.clientHeight, $('html').outerHeight(true));
        //window.innerHeight + document.body.scrollTop = $('html').outerHeight(true)
        if (((window.innerHeight + document.body.scrollTop) >= $('html').outerHeight(true)) && load_more_topics_flag) {
            load_more_topics_flag = false;
            var oldest_time = $('#topic_content>.post:last-child').find('.time').text().slice(1);
            var oldest_id = $('#topic_content>.post:last-child').attr('id');

            socket.emit('get_more_topics', oldest_time, oldest_id);
        }
    };

    function load_topics(topic_data){

        if(topic_data.length > 0){

            var i = 0;

            while(topic_data[i]){

                $('#topic_content').append(insert_topic(topic_data[i]));

                socket.emit("get_comment", topic_data[i].id);

                // Setting topic delete onclick event
                if(topic_data[i].author_id == userid){
                    topic_delete_onclick(topic_data[i].id);
                }

                // Setting Textarea
                var textarea_object = $('#' + topic_data[i].id + '>.comment').find('textarea');
                auto_size_textarea(textarea_object, send_comment);

                i++;
            }
        }
        $('body').removeClass('hidden');
    }
    function add_topic(data) {

        $('#topic_content').prepend(insert_topic(data));

        // Setting topic delete onclick event
        if(data.author_id == userid){
            topic_delete_onclick(data.id);
        }

        // Setting Textarea
        var textarea_object = $('#' + data.id + '>.comment').find('textarea');
        auto_size_textarea(textarea_object, send_comment);

        $('#' + data.id).hide();
        $('#' + data.id).delay(100).show("fold", 800);
    }
    function insert_topic(data) {
        //console.log( "<img src=\"https://graph.facebook.com/" + username.split(" ")[0] + "/picture\">");
        var topic = "<div id=\"" + data.id + "\" class=\"post\">" +
                "<div class=\"info\">" +
                    "<img class=\"post-img\" src=\"https://graph.facebook.com/" + data.author_id + "/picture?type=large\">" +
                    "<span class=\"arrow-right\"></span><br>" +
                    "<span>" + data.author + "</span>" +
                "</div>" +

                (data.author_id == userid? "<span class=\"delete\">X</span>": "") +
                "<span class=\"title\">" + data.topic + "</span><br>" +
                "<span class=\"time\">@ " + get_time(new Date(data.time)) + "</span><br>" +
                "<div class=\"content\">" + data.content.replace(/\n/g, "<br>") + "</div>" +

                "<div class=\"comment\">" +
                    "<div class=\"comment_block\">" +
                    "</div>" +
                    "<span><textarea placeholder=\"enter comment here...\" rows='1'></textarea></span>" +
                "</div>" +
            "</div>";
        return topic;
    }

    function load_comments(data){
        if(data.length > 0) {
            var comment_block = $('#' + data[0].topic_id + '>.comment>.comment_block');
            var i = 0;
            while (data[i] && i < 5) {
                if(i == 0)
                    comment_block.prepend(insert_comment(data[i], true));
                else
                    comment_block.prepend(insert_comment(data[i], false));

                if(data[i].author_id == userid){
                    comment_delete_onclick(data[i].id);
                }

                $('#' + data[i].id + '_comment').hide();
                $('#' + data[i].id + '_comment').delay(50).show("blind", 500);
                i++;
            }

            comment_block.find("div:first-child").addClass("begin_block");


            if (data.length > 5){
                //console.log("data > 5");
                comment_block.prepend(
                        "<div class=\"block\">" +
                            "<span class=\"more_comments\">Show More Comments</span>" +
                        "</div>"
                );
                //console.log($('#' + data[0].topic_id + ' .block:first-child>.more_comments'));
                $('#' + data[0].topic_id + ' .block:first-child>.more_comments').click(function(){
                    var oldest_block = $(this).parents('.comment_block').children('.block:nth-child(2)');
                    var oldest_time = oldest_block.find('.time').text().slice(1);
                    var oldest_id = oldest_block.attr('id').split('_')[0];
                    var post_id = $(this).parents('.post').attr('id');

                    socket.emit("get_more_comments", oldest_time, oldest_id, post_id);
                });
            }
        }
    }
    function add_comment(data){
        $('#' + data.topic_id + '>.comment>.comment_block').append(insert_comment(data, false));
        $('#' + data.id + '_comment').hide();
        $('#' + data.id + '_comment').delay(50).show("blind", 500);
        comment_delete_onclick(data.id);
    }
    function insert_comment(data, is_end) {
        comment = "<div id=\"" + data.id + "_comment\" class=\"block" + (is_end? " end_block": "") + "\">" +
                    (data.author_id == userid? "<span class=\"delete\">X</span>": "") +
                    "<div class=\"info\">" +
                        "<img class=\"block_img\" src=\"https://graph.facebook.com/" + data.author_id + "/picture\"><br>" +
                        "<span class=\"author\">" + data.author + "</span>" +
                    "</div>" +

                    "<div class=\"content\">" + data.content.replace(/\n/g, "<br>") + "</div>" +
                    "<span class=\"time\">@" + get_time(new Date(data.time)) + "</span>" +

                "</div>";
        return comment;
    }

    function comment_delete_onclick(id) {
        $("#" + id + "_comment>.delete").click(function(){
            var comment_id = $(this).parent('.block').attr('id').split('_')[0]
            //console.log($(this).parent('.block').attr('id').split('_')[0]);
            show_delete_confirm_dialog("delete_comment", comment_id);
        });
    }
    function topic_delete_onclick(id){
        $("#" + id + ">.delete").click(function(){
            show_delete_confirm_dialog("delete_topic", id);
        });
    }

    function show_delete_confirm_dialog(event_name, id){
        bootbox.dialog({
            message: "Are you sure to delete?",
            title: "Delete?",
            buttons:{
                Yes:{
                    label: "Yes",
                    className: "btn btn-default",
                    callback: function(){
                        socket.emit(event_name, id);
                    }
                },
                No:{
                    label: "No",
                    className: "btn btn-primary"
                }
            }
        });
    }

    function auto_size_textarea(textarea_object, action){
        if(action){
            textarea_object.keydown(function(event) {
                if(event.keyCode == 13 && !event.shiftKey){
                    action(this);
                    $(this).css("padding-bottom", "0px");
                    $(this).height('auto').height($(this).prop("scrollHeight") + "px");
                    return false;
                }
            });
        }

        textarea_object.keyup(function(event){
            if((event.keyCode == 13 && event.shiftKey) || event.keyCode == 8){
                $(this).css("padding-bottom", "0px");
                $(this).height('auto').height($(this).prop("scrollHeight") + "px");
            }
        });
    }
    function send_comment(object){
        var topic_id = $(object).parents(".post").attr("id");
        var author_id = userid;//"pilagod";
        var content = $(object).val();
        $(object).val('');

        socket.emit("new_comment", topic_id, author_id, content);
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


});
