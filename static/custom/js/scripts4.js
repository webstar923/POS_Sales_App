
/**
 * Created by Gabriel Colita on 29.01.2014.
 */
var myCart = new gcLsCart();
var cartCollapsed = false;
var focused = false;
var global_user_settings = [];
var cat_sidr_status = 'close';
var voided_order_printer = 0;
var thisUser = false;

var phone_number = 0;
var textDeleteOrder = 'Delete';
var textCloseOrder = 'Close';
var emptyCart = 'Tab is empty';

var phoneAutocomplete = '';
var MAXIMAL_NUMBER_OF_COPIES = 3;

var Cachestorage = new Cache();
var Device = new Device_detection();

//var timeTracker; //for bechmarking

/*
show text on a 2-line 20-character customer display. 1 ip = 1 display
*/
function showDisplay(first_line, second_line, type) { //VV
    if (sessionStorage.getItem('order_type') == 2) { //only for walk-in
        var delay = 0;
        if (type == "clear") {delay = 5000;}

        setTimeout(function(){
            var showOnIp = globalSettings.getSimpleDisplay();
            $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {'request': 'showSimpleDisplay', 'first_line': first_line, 'second_line': second_line,'type': type,'ip': showOnIp},
                });
        }, delay);
    }
}


setPriceTotal.priceBeforeRounding = false;
function setPriceTotal(price, reset) {
    setPriceTotal.priceBeforeRounding = price;

    if (isCashButtonActive() && !reset)
    {
        price =  (Math.round(price * 20) / 20).toFixed(2);
    }

    if ($('.checout-total-container').html() != price) { //VV
        showDisplay("TOTAL",price,"total");
    }

    //price = ' - $' + price;

    $('.checout-total-container').html(price);
}

function  creditCardFeeStorage() {
}
creditCardFeeStorage.feeWasAdded = 0;
creditCardFeeStorage.priceBeforeFee = 0;
creditCardFeeStorage.initialPriceForCredicardFeePrinting = 0;
creditCardFeeStorage.priceBeforeSelectField = 0;


//creditCardFeeStorage.feeWasAdded = 0;

function enableFinishButtonState()
{
    $('#checkout-submit-button').removeClass("disabled");
    $('#checkout-delivery-button').removeClass("disabled");

}

function disableFinnishButtonState()
{
    $('#checkout-submit-button').addClass("disabled");
    $('#checkout-delivery-button').addClass("disabled");
}




updatingCashPrice.defaultCacheName = '';
function  updatingCashPrice(val)
{


    $('.button-pay-type-takeout[data-type="1"]').text(updatingCashPrice.defaultCacheName);
    $('.button-pay-type-dinein[data-type="1"]').text(updatingCashPrice.defaultCacheName);

    if ($('#paid_cash').length != 0) {
        $('#paid_cash').remove();
    }

    if (val == '') {
        if ($('#paid_cash1').length != 0) {
            $('#paid_cash1').text(' -$0.00');
        }
        if ($('#paid_cash2').length != 0) {
            $('#paid_cash2').text(' -$0.00');
        }
        return true;
    }

    if ($('#paid_cash1').length == 0) {
        $('.button-pay-type-dinein[data-type="1"]').append('<span id="paid_cash1"> -$' + val.toFixed(2) + '</span>');

    }
    else {
        $('#paid_cash1').text(' -$' + val.toFixed(2));
    }


    if ($('#paid_cash2').length == 0)
    {
        $('.button-pay-type-takeout[data-type="1"]').append('<span id="paid_cash2"> -$' + val.toFixed(2) + '</span>');
    }
    else
    {
        $('#paid_cash2').text(' -$' + val.toFixed(2));
    }
}


function updateTildStatusInWebSQL() {

//    console.log("aproaching");
//        console.log("deleted");
    $.ajax({
        url: "/data",
        type: "POST",
        context: document.body,
        data: {
            'request': 'getBalances',
            'token': getToken(),
        }
    }).success(function (response) {

        saveToken(response._token);

        var _sy = new syncHandler(),
                _db = _sy.getDbInstance();

        _db.transaction(function (tx) {

            tx.executeSql('SELECT *  FROM balances', [], function (tx, results1) {

//                if (results1.rows.length == response.balances.length) {
//                    return true;
//                }


                tx.executeSql('DELETE  FROM balances', [], function (tx, results) {

//                    console.log("sending request");
//                    var value = response;


                    for (var i in response.balances)
                    {
                        if (!response.balances.hasOwnProperty(i)) {
                            continue;
                        }
//                        var temp_var = response.balances[i];

                        var tmpArr = [];
                        tmpArr.push(response.balances[i].id);
                        tmpArr.push(response.balances[i].date);
                        tmpArr.push(response.balances[i].type);
                        tmpArr.push(response.balances[i].value);

                        //tmpArr.push(response.orders[i].date);
                        //tmpArr.push('datetime('+response.orders[i].date+', "unixepoch")');

                        tx.executeSql('INSERT INTO balances ("id","date","type","value") VALUES(?,?,?,?)', tmpArr, function (tx, results) {

                        }, function (a, b) {
                            console.warn(a);
                            console.warn(b);
                        });
                    }
                })
            })

        });

    }).error(function (XMLHttpRequest, textStatus, errorThrown) {

//            consoloe.log("failed sending");
//            var a = textStatus;
//            alert(XMLHttpRequest);
//            alert(textStatus);
//            alert(errorThrown);
    });

}



function syncroniseTiltStatus(tiltStatus) {
//    console.log("checking");


    // status of tild was changed so we need to update data in local websql too
    // because GUI gets syncronised with it, not with mysql
    if (JSON.parse(localStorage.getItem('tiltOpened')) != tiltStatus)
    {
        updateTildStatusInWebSQL();
    }
    localStorage.setItem('tiltOpened', tiltStatus);

}





// check if the device is online and if is authorized
if (1) { // TODO: remove this
    window.setInterval(function () {


//        checkIntegrityOfDB();

        $.ajax({
            cache: false,
            url: "/data",
            type: "POST",
            timeout: 5000,
            context: document.body,
            data: {
                request: 'testConnection',
                _token: getToken()
            },
            dataType: "JSON",
            success: function (data, textStatus, XMLHttpRequest) {
                //data = JSON.parse(data);
                switch (data.status) {
                    case 1:
                        var oldState = globalSettings.getOnlineState();
                        globalSettings.setOnlineState(true);
                        if (!oldState)
                        {
                            var sy = new syncHandler();
                            sy.lazySync();
                            sy.pushLocalData();
                        }
                        enableFinishButtonState();
                        syncroniseTiltStatus(data.tiltOpened);
                        break;
                    case -1:
                        // logout user
//                        alert("dropping 3");
                        var sy = new syncHandler();
                        sy.dropDatabase();
                        break;
                    default:
                        var oldState = globalSettings.getOnlineState();
                        globalSettings.setOnlineState(false);
                        disableFinnishButtonState();
                        if (oldState)
                        {
                            var sy = new syncHandler();
                            sy.stopLazySync();
                        }
                        break;
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

                var oldState = globalSettings.getOnlineState();
                globalSettings.setOnlineState(false);
                disableFinnishButtonState();
                if (oldState)
                {
                    var sy = new syncHandler();
                    sy.stopLazySync();
                }
            }
        })
    }, 5000);
}


function normalize_array(a) {
    var j = 0;
    var out = [];
    for (var i in a) {
        if (a.hasOwnProperty(i)) {
            out[j] = a[i];
            j++;
        }
    }
    return out;
}

var sheet = (function () {
    // Create the <style> tag
    var style = document.createElement("style");

    // Add a media (and/or media query) here if you'd like!
    // style.setAttribute("media", "screen")
    // style.setAttribute("media", "@media only screen and (max-width : 1024px)")

    // WebKit hack :(
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style.sheet;
})();


$(window).on('resize', function () {
    enlargeProductContainer();
});

/**
 * Initiate the swiper here and set the callback on slideEnd
 */
function swiperInit() {
    if (document.mySwipe != undefined) {
        document.mySwipe.destroy();
    }
    document.mySwipe = new Swiper('#swiper', {
        'mode': 'horizontal',
        /*onSlideNext: function(swiper) {
         swiper.myDirection = 'next'
         },

         onSlidePrev: function(swiper) {
         swiper.myDirection = 'prev'
         },*/

        'onSlideChangeEnd': function (swiper) {
            var el = $(swiper.getSlide(swiper.activeIndex)).find('div:first');
            var cat_name;
            if (el.data('category-name') == undefined || el.data('category-name') == '') {
                cat_name = 'All Categories';
            } else {
                cat_name = el.data('category-name');
            }
            $('#trigger-categories').html(cat_name);
            resetSlider();
        }
    });
}

swiperInit();

function initCategoriesSidr(w) {
    if (w > 800) {
        $('#trigger-categories').sidr({
            name: 'sidr-categories',
            source: '#sidr-categories',
            renaming: false,
            onOpen: function () {
                document.cat_sidr_status = 'open';
                $("body").width($(window).width() - $("#sidr-categories").width());
                $('#fulloverflow').css('height', '104%');
                $('.navbar-full-custom').css('left', $('#sidr-categories').outerWidth() + 'px');
                document.mySwipe.reInit();
                document.mySwipe.swipeTo(0);
                setTimeout(function () {
                    $('.btn-close-sidr-left').show();
                     enlargeProductContainer();
                }, 200);
            },
            onClose: function (t) {
                document.cat_sidr_status = 'close';
                $('#' + t).find('.btn-close-sidr-left').hide();
                $('#fulloverflow').css('height', '100%');
                $('.navbar-full-custom').css('left', 0);
                setTimeout(function () {
                    document.mySwipe.swipeTo(0);
                    document.mySwipe.reInit();
                    enlargeProductContainer();
                    $('#trigger-categories').html('All Categories');
                }, 200);
            }
        });
    } else {
        $('#trigger-categories').sidr({
            name: 'sidr-categories',
            source: '#sidr-categories',
            renaming: false,
            displace: false,
            onOpen: function () {
                $.sidr('close', 'sidr-orders');
                document.cat_sidr_status = 'close';
                $('#fulloverflow').removeClass('hide');
                $('.navbar-full-custom').css('left', $('#sidr-categories').outerWidth() + 'px');
                setTimeout(function () {
                    $('.btn-close-sidr-left').show();
                  //VV  enlargeProductContainer();
                }, 200);
            },
            onClose: function (t) {
                document.cat_sidr_status = 'close';
                $('#fulloverflow').addClass('hide');
                $('.navbar-full-custom').css('left', 0);
                $('#' + t).find('.btn-close-sidr-left').hide();
            }
        });
    }
}

function enlargeProductContainer() {

    var h = $(window).height(),
            w = $(window).width(),
            p = 0,
            oh,
            sw = $('.swiper-container').width(),
            dv = 0;

//        console.log(sw);

    if (sw <= 768) {
        if (document.cat_sidr_status == 'open') {
            dv = sw / 6;
            sheet.addRule(".product-item", "height: 110px !important;");
        } else {
            dv = sw / 4;
            sheet.addRule(".product-item", "height: 100px !important;");
        }
    } else if (sw <= 992) {
        dv = sw / 6;
        //dv = dv - 9;
    } else {
        dv = sw / 8;

    }
    dv = dv - 5;

    dv = Math.floor(dv * 10) / 10;
//    console.log(dv);

    sheet.addRule(".product-item", "width: " + dv + "px !important;");

    //$('#res').html(w + ' x ' + h);
    initCategoriesSidr(w);

       /* hell!!! */
    /* VV let's just append an ID and handle it via CSS */
    if (w > 976) {
        if (cartCollapsed) {
            //p = 200;
            //p = 169;
            //p = 224; //VV
            p = 164; //VV
            p = 124;
        } else {
            //p = 386;
            //p = 355;
            //p = 370;  //VV
            p = 352;
        }
    } else {
        if (cartCollapsed) {
            //p = 220;
            //p = 189;
            p = 244;
            p = 164;
        } else {
            //p = 556;
            //p = 525;
            p = 580; //VV
            p = 835;
        }
    }

    oh = h;

    h = parseInt(h) - p;
    if (h < 370) {
        h = 370;
    }


    //$('#swiper-height-relative').css('max-height', h + 'px'); //VV
    $('#swiper-height-relative').css('height', h + 'px'); //VV
    $('.alpha-slider-container, .alpha-scroll, .slider-track').css('height', (h - 65) + 'px'); //VV


    //VV don't need it since the Close button is gone now
    // $('#sidr-orders-table-list, #sidr-categories-table-list, #sidr-product-options-h').css({
    //    'height': (oh - 70) + 'px',
    //    'overflow': 'auto'
    // });

    /* slow when qwickly swipping thru categories. js above works much better
    if (cartCollapsed) {
     //   $('.products-items-list').attr('id','Xswiper-height-relative-collapsed')
     //   $('.alpha-scroll').attr('id','Xalpha-scroll-collapsed');
     //   $('.alpha-slider-container').attr('id','Xalpha-slider-container-collapsed');

    } else {
     //   $('.products-items-list').attr('id','Xswiper-height-relative-notcollapsed')
     //   $('.alpha-scroll').attr('id','Xalpha-scroll-notcollapsed');
     //   $('.alpha-slider-container').attr('id','Xalpha-slider-container-notcollapsed');
    }
    //VV
    */
    swiperInit();

    // alpha scroll tryout
    if($('#alpha-scroll').length>0) {
        $('#alpha-scroll').slider().on('slide', function (ev) {
            var e, alt;
            $('#search-control').blur();
            if (lastLetter != ev.value) {
                lastLetter = ev.value;
                if (ev.value >= 27)
                    ev = 27;
                if (ev.value != 0) {
                    e = String.fromCharCode(parseInt(ev.value) + 96);
                    $('.product-item').each(function () {
                        if ($(this).data('name').substr(0, 1).toLowerCase() == e) {
                            alt = $(this).position().top;
                            $('.products-items-list').scrollTop(alt);
                            return false;
                        }
                    });
                } else {
                    e = '#';
                    $('.products-items-list').scrollTop(0);
                }
                //console.log(e);
            }
        });
    }

    /* //VV
    if (!focused) {
        $('#search-control').focus();
        focused = true;
    }
    */


    $('#sidr-orders').find('#open_till')
            .hammer()
            .on("doubletap", function (ev) {

               console.log('kick open a till - start');
                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {'request': 'openDrawer', 'printer_id': globalSettings.getDefaultDrawer(), 'token': getToken()},
                    success: function (data) {
                        saveToken(data._token);
                    }
                });
            });


    $('#sidr-orders').find('#closed_orders')
            .hammer()
            .on('tap', function () {



//                if (!globalSettings.getCanDeleteOrders())
//                {
//                    alert("Sorry, you are not allowed to delete orders!");
//                    return true;
//                }

                // Refactored this bullshit implementation to work as it should

//                alert("first");
                // TRICKY: Added 300ms timeout to capture the doubletap if the time between clicks is grater then 300ms then is a tap
                if (document['globalDoubleTapClosedOrders'] == undefined) {
                    document['globalDoubleTapClosedOrders'] = 1;
                } else {
                    document['globalDoubleTapClosedOrders'] = parseInt(document['globalDoubleTapClosedOrders']) + 1;
                }
                setTimeout(function () {
                    document['globalDoubleTapClosedOrders'] = 0;
//                    $('#tableWithClosedOrdersToSort').filterTable( {'minRows' : 0, placeholder: 'search item', label : '' });

                }, 0);
            })

            .on("doubletap", function (ev) {
//            dblclick(function() {
                console.log("double_here");



                if (globalSettings.getCanDeleteOrders() != 1)
                {
                    alert("You are not allowed to delete orders!");
                    return true;
                }

                console.log(thisUser.isadmin);
                if (!thisUser.isadmin) {
                    alert("You are not admin");
                    return true;
                }

                // "Closed orders" text
                if ($.trim($('.btn-close-sidr-left').text()) == textCloseOrder) {
                    $('.btn-close-sidr-left').text(textDeleteOrder);
                    $('.btn-close-sidr-left').css('background-color', 'red');
                    $('.btn-close-sidr-left').css('box-shadow', 'red 30px 0');

                } else {
                    $('.btn-close-sidr-left').text(textCloseOrder);
                    $('.btn-close-sidr-left').css('background-color', 'blue');
                    $('.btn-close-sidr-left').css('box-shadow', 'blue 30px 0');

                }

                $.each($('.closed-orders-popup'), function () {
//            console.log($(this));
                    $(this).removeClass('selected_for_deletion');
                })
            })


}

function blink(selector) {
    if ($(selector).hasClass('blink_me')) {
        $(selector).fadeOut(800, function () {
            $(this).fadeIn(800, function () {
                blink(this);
            });
        });
    }
}


/**
 *Removes all spaces inside of line
 * @param {String} line
 * @returns {String}
 */
function trim_spaces_inside(line) {
    return (line).replace(/ /g, '');
}

/**
 *Formats the line according to this template aa aaaa aaaa
 * @param {String} line
 * @returns {String}
 */

function formatPhoneNumber(line) {
    //VV return "+" + ("" + s).replace(/\+?(\d{1})(\d{3})(\d{3})(\d+)/, "$1 ($2) $3 $4");
//    line = (line).replace(/[^0-9]/g, '');
    return  $.trim(("" + line).replace(/[^0-9]/g, '').replace(/\+?(\d{0,2})(\d{0,4})(\d{0,4}(\+?))/, "$1 $2 $3 $4"));
}

function toastrDismiss(el, number) {
    $(el).parent().parent().parent().remove();
    sessionStorage.setItem('dismissCheckpoint', number);
}

function toastrHoldCall(el, data) {

  // Get a new order code
  myCart.incrementOrderCode();



  // Build the empty order
  var order = {
    "table" : 'T',
    "status" : 'unsaved',
    "contents" :  '{}',
    "total" : '',
    "userId" : data.id,
    "pay_value" : '',
    "note" : 'test',
    "hour" : '',
    "address" : data.name +' <span class="phone">'+ formatPhoneNumber(data.number)+"</span>" ,
    "order_code" : 1,
    "order_type" : '',
    "order_time" : '',
    "unique_id" : '',
    "number" : formatPhoneNumber(data.number)
  }

  myCart.saveOrder(-1, 'unsaved', false, '', false, {}, order);
  myCart.incrementOrderCode();


  toastrDismiss(el, data.checkpoint);
}

function toastrGetCall(el, data) {
    if (myCart.getItemsNo() > 0 || sessionStorage.getItem('client_caller_data')) {
        if (localStorage.getItem('cartSession')) {
            myCart.updateOrder(localStorage.getItem('cartSession'), '', $('#global-note-holder').val());
        } else {
            myCart.saveOrder(-1, 'unsaved', false, $('#global-note-holder').val(), false);
        }

        //VV
        //deleting temp values
        localStorage.setItem('tmp_phone',"");
        localStorage.setItem('tmp_address',"");
        localStorage.setItem('tmp_company',"");
        localStorage.setItem('tmp_name',"");
        localStorage.setItem('tmp_note',"");
    }

    myCart.clearCart();
    updateCartElements();
    sessionStorage.setItem('client_caller_data', JSON.stringify(data));
    var c_html = ($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function (a) {
        return a.toUpperCase()
    }) + ' Order';
    if (data.name != '') {
        $('#client-details-container').html(c_html + ' for ' + data.name);
    } else {
        $('#client-details-container').html(c_html + ' for ' + formatPhoneNumber(data.number));
    }
    $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
    toastrDismiss(el, data.checkpoint);
    new syncHandler().dismissCallForGood(data.number);
    $('.order-type-action[data-id=1]').trigger('click');
    $('#global-note-holder').val('');
}

NovComet.subscribe('call_check', function (r) {
    var data = JSON.parse(r.call_check);

    switch (data.status) {
        case 'inCall':
            if (data.checkpoint != sessionStorage.getItem('dismissCheckpoint') && globalSettings.getShowCall()) {
                var options = {
                    "tapToDismiss": false,
                    "closeButton": false,
                    "debug": false,
                    "positionClass": "toast-top-full-width",
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "0",
                    "extendedTimeOut": "0",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut",
                    "iconClasses": {
                        "success": 'XXXtoast-call'
                    }
                };
                console.log(data);
                // TODO Use a mustache template
                toastr.success(
                        '<div class="pull-left blink_me"><span class="glyphicon glyphicon-earphone topcall-cell-icon"></span></div>' +
                        '<div class="pull-left">' + data.name + '<br /><span class="toastr-phone-number">' + formatPhoneNumber(data.number) + '</span></div>' +
                        '<div class="pull-right"><button type="button" class="btn btn-danger btn-lg" onclick="toastrDismiss(this, \'' + data.checkpoint + '\');">Close</button></div>' +
                        '<div class="pull-right"><button type="button" class="btn btn-primary btn-lg" onclick=\'toastrGetCall(this,' + JSON.stringify(data) + ')\' style="margin-right: 10px;">Get Call</button></div>' +
                        '<div class="pull-right"><button type="button" class="btn btn-primary btn-lg" onclick=\'toastrHoldCall(this,' + JSON.stringify(data) + ')\' style="margin-right: 10px;">Get Later (hold the line)</button></div>' +
                        '<div class="clearfix"></div>',
                        'Incoming Call', options);
                blink('.blink_me');
            }

            break;
        case 'hang':
            $('.toastr-phone-number').each(function () {
                if ($(this).html() == formatPhoneNumber(data.number)) {
                    $(this).parent().parent().parent().remove();
                }
            });
            break;
    }
});

window.addEventListener('load', function () {
    FastClick.attach(document.body);
}, false);





/**
 * Void paid order
 */
function voidPaidOrder() {


    var id = $('#modal-closed-orders-info-id').val();
    $('#modal-void-closed-order-confirm').modal('show');
    $('#modal-void-closed-order-confirm-yes').off('click').on('click', function () {

        $('#fulloverflow').addClass('hide');

        setOtderVoidedOnServer(id);
    });
}

/**
 * sets price group to default in settings
 * @returns {unparsePriceGroup.price_group_cleaned|Number}
 */
function unparsePriceGroup() {

    if (globalSettings.getDefaultPrice()) {
    var price_group_cleaned = globalSettings.getDefaultPrice().replace(/\D/g, '');
    if (price_group_cleaned.length == 0) {
        return 0;
    } else {
        return price_group_cleaned - 1;
        }
    } else {
        return 0;
    }
}


/**
 * Stores id of the active button before hiding
 * @returns {undefined}
 */
function remember_last_active() {
    localStorage.setItem('last_active_button_price_group', $('#accordeon-order-prices-list a.active').index());
}

/**
 * Enables/disables price group buttons
 * @param {type} state
 * @returns {undefined}
 */
function control_modes(state) {

    if (typeof state === "undefined") {
        return;
    }

    if (state) {

        if (!$('#accordeon-order-prices-list a').hasClass('asterisk_on_button')) {

            $('#accordeon-order-prices-list a.active').addClass('asterisk_on_button');
            $('#accordeon-order-prices-list a.active').css('background-color', '#BBB');

            //disable

//        $('#accordeon-order-prices-list a').css('background-color', 'gray');
            $('#accordeon-order-prices-list a:not(.active)').css('background-color', 'gray');
            $('#accordeon-order-prices-list a').addClass('disabled');
            $('#accordeon-order-prices-list a').removeClass('active');
            $('#accordeon-order-prices-list').addClass('button_shade');
        }

    } else {
        //enable
        var button_active = localStorage.getItem('last_active_button_price_group');

//        if (button_active !== null)
        {
//        console.log('button active index');
//        console.log(button_active);
            $('#accordeon-order-prices-list a').removeClass('active');

            $('#accordeon-order-prices-list a').removeClass('disabled');
            if ($.isNumeric(button_active)) {
                $('#accordeon-order-prices-list a').eq(button_active).addClass('active');
            } else {

//                window.alert("fdfddfd");
//                window.alert(unparsePriceGroup());
                $('#accordeon-order-prices-list a').eq(unparsePriceGroup()).addClass('active');

            }

            $('#accordeon-order-prices-list a').css('background-color', '');

            $('#accordeon-order-prices-list a').removeClass('asterisk_on_button');
            $('#accordeon-order-prices-list').removeClass('button_shade');
        }
    }
}


/**
 * Update Cart Data
 */
/**
 *
 * @param {boolean} customItem - true if custom item is added
 *
 */
function updateCartElements(customItem) {

    var cartItemsNo = myCart.getItemsNo();
    if (cartItemsNo > 0) {


        var cartItems = myCart.getItems(),
                tmp,
                discount_able = 0,
                have_discount = false,
                new_total = 0,
                extraCharge = false;

        for (var i in cartItems) {
            if (cartItems.hasOwnProperty(i)) {
                if(cartItems[i].extra){
                  var extra = JSON.parse(cartItems[i].extra);

                  if(extra.products.length == 1 && extra.products[0].half){
                    cartItems[i].name = "Half & Half";
                  }
                }


                // only custom items i.e. retrieving of printers from gui is necessary only for last added item
                if (i == 0 && (cartItems[i].id == 'discount' || cartItems[i].id == 'extraCharge' || (!$.isNumeric(cartItems[i].id) && cartItems[i].id.indexOf("misc-disc") != -1))) {

                    var newPrinters = getActivePrintersOnCustomOrders();
                    var printerId = getIdForCustomItem(newPrinters);

                    // in the case if we update custom order which is already in the kitchen
                    if (newPrinters != false) {
                        cartItems[i].custom_items_printers = newPrinters;
                        cartItems[i].idNumerical = printerId;
                    }
                }



                try {
                    tmp = JSON.parse(cartItems[i].extra);
                    cartItems[i].note = tmp.product_note;
                } catch (er) {
                    cartItems[i].note = '';
                }


                if (cartItems[i].id == 'discount') {
                    console.log('discount');
                    have_discount = i;
                    continue;
                }
                if (cartItems[i].id == 'extraCharge')
                {
                    console.log('extraCharge');
                    extraCharge = i;
                    continue;
                }

                cartItems[i].extra_cart = myCart.formatCartExtra(cartItems[i].extra, (typeof cartItems[i].srcName != 'undefined' ? cartItems[i].srcName : ''));
//                cartItems[i].extra_cart = cartItems[i].extra;

                cartItems[i].price = parseFloat(cartItems[i].price).toFixed(2);
                cartItems[i].tot_price = parseFloat(cartItems[i].price).toFixed(2);

                if (parseInt(cartItems[i].has_coupon) !== 0 && cartItems[i].id != 'discount') {
                    discount_able += parseFloat(cartItems[i].tot_price);
                }
                new_total += parseFloat(cartItems[i].tot_price);


            }
        }

        if (have_discount !== false) {
            cartItems[have_discount].tot_price = cartItems[have_discount].price = (0 - discount_able * cartItems[have_discount].percent / 100).toFixed(2);
            cartItems[have_discount].is_discount = false;
            myCart.total = parseFloat(new_total) + parseFloat(cartItems[have_discount].tot_price);
        }
        else if (extraCharge !== false) {
            cartItems[extraCharge].tot_price = cartItems[extraCharge].price = (new_total * cartItems[extraCharge].percent / 100).toFixed(2);
            myCart.total = parseFloat(new_total) + parseFloat(cartItems[extraCharge].tot_price);
        }
        else
        {
            myCart.total = new_total;
        }

        var template = $('#template-list-cart').html();
        var cart = Mustache.to_html(template, cartItems); // reverse array to have recent items on top

        control_modes(true);
    } else {
        var template = $('#template-list-cart-empty').html();
        var cart = Mustache.to_html(template, '');
        control_modes(false);
    }


    $('#list-cart tbody').html(cart).find('.list-cart-change-product').off('click').on('click', function () {        
        populateOptionSliderForProduct($(this).data('id'), $(this).data('extra'), $(this).data('qty'), $(this).data('cartid'), $(this).data('note'));
    });

    $('#cart-items').html(myCart.getItemsNo());

    $('#cart-total').html(myCart.getTotal());

}


/**
 * Extends options related to product - in right panel as for now
 *
 * @param {int} product_id
 * @param {object} update_product
 * @param {int} qty id of card
 * @param {int} cartId
 * @param {string} note
 * @returns - ignored
 */

var vm = null;
var TempData = {};

Vue.component('panel-ingredients', {
                                        props: ['d'],
                                        template: '#panel-product-options-ingredients',                                        
                                        methods: {
                                            onMultiBoxDlg: function(v) {
                                                this.d.items[1].multiSelectBoxShow = v;
                                                this.$forceUpdate();    
                                            },
                                            addExtraIngredient: function(item) {

                                                this.d.items[1].selectedItems.push(item);
                                                this.$forceUpdate();                                                    
                                            },
                                            removeExtraIngredient: function(index) {
                                                this.d.items[1].selectedItems.splice(index, 1);
                                                this.$forceUpdate();
                                            }
                                        }                                                                          
                                    });

Vue.component('panel-halfs',        {
                                        props: ['d'],
                                        template: '#panel-product-options-halfs'                                                                                                       
                                    });

Vue.component('panel-product-options', 
                                    {
                                        template: '#panel-product-options',                                        
                                        props: ['d'],
                                        created: function() {                                              
                                                this.calculateTotalPrice();
                                            },                                        
                                        methods: {
                                            
                                            calculateTotalPrice: function() {
                                                
                                                var total = parseFloat(this.d.product_price);                            
                       
                                                for (var i = 0; i < this.d.items.length; i++) {
                                                    var idx = this.d.items[i].checkedIdx;
                                                    var product = this.d.items[i].options[idx];

                                                    //total += parseFloat(product.variation_price);          
                                                    if(product.half){                                                    
                                                        var half = product.half.items[product.half.checkedIdx];    

                                                        total += parseFloat(product.variation_price)/2;
                                                        total += parseFloat(half.variation_price)/2;
                                                        total += parseFloat(product.half_pizza_group_fee);
                                                        /*if (product.hasOwnProperty('ingredient')) {
                                                            total += this.calculateIngredientsTotal(product)/2;                                    
                                                        }*/
                                                    }
                                                    else {
                                                        total += parseFloat(product.variation_price);
                                                        //total += this.calculateIngredientsTotal(product);
                                                    }  
                                                }

                                                this.d.total_price = total * this.d.quantity;

                                                this.$forceUpdate();
                                            },
                                            calculateIngredientsTotal: function(product){
                                                var total = 0;                            
                                                
                                                if (product.ingredient.items.length > 0) 
                                                {                            
                                                    //included
                                                    $.each(product.ingredient.items[0].items  ,function(j,item){
                                                        total += parseFloat(item.price);
                                                    });
                                                  
                                                    //extra
                                                    $.each(product.ingredient.items[1].selectedItems  ,function(j,item){
                                                        total += parseFloat(item.price);
                                                    });
                                                }
                                                return total;
                                            },
                                            clickedTrigger_CartAdd: function(){
                                                resetSearch();

                                                //if ($(this).hasClass('must_update')) {
                                                //    myCart.updateProduct($(this).data('cart-id'),$(this).find('span.btn-price').text());

                                                //} else {

                                                    var productExtra = this.fetchProductExtra();
                                                    var item = {
                                                        id: this.d.product_id,
                                                        name: getProductName(this.d.product_name, productExtra),
                                                        srcName: this.d.product_name,
                                                        price: this.d.total_price,
                                                        qty: parseInt(this.d.quantity),
                                                        extra: productExtra,
                                                        has_coupon: this.d.has_coupon
                                                    };
                                                    myCart.addItem(item);
                                                //}
                                                //updateCartElements();
                                                
                                                this.close();

                                                $('.order-list-name:first').effect("highlight", {}, 3000);
                                            },
                                            fetchProductExtra: function() {
                                                var o = {};
                                                
                                                o.products = [];
                                                // Add basic information about the product
                                                o.productId = this.d.product_id;
                                                o.productName = this.d.product_name;
                                                o.productPrice = this.d.product_price;
                                                o.has_coupon = this.d.has_coupon;
                                                o.productNote = this.d.product_note;
                                                            
                                                // Create the parts (ingredients) array
                                                // Todo Move it inside the products for faster rendering                                               

                                                //o.isSpecialItem = ingBox.length != 1 ? true : false;
                                                o.parts = {};
                                                for (var i = 0; i < this.d.items.length; i++) {                                                    
                                                    var option = this.d.items[i].options[this.d.items[i].checkedIdx];

                                                    if (option.ingredient.items.length > 0) {
                                                        //extra
                                                        var extra = [];
                                                        for (var j=0; j <option.ingredient.items[1].selectedItems.length; j++) {
                                                            var obj = option.ingredient.items[1].selectedItems[j];
                                                            extra.push({id : obj.id, name: obj.ingredient_name,text: obj.text,price:obj.price});
                                                        }

                                                        o.parts[option.variation_id] = o.parts[option.variation_id] || {};
                                                        o.parts[option.variation_id] = {extra: extra};

                                                        //included
                                                        var included = [];
                                                        for (var j=0; j <option.ingredient.items[0].items.length; j++) {
                                                            var obj = option.ingredient.items[0].items[j];
                                                            if (obj.checked == false) {
                                                                included.push({id : obj.ingredient_id, name: obj.ingredient_name});
                                                            }
                                                        }    
                                                        o.parts[option.variation_id].included = included;
                                                    }

                                                    // Loop and create the products array and the half are embeded inside the parent product
                                                    var product = {};
                                                    product.checkedIdx = this.d.items[i].checkedIdx;
                                                    product.id = option.variation_id;
                                                    product.kind = this.d.items[i].name;
                                                    if (option.half_pizza_group_fee) {
                                                        product.halfFee = option.half_pizza_group_fee;
                                                    } else {
                                                        product.halfFee = 0;
                                                    }                                                 
                                                    
                                                    // Specific to Select , else all the other type of input
                                                    product.name = option.variation_name;
                                                    product.price = option.variation_price;                                                    

                                                    // Get the half (if he exist)and put all the information inside the product object                                                    
                                                    if (option.half) 
                                                    {
                                                        product.half = {};
                                                        if (option.half.items[option.half.checkedIdx].isDeal) {
                                                            product.half.name = option.half.items[option.half.checkedIdx].variation_name;
                                                        } else {
                                                            product.half.name = option.half.items[option.half.checkedIdx].product_name;                                                          
                                                        }
                                                        product.half.id =  option.half.items[option.half.checkedIdx].variation_id;
                                                        product.half.price = option.half.items[option.half.checkedIdx].product_price;
                                                        product.half.checkedIdx = option.half.checkedIdx;
                                                    }                                                    
                                                    o.products.push(product);
                                                }

                                                return JSON.stringify(o);
                                            },
                                            close: function() {                                                        
                                                
                                                $.sidr('close', 'sidr-options');      
                                                vm.$destroy();                                                                                
                                            },
                                            quantityProductOptions: function(i) {
                                                i = parseInt(i);
                                                var s = this.d.quantity + i;
                        
                                                if (s > 0) {
                                                    this.d.quantity = s;
                                                }
                                                
                                                this.calculateTotalPrice();
                                            }

                                        }
                                    });                

Vue.component('panel-product-options-selectors', 
                                    {
                                        template: '#panel-product-options-selectors',                                        
                                        props: ['d'],
                                        created: function() {                                                
                                                this.calculateTotalPrice();                                                
                                            },
                                        methods: {                                                                         
                                            calculateTotalPrice: function() {
                                                
                                                var total = parseFloat(this.d.product_price);                            
                       
                                                for (var i = 0; i < this.d.items.length; i++) {
                                                    var idx = this.d.items[i].checkedIdx;
                                                    var product = this.d.items[i].options[idx];

                                                    //total += parseFloat(product.variation_price);                                                             
                                                    if(product.half){
                                                        //var half = this.d.selHalfs[i].items[this.d.selHalfs[i].checkedIdx];    
                                                        var half = product.half.items[product.half.checkedIdx];    

                                                        total += parseFloat(product.variation_price)/2;
                                                        total += parseFloat(half.variation_price)/2;
                                                        total += parseFloat(product.half_pizza_group_fee);
                                                        /*if (product.hasOwnProperty('ingredient')) {
                                                            total += this.calculateIngredientsTotal(product)/2;                                    
                                                        }*/
                                                    }
                                                    else {
                                                        total += parseFloat(product.variation_price);
                                                        //total += this.calculateIngredientsTotal(product);
                                                    }  
                                                }

                                                this.d.total_price = total * this.d.quantity;
                                                this.$forceUpdate();
                                            },
                                            calculateIngredientsTotal: function(product){
                                                var total = 0;                            
                                                
                                                if (product.ingredient.items.length > 0) 
                                                {                            
                                                    //included
                                                    $.each(product.ingredient.items[0].items  ,function(j,item){
                                                        total += parseFloat(item.price);
                                                    });
                                                  
                                                    //extra
                                                    $.each(product.ingredient.items[1].selectedItems  ,function(j,item){
                                                        total += parseFloat(item.price);
                                                    });
                                                }
                                                return total;
                                            },
                                            clickedTrigger_CartAdd: function(){
                                                resetSearch();

                                                //if ($(this).hasClass('must_update')) {
                                                //   myCart.updateProduct($(this).data('cart-id'),$(this).find('span.btn-price').text());

                                                //} else {

                                                    var productExtra = this.fetchProductExtra();
                                                    var item = {
                                                        id: this.d.product_id,
                                                        name: getProductName(this.d.product_name, productExtra),
                                                        srcName: this.d.product_name,
                                                        price: this.d.total_price,
                                                        qty: parseInt(this.d.quantity),
                                                        extra: productExtra,
                                                        has_coupon: this.d.has_coupon
                                                    };
                                                    myCart.addItem(item);
                                                //}
                                                //updateCartElements();
                                                
                                                this.close();

                                                $('.order-list-name:first').effect("highlight", {}, 3000);
                                            },
                                            fetchProductExtra: function() {
                                                var o = {};
                                                
                                                o.products = [];
                                                // Add basic information about the product
                                                o.productId = this.d.product_id;
                                                o.productName = this.d.product_name;
                                                o.productPrice = this.d.product_price;
                                                o.has_coupon = this.d.has_coupon;
                                                o.productNote = this.d.product_note;
                                                            
                                                // Create the parts (ingredients) array
                                                // Todo Move it inside the products for faster rendering                                               

                                                //o.isSpecialItem = ingBox.length != 1 ? true : false;
                                                o.parts = {};
                                                for (var i = 0; i < this.d.items.length; i++) {                                                    
                                                    var option = this.d.items[i].options[this.d.items[i].checkedIdx];

                                                    if (option.ingredient.items.length > 0) {
                                                        //extra
                                                        var extra = [];
                                                        for (var j=0; j <option.ingredient.items[1].selectedItems.length; j++) {
                                                            var obj = option.ingredient.items[1].selectedItems[j];
                                                            extra.push({id : obj.id, name: obj.ingredient_name,text: obj.text,price:obj.price});
                                                        }

                                                        o.parts[option.variation_id] = o.parts[option.variation_id] || {};
                                                        o.parts[option.variation_id] = {extra: extra};

                                                        //included
                                                        var included = [];
                                                        for (var j=0; j <option.ingredient.items[0].items.length; j++) {
                                                            var obj = option.ingredient.items[0].items[j];
                                                            if (obj.checked == false) {
                                                                included.push({id : obj.ingredient_id, name: obj.ingredient_name});
                                                            }
                                                        }    
                                                        o.parts[option.variation_id].included = included;
                                                    }
                                                    // Loop and create the products array and the half are embeded inside the parent product
                                                    var product = {};
                                                    product.checkedIdx = this.d.items[i].checkedIdx;
                                                    product.id = option.variation_id;
                                                    product.kind = this.d.items[i].name;
                                                    if (option.half_pizza_group_fee) {
                                                        product.halfFee = option.half_pizza_group_fee;
                                                    } else {
                                                        product.halfFee = 0;
                                                    }                                                 
                                                    
                                                    // Specific to Select , else all the other type of input
                                                    product.name = option.variation_name;
                                                    product.price = option.variation_price;                                                    

                                                    // Get the half (if he exist)and put all the information inside the product object                                                    
                                                    if (option.half) 
                                                    {
                                                        product.half = {};
                                                        if (option.half.items[option.half.checkedIdx].isDeal) {
                                                            product.half.name = option.half.items[option.half.checkedIdx].variation_name;
                                                        } else {
                                                            product.half.name = option.half.items[option.half.checkedIdx].product_name;                                                          
                                                        }
                                                        product.half.id =  option.half.items[option.half.checkedIdx].variation_id;
                                                        product.half.price = option.half.items[option.half.checkedIdx].product_price;
                                                        product.half.checkedIdx = option.half.checkedIdx;
                                                    }                                                    
                                                    o.products.push(product);
                                                }

                                                return JSON.stringify(o);
                                            },
                                            close: function() {                                                        
                                                
                                                $.sidr('close', 'sidr-options');  
                                                vm.$destroy();                                              
                                                //resetSearch();
                                            },
                                            quantityProductOptions: function(i) {
                                                i = parseInt(i);
                                                var s = this.d.quantity + i;
                        
                                                if (s > 0) {
                                                    this.d.quantity = s;
                                                }
                                                
                                                this.calculateTotalPrice();
                                            }

                                        }
                                    });                


populateOptionSliderForProduct.MAX_NUMBER_OPTIONS = 10;
function populateOptionSliderForProduct(product_id, update_product, qty, cartId, note) {

    /**
     * Defines minimal number of options at which dropbox appears
     * @constant
     * @type {integer}
     */

    var html = '';
    var currentPriceGroup = product_id + '_' + getPriceGroup();
    var timeTracker;
    if (Cachestorage.isInCache(currentPriceGroup)) {

        timeTracker = new Date().getTime();
        console.log('cache start - 1');

        var result = Cachestorage.restore(currentPriceGroup);
        html = Mustache.to_html(result.template, result.data);
        $('#sidr-options .sidr-inner').html(html);
        // $.sidr('open', 'sidr-options');
        postParsing(result.data, update_product, qty, cartId, note);

        $.sidr('open', 'sidr-options');

        console.log('cache end - 2');
        timeTracker = new Date().getTime() - timeTracker;
        console.log('ITEM LOADED FROM CACHE in ~~~~~~~~~~~~~~~~~~~~ ' + timeTracker);
    }
    else
    {   timeTracker = new Date().getTime();
        console.log('SQL start - 1');
        var sy = new syncHandler(),
                db = sy.getDbInstance();
//      SQL is not the biggest bottleneck here

        db.transaction(function (tx) {
            tx.executeSql('SELECT "options" FROM "product_options" WHERE "product_id"=?', [product_id], function (tx, results) {
                var result = preParsing(results);

                if (typeof result.data.items === 'undefined') {
                    result.data.items = false;
                }
                   
                html = Mustache.to_html(result.template);         
                $('#sidr-options .sidr-inner').html(html);
                /*postParsing(result.data, update_product, qty, cartId, note);*/
                $.sidr('open', 'sidr-options');                

                $.each(result.data.items, function(i, item) {
                    item.checkedIdx = 0;                     
                    
                    $.each(item.options, function(j, option) {

                        //ingredient selector
                        var ing = result.data.ingredients.filter(function(el){
                            return el.variation_id === option.variation_id;
                        });  

                        if(ing[0] && ing[0].items.length){
                            option.ingredient = ing[0];                            
                            option.ingredient.dataIndex = item.dataIndex;
                            //initialize check status                        
                            if (option.ingredient.items.length > 0 ) {
                                
                                //group: 'Included'
                                $.each(option.ingredient.items[0].items, function(k, it) {
                                    it.checked = true;
                                });

                                //group: 'Extra ingredients'
                                $.each(option.ingredient.items[1].items, function(k, it) {
                                    
                                    it.id = it.ingredient_id;
                                    var text = it.ingredient_name;
                                    if(it.price && it.price != 0){                                      
                                       text +=  ' ($'+it.price+")";
                                    }
                                    it.text = text;
                                });

                                option.ingredient.items[1].selectedItems = [];
                                option.ingredient.items[1].multiSelectBoxShow= true;
                            }
                        }  
                        else {
                            populateHalfPizzaIngredients(option.variation_id, function(data){
                                
                                option.ingredient =  data;
                                option.ingredient.dataIndex = item.dataIndex;
                                //initialize check status                        
                                if (option.ingredient.items.length > 0 ) {
                                    
                                    //group: 'Included'
                                    $.each(option.ingredient.items[0].items, function(k, it) {
                                        it.checked = true;
                                    });

                                    //group: 'Extra ingredients'
                                    $.each(option.ingredient.items[1].items, function(k, it) {
                                        
                                        it.id = it.ingredient_id;
                                        var text = it.ingredient_name;
                                        if(it.price && it.price != 0){                                         
                                            text +=  ' ($'+it.price+")";                                          

                                        }
                                        it.text = text;
                                    });

                                    option.ingredient.items[1].selectedItems = [];
                                    option.ingredient.items[1].multiSelectBoxShow= true;
                                }
                            });
                        }
                       
                        //half selector
                        if(item.name != "half" && result.data.halfs){
                            
                            var productPrice = result.data.product_price;
                            var ing = result.data.halfs.filter(function(el){
                              return el.id === option.variation_id;
                            });
                            if(ing[0]){
                              // Set the id of the first half, for price calculation etc...
                              ing[0].checkedIdx = 0;
                              ing[0].variation_id = option.variation_id;
                              // Set the fee for adding an half                              
                              ing[0].halfFee = Math.round( item.options[item.checkedIdx].half_pizza_group_fee);
                              
                              $.each(ing[0].items,function(it,obj){
                                obj.textPrice = (parseFloat(obj.variation_price)/2).toFixed(2);
                                // TODO move this in the model, JS or PHP
                                if(!obj.isDeal){
                                  obj.textPrice = (obj.product_price - parseFloat(productPrice))/2;
                                  obj.variation_price = (obj.product_price - parseFloat(productPrice)) + parseFloat(option.variation_price) ;

                                }
                                obj.hasPrice = parseFloat(obj.textPrice) !== 0 ? true : false;
                              });

                              option.half = ing[0];                              
                            }
                        }
                    });                   
                });
 
                result.data.quantity = 1;
                result.data.total_price = 0;
                result.data.product_note = "";
                result.data.btn_text = "Add";
                result.data.cart_id = "";

                if (update_product != undefined)
                {   
                    result.data.cart_id = cartId;
                    result.data.btn_text = "Update";
                    result.data.quantity = qty;
                    result.data.product_note = update_product.productNote;

                    //el.find('.btn-price').text(($('#p-productPrice').val()*itemData.qty).toFixed(2));

                    if(update_product.products && update_product.products.length) {
                        $.each(update_product.products,function(index,product) {
                            
                            result.data.items[index].checkedIdx = product.checkedIdx;                            
                            
                            if(product.half != undefined){
                                result.data.items[index].options[product.checkedIdx].half.checkedIdx = product.half.checkedIdx;                    
                            }
                        });

                        for (var i = 0; i < result.data.items.length; i++) {   
                            var item = result.data.items[i];
                            var option = item.options[item.checkedIdx];
                            
                            if (option.ingredient && option.ingredient.items.length > 0) {
                                //included
                                for (var j=0; j <option.ingredient.items[0].items.length; j++) {
                                    var obj = option.ingredient.items[0].items[j];

                                    for (var j1=0; j1<update_product.parts[option.variation_id].included.length; j1++) {
                                        var inc = update_product.parts[option.variation_id].included[j1];
                                        if (obj.ingredient_id == inc.id) {
                                            obj.checked = false;
                                            break;
                                        }
                                    }
                                }

                                //extra                                     
                                for (var j=0; j <update_product.parts[option.variation_id].extra.length; j++) {
                                    var extra = update_product.parts[option.variation_id].extra[j];
                                    option.ingredient.items[1].selectedItems.push({id : extra.id, ingredient_name:extra.name,text: extra.text,price:extra.price});                    
                                }
                            }
                        } 
                    }

                }

                TempData = result.data.items;                                        
                delete result.data.items;
                delete result.data.halfs;
                delete result.data.ingredients;


                var currView;
                if (result.selectors) {
                    currView = 'panel-product-options-selectors';
                } else {        
                    currView = 'panel-product-options';
                }                                                    

                vm = new Vue({
                   el: "#sidr-options .sidr-inner",
                  // el: "#page-home",
                   data: {
                        product_info: result.data,
                        currentView: currView
                   },
                   created: function() {
                        this.loadItems();
                   },
                   methods: {
                        loadItems: function() {                            
                            this.product_info.items = TempData;                            
                        }
                   }
                });                         
                                   

            });

        });
    }
}

function populateHalfPizzaIngredients(variation_id,callback) {

    var db = new syncHandler().getDbInstance();

    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM "product_variations" WHERE "variation_id"=?', [variation_id], function (tx, results) {
            var tmp = $.extend({}, results.rows.item(0));
            var data = JSON.parse(tmp.options);
            callback({items : data,variation_id : variation_id});
        });

    });

}


jQuery.fn.extend({
    posCalculateTaxes: function (type, el) {



        $(el).html('');
        $('.order-warning').html('');

        this.find('.button-pay-type').each(function () {
            $(this).attr('data-type-ls', type);
            $(this).attr('data-type-el', el);

            $(this).off('click').on('click', function () {
                $('.button-pay-type').removeClass('active');
                $(this).addClass('active');

                var total = myCart.getTotal(),
                        sy = new syncHandler(),
                        db = sy.getDbInstance(),
                        id = $(this).data('type'),
                        type = $(this).data('type-ls'),
                        data,
                        table = {},
                        typeEl = $(this).data('type-el'),
                        template;

                if (document.dst != undefined) {
                    total = total - (total * document.dst / 100);
                }

                db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM "taxes" WHERE "id"=?', [id], function (tx, results) {
                        data = $.extend({}, results.rows.item(0));

                        if (data.apply_min && total < data['min_amount_' + type]) {
                            //$('.modal').modal('hide');
                            $('.order-warning').html(Mustache.render('Minimum order is ${{ min }}', {'min': data['min_amount_' + type]}));
                            //$('#modal-min-price-notify').modal('show');
                        } else {
                            $('.order-warning').html('');
                        }
                        //else {
                        if (data.type == 'cash') {
                            template = $('#payment-types-table-cash').html();
                            $(typeEl).html(Mustache.to_html(template, table));
                        } else {
                            $(typeEl).html('');
                        }/*else {
                         template = $('#payment-types-table').html();
                         }*/
                        table['total'] = parseFloat(total).toFixed(2);
                        table['fee'] = 0;
                        table['fee_tax'] = '';
                        if (data.percent_fee > 0) {
                            table['fee'] = parseFloat(total) * parseFloat(data.percent_fee);
                            table['fee_tax'] += ' + ' + (parseFloat(data.percent_fee) * 100) + '%';
                        }
                        if (data.fixed_fee > 0) {
                            table['fee'] += parseFloat(data.fixed_fee);
                            table['fee_tax'] += ' + $' + data.fixed_fee;
                        }
                        table['fee'] = parseFloat(table['fee']).toFixed(2);
                        if (table['fee'] != 0) {
                            table['fee_tax'] = ' (' + table['fee_tax'] + ')';
                        }

                        table['totalfee'] = parseFloat(parseFloat(table['total']) + parseFloat(table['fee'])).toFixed(2);
//                        $('.checout-total-container').html(' - $' + table['totalfee']);
                        setPriceTotal(table['totalfee']);
                        //}

                    });
                });
            });
        });
    }
});



/*
function quantityProductOptions(i) {
    i = parseInt(i);

    var v = $('#p-quantity').val();
    var s = parseInt(v) + i;
    if (s > 0) {
        $('#p-quantity').val(s);
    }

    myCart.showTotalPrice($('#p-quantity'));
}

function couponCb(data) {
 if (data.coupon) {
 document.dst = data.coupon.discountper;
 $('#modal-checkout-takeway-coupon').addClass('hide');
 $('#modal-checkout-takeway-coupon-value').removeClass('hide').find('input').val(data.coupon.coupondescription);
 var total = myCart.getTotal(),
 dsc = total*document.dst/100,
 final = (total - dsc).toFixed(2);

 myCart.addItem({
 id: 'misc-'+final,
 price: final,
 name: data.coupon.coupondescription,
 qty: 1,
 has_coupon: 1,
 extra_cart: '',
 tot_price: final
 });

 $('.checout-total-container').html(' - $' + final);
 $('.button-pay-type').removeClass('active');

 updateCartElements();
 }
 }*/

function couponCbModal(data) {
    if (data.coupon) {
        document.dst = data.coupon.discountper;
        $('#modal-discount-coupon').addClass('hide');
        $('#modal-discount-coupon-value').removeClass('hide').find('input').val(data.coupon.coupondescription);

        myCart.addItem({
            id: 'discount',
            price: 0,
            name: data.coupon.coupondescription,
            qty: 1,
            percent: data.coupon.discountper
        });

        updateCartElements();
    }
}

function bindOrdersDoubleTap() {
    /**
     * Closed order popup management
     */

    $('.closed-orders-popup').hammer().off('tap').on('tap', function () {

//        console.log("one tap");
//        console.log($(this));
//      var rty = $(this);


        if ($.trim($('.btn-close-sidr-left').text()) == textDeleteOrder) {

            // order is already selected for deletion
            if ($(this).hasClass('selected_for_deletion'))
            {
                $(this).removeClass('selected_for_deletion');
            }
            else  // not selected
            {
                $(this).addClass('selected_for_deletion');
            }
        }
//      console.log()
    })


    $('.closed-orders-popup').hammer().off('doubletap').on('doubletap', function () {


//        $('#modal-closed-orders-printers').hide();
//        $('#modal-closed-orders-printers_second').show();

        var id = $(this).data('id'),
                sy = new syncHandler(),
                db = sy.getDbInstance(),
                order, cart, cart_items, total, info_data, format_date,
                d, day, month,
                template = $('#closed-orders-popup-cart-template').html(),
                in_cart = {};

        var uniqueID = $(this).attr('data-unique_id');


        voided_order_printer = id;

        db.transaction(function (tx) {
            tx.executeSql('SELECT "orders".*,"taxes"."name" FROM "orders" LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"  WHERE "orders"."id"=?', [id], function (tx, results) {

                var obj_before = results.rows.item(0);
                order = $.extend({}, results.rows.item(0));
                order['name'] = order['order_status'];
                cart = $.extend({}, JSON.parse(order.contents));

                if (order.note == undefined || order.note == 'undefined') {
                    order.note = '';
                }

                for (var i in cart) {
                    if (cart.hasOwnProperty(i)) {
                        //cart[i].extra_cart = myCart.formatCartExtra(cart[i].extra); //VV
                        cart[i].extra_cart = myCart.formatCartExtra(cart[i].extra, (typeof cart[i].srcName != 'undefined' ? cart[i].srcName : ''));

                    }
                }


                in_cart['content'] = [];
                in_cart['total'] = order.total;

                in_cart['content'] = $.map(cart, function (value, index) {
                    if (typeof value == 'object') {
                        return value;
                    }
                });

                cart_items = Mustache.to_html(template, in_cart);

                $('#modal-closed-orders-cart').html(cart_items);

                if (order.table == null) {
                    info_data = Mustache.to_html($('#modal-closed-orders-info-delivery-template').html(), order);
                }
                else if (order.table == 'T') {
                    info_data = Mustache.to_html($('#modal-closed-orders-info-takeaway-template').html(), order);
                } else {
                    info_data = Mustache.to_html($('#modal-closed-orders-info-table-template').html(), order);
                }

                $('#modal-closed-orders-info').html(info_data);

                $('#modal-closed-orders').modal('show');
                $.sidr('close', 'sidr-orders');

                tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function (tx, results) {
                    var printers = [];
                    var def_printer = globalSettings.getDefaultPrinter();

                    for (var i = 0; i < results.rows.length; i++) {
                        printers.push({
                            'name': results.rows.item(i).printer_name,
                            'id': results.rows.item(i).id,
                            'selected': (results.rows.item(i).id == def_printer)
                        });
                    }



                    var printers_html = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'voidPopup'});
                    var printers_html_second = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'voidPopup_second'});
                    $('#modal-closed-orders-printers').html(printers_html);
                    $('#modal-closed-orders-printers_second').html(printers_html_second);

                    var printers = new PrintersMarking();


                    var ids = printers.getIdsFromDbAndMark(uniqueID);

//                    var idsFromDb = in_cart.content[0].custom_items_printers;

                    if (globalSettings.getCanDeleteOrders() != 1 || globalSettings.getOnlineState() == false) {
                        $('#buttonCanDeleteOrders').hide();
                    } else {
                        $('#buttonCanDeleteOrders').show();
                    }



                });
            });
        });
    });
}




function editCustomers(a, b)
{
    var sy = new syncHandler(),
            db = sy.getDbInstance();
    if (a.success)
    {
        var sql = '',
                tmp = [];

        //Add new
        if (b.userid == 0)
        {
            sql = 'INSERT INTO CUSTOMERS (';

            for (var i in b)
            {
                sql += i + ',';
                if (i != 'userid')
                {
                    tmp.push(b[i]);
                }
                else
                {
                    tmp.push(a.inserted_id);
                }

            }
            sql = sql.slice(0, -1);
            sql += ') VALUES(?,?,?,?,?,?,?,?)';
        }
        else
        {
            sql = 'UPDATE customers set ';

            for (var i in b)
            {

                if (i != 'userid')
                {
                    tmp.push(b[i]);
                    sql += i + '=?,';
                }

            }
            sql = sql.slice(0, -1);
            sql += 'WHERE userid=?';
            tmp.push(b.userid);
        }
        db.transaction(function (tx) {
            tx.executeSql(sql, tmp, function (tx, results) {
            }, function (a, b) {
                console.log(a);
                console.log(b)
            });
        });
    }
}



// @TODO : Change the name of this function... why talking about user if it send to the checkout....

function delayWithGettingUserId(database, table, data, callback, dataUpdated, function_to_call)
{
    if (dataUpdated.rows.length != 0) // if there is at least one user with such mobile phone number
    {
        data.userid = dataUpdated.rows.item(0).userid;
    }
    database.pushData(table, data, callback, JSON.stringify(data));

    if (isOrderTakenFromTheKitchen())
    {
        checkoutWithCaution('delivery');
    } else
    {
        myCart.checkoutDelivery();
    }
}

/**
 * Returns the price for the selected item
 * @returns {String} - actually string but it is intepreted as number
 */
function getDataPrice()
{
    if ($('.price-type-action.active').length > 0)
    {
        return $('.price-type-action.active').data('price');
    }
    else if ($('.price-type-action.asterisk_on_button').data('price').length > 0)
    { // in the case when asterisk is shown instead of active
        return $('.price-type-action.asterisk_on_button').data('price');
    }
// something went wrong
    return 'Error - vfnbvkjfnfhngfg';
}

/**
 * Retrieves name of price group which is used later for deciding what button should have asterisk
 *  denoting that this pricegroup is active currently
 * @returns {String}
 */
function getPriceGroup()
{
    if ($('.price-type-action.active').length > 0)
    {
        return $('.price-type-action.active').data('priceGroup');
    }
    else if ($('.price-type-action.asterisk_on_button').data('priceGroup').length > 0)
    { // in the case when asterisk is shown instead of active
        return $('.price-type-action.asterisk_on_button').data('priceGroup');
    }

    return 'price';
}


function getProductName(name, extra)
{
    var options = [];
    extra = JSON.parse(extra);
    for (var i in extra) {
        if (extra.hasOwnProperty(i)) {
            if (i.indexOf('[') != -1) {
                tmp = i.match(/(.*)\[(.*)?\]/);
                if (tmp[1] == 'ingredients' || tmp[1] == 'ingredients_second' || tmp[1] == 'variation') {
                    if (tmp[1] != 'variation') {
                        tmp[2] = 'Extra';
                    }
                    if (extra[i].name == undefined) {
                        for (var j in extra[i]) {
                            if (extra[i].hasOwnProperty(j)) {
                                if (options[tmp[1]] == undefined) {
                                    options[tmp[1]] = {};
                                }
                                if (options[tmp[1]][tmp[2]] == undefined) {
                                    options[tmp[1]][tmp[2]] = [];
                                }
                                options[tmp[1]][tmp[2]].push(extra[i][j].name);
                            }
                        }
                    } else {
                        if (options[tmp[1]] == undefined) {
                            options[tmp[1]] = {};
                        }
                        if (options[tmp[1]][tmp[2]] == undefined) {
                            options[tmp[1]][tmp[2]] = [];
                        }
                        options[tmp[1]][tmp[2]].push(extra[i].name);
                    }
                }
                if (tmp[1] == 'half') {
                    if (extra[i].id != '') {
                        options['half'] = extra[i];
                    }
                }
            }
        }
    }
    if (options.half != undefined)
    {
        //name = 'Half & Half,  1st Half: ' + name + ' 2nd Half: ' + options.half.productName;
        name = 'Half & Half';
    }
    return name;
}


function compareItemsBySortField(a, b)
{
    if (a.sort < b.sort)
    {
        return -1;
    }
    if (a.sort > b.sort)
    {
        return 1;
    }
    return 0;
}

function checkIfCashIsSelected() {
    if ($.trim($('#pay_now_buttons').children('a.active').text()) == 'Cash' ||
            $('#modal-checkout-delivery-payment-types-b').children('a.active').text() == 'Cash') {
        return true;
    }
    return false;
}


/**
 * Contols state of add button  for custom items
 * @returns {Custom_items}
 */
function Custom_Add_Button() {
}

Custom_Add_Button.prototype.setInactive = function () {
    $('#disc-product-add').prop('disabled', 'true');
    $('#disc-product-add').addClass('gray_element');
}

Custom_Add_Button.prototype.setActive = function () {


    var value_in_price = $('#discValue').val()

    // check if it contains somehting else except number (it should)
    if (
            // per cent don't need printers
            value_in_price.indexOf('%') !== -1

            // case when one of printers was selected
            || (value_in_price.indexOf('$') !== -1 && $('.btn-printer-custom_orders').parent().hasClass('active'))
            // case when switcher is set in state  "no print"
            || (value_in_price.indexOf('$') !== -1 && !$("[name='checkbox_hide_printers_custom_items']").bootstrapSwitch('state'))) {

        $('#disc-product-add').removeAttr('disabled');
        $('#disc-product-add').removeClass('gray_element');
    }
    else {
        // if  numbers/signs can be deleted too
        Custom_Add_Button.prototype.setInactive();
    }

}

var custom_add_button = new Custom_Add_Button();





