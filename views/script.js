$(document).ready(function(){
    $('#menu').click(function(){
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $('#login').click(function(){
        $('.login-form').addClass('popup');
    });

    $('.login-form form .fa-times').click(function(){
        $('.login-form').removeClass('popup');
    });

    $('#signup').click(function(){
        $('.login-form').removeClass('popup');
        $('.signup-form').addClass('popup');
    });

    $('.signup-form form .fa-times').click(function(){
        $('.signup-form').removeClass('popup');
    });

    $('#login1').click(function(){
        $('.login-form2').addClass('popup');
    });

    $('.login-form2 form .fa-times').click(function(){
        $('.login-form2').removeClass('popup');
    });

    $('#signup1').click(function(){
        $('.login-form2').removeClass('popup');
        $('.signup-form2').addClass('popup');
    });

    $('.signup-form2 form .fa-times').click(function(){
        $('.signup-form2').removeClass('popup');
    });

    $(window).on('load scroll',function(){

        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        $('.login-form').removeClass('popup');

        $('.signup-form').removeClass('popup');
    });
});