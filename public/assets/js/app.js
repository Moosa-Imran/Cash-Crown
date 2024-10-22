'use strict';

$( document ).ready(function() {
  //preloader
  $(".preloader-holder").delay(300).animate({
    "opacity" : "0"
    }, 300, function() {
    $(".preloader-holder").css("display","none");
  });
});

$('.has_children a').on('click', function(){
  $(this).parent('.has_children').toggleClass('active');
  $(this).siblings('.sub-menu').toggleClass('active');
})

// menu options custom affix
var fixed_top = $(".header");
$(window).on("scroll", function(){
    if( $(window).scrollTop() > 50){  
        fixed_top.addClass("animated fadeInDown header-fixed");
    }
    else {
        fixed_top.removeClass("animated fadeInDown header-fixed");
    }
});

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

new WOW().init();