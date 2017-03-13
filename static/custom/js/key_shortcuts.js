// keyboard shortcuts map
/**
 * alt + p
 * open park modal
 */
Mousetrap.bind('alt+p', function () {
    $('#modal-park-order').modal('show');
});

/**
 * alt + n
 * open note modal
 */
Mousetrap.bind('alt+n', function () {
    $('#global-note-holder').focus();
});

/**
 * alt + v
 * issue void
 */
Mousetrap.bind('alt+v', function () {
    $('#modal-void-order').modal('show');
});

/**
 * alt + m
 * open misc modal
 */
Mousetrap.bind('alt+m', function () {
    $('#modal-universal-product').modal('show');
});

/**
 * alt + s
 * go to glympse
 */
Mousetrap.bind('alt+s', function () {
    window.location.href = 'glympse';
});

/**
 *
 */
Mousetrap.bind('esc', function () {
    $.sidr('close', 'sidr-orders');
    $.sidr('close', 'sidr-categories');
    $.sidr('close', 'sidr-options');
});

/**
 * alt + 1
 * first product
 */
Mousetrap.bind('alt+1', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(0);
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 2
 * second product
 */
Mousetrap.bind('alt+2', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(1);
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 3
 * third product
 */
Mousetrap.bind('alt+3', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(2).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 4
 * forth product
 */
Mousetrap.bind('alt+4', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(3).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 5
 * fifth product
 */
Mousetrap.bind('alt+5', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(4).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 6
 * sixth product
 */
Mousetrap.bind('alt+6', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(5).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 7
 * seventh product
 */
Mousetrap.bind('alt+7', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(6).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 8
 * eight product
 */
Mousetrap.bind('alt+8', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(7).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * alt + 9
 * ninth product
 */
Mousetrap.bind('alt+9', function () {
    var d = document.mySwipe.getSlide(document.mySwipe.activeIndex);
    var $el = $(d).find('.normal-listing').find('.product-item').eq(8).first();
    if ($el.length > 0) {
        trigger_taphold($el);
    }
});

/**
 * Trigger taphold manually (for god knows why this doesn't work as $el.trigger('taphold');
 * @param $el
 */
function trigger_taphold($el) {
    if ($el.data('var') != 1) {
        var item = {
            id: $el.data('id'),
            price: $el.data('price'),
            name: $el.data('name'),
            qty: 1,
            has_coupon: $el.data('has_coupon')
        };
        myCart.addItem(item);
        updateCartElements();
    } else {

        debugger;
        populateOptionSliderForProduct($el.data('id'));
        $.sidr('open', 'sidr-options');
    }

}

/*
 function disableFunctionKeys(e) {
 var functionKeys = new Array(112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 123);
 if (functionKeys.indexOf(e.keyCode) > -1 || functionKeys.indexOf(e.which) > -1) {
 var kCode = e.keyCode,
 d = document.mySwipe.getSlide(document.mySwipe.activeIndex),
 $el;
 if (kCode > 111 && kCode < 122) {
 $el = $(d).find('.normal-listing').find('.product-item').eq(parseInt(kCode)-112);
 if ($el.length > 0) {
 trigger_taphold($el);
 }
 }
 e.preventDefault();
 }
 };

 $(document).ready(function() {
 $(document).on('keydown', disableFunctionKeys);
 });*/
