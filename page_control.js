/**
 * Created by pilagod on 10/9/14.
 */
$(function(){

    if(!window.localStorage["username"])
        location.href = "/login";

    window.fbAsyncInit = function() {
        FB.init({
            appId      : '673437362752247',
            cookie     : true,
            status     : true,
            xfbml      : true,
            version    : 'v2.1',
            oauth      : true
        });

        $(window).triggerHandler('fbAsyncInit');
    };

    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    var username = window.localStorage["username"];
    var userid = window.localStorage["userid"];

    $('#nav_bar').append("<div><img src=\"https://graph.facebook.com/" + userid + "/picture\" style=\"height: 30px; margin-right: 10px\">" + username + "</div>");

    $('#logout').click(function(){
        FB.getLoginStatus(function(response) {
            if(response && response.status == "connected"){
                FB.logout(function(response){
                    console.log(response);
                    window.localStorage.removeItem("username");
                    window.localStorage.removeItem("userid");

                    location.href = "/login";
                });
            }
        });
    });

    $('#index').click(function(){
        location.href = "/forum";
    });

    $('#topic_info').hide();

    $('#txt_new_topic').focus(function(){
       //$('#topic_info').removeClass("hide").addClass("show");
        $('#topic_info').show("blind", {direction: "up"}, 300);
    });

//    $('#txt_new_content').keydown(function(event){
//        if(event.keyCode == 13 && !event.shiftKey){
//            $(this).css("padding-bottom", "0px");
//            $(this).height('auto').height($(this).prop("scrollHeight") + "px");
//            return false;
//        }
//    })

    $('#txt_new_content').keyup(function(event){
        if( event.keyCode == 13 || event.keyCode == 8){
            $(this).css("padding-bottom", "0px");
            $(this).height('auto').height($(this).prop("scrollHeight") + "px");
        }
    });



})