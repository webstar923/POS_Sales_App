


$(document).ready(function() {
 // jQuery.fn.animate = jQuery.fn.velocity;

var  develop_mode = false; //manually change to 'true' when in develop mode

   if(develop_mode != true ) {
        //to prevent right-click menu - needed for touchscreen
        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
    }

    if(globalSettings.getAlphaScroll()==0){
      $("#product-floated").hide();
      enlargeProductContainer();
    }else{
      $("#product-floated").show();
      enlargeProductContainer();
    }


    if (/Android/i.test(navigator.userAgent)) { // all Android devices specific rules
        $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/static/custom/css/mobile_android_chrome.css?v=' + Math.floor((Math.random() * 9999999) + 1)));
    }

    if (/Lenovo A936/i.test(navigator.userAgent)) { //for 6inch devices with 720x1280 with a pixel ratio 2 - so displaying as 360x640 (ie Lenovo A936)
       //alert(navigator.userAgent);
        var scale = 0.5;

        $('meta[name=viewport]').attr('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', user-scalable=no');
        $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/static/custom/css/720_1280_2.css?v=' + Math.floor((Math.random() * 9999999) + 1)));

        window.scaledWindowWidth = $(window).width() * scale;
    }


    //if (1) {
    if (/iPad/i.test(navigator.userAgent)) { //for iPadAir 1635x2048 with a pixel ratio 2 so displying as 1024x768
        //alert(navigator.userAgent);
        var scale = 1;

        $('meta[name=viewport]').attr('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', user-scalable=no');
        $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/static/custom/css/1635_2048_2.css?v=' + Math.floor((Math.random() * 9999999) + 1)));

        window.scaledWindowWidth = $(window).width() * scale;
    }

    if (/X11/i.test(navigator.userAgent)) { //putting thick scroller bars on desktop terminals (X11) - resistive tourchreens
        //   $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/static/custom/css/rescroller.css?v=' + Math.floor((Math.random() * 9999999) + 1)));
        $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/static/custom/css/desktop_ubuntu_chrome.css?v=' + Math.floor((Math.random() * 9999999) + 1)));

         //on resistive touchscreen regular dropdown box doesn't work properly, using select2 then
        $(document).on('shown.bs.modal', '#ui-settings-modal', function () {
            $(".alter-dropdown").select2({
                minimumResultsForSearch: -1, //hide search field
                disabled: true
            });
            $('.alter-dropdown').each(function () { //prevent virtual keyboard to show up. needed when minimumResultsForSearch: -1
                $(this).find('.select2-search, .select2-focusser').hide();
            });
            $(".select2-results").css({'min-height':"100%"});
        });
    }

    $(document).on('focusin', '#search-control', function() {

        window.scrollTo(0,0); //scroll back on iPad to counter the autocrolling on keyboard pop-up, there's probably some better way of doing this TODO

        if (/X11/i.test(navigator.userAgent)) {
            bindBackspaceForSearchInMainWindow();
        }
        if (/Android/i.test(navigator.userAgent)) {
            $('#footer-navigation').hide();
        }
    })

    $(document).on('focusout', '#search-control', function() {
        if (/X11/i.test(navigator.userAgent)) {
            clearInterval(bindBackspaceForSearchInMainWindow.interVal);
            bindBackspaceForSearchInMainWindow.interVal = false;
        }
        if (/Android/i.test(navigator.userAgent)) {
            $('#footer-navigation').show();
        }
    })

    if (!window.scaledWindowWidth) {
        window.scaledWindowWidth = $(window).width();
    }

     $(document).on('click', '.add_extra_ingredients', function() {
        $(this).next().find(".select2-choices").trigger("click");
    })


    //$(document).on('click', '#fulloverflow', function () {
    //         alert('XXXX');
    // })
     $(document).on('click', '#clean_address_field', function() {
        $('#modal-checkout-delivery-address').val('');
        setPriceTotal(myCart.getTotal());
    })


    $(document).on('focusin', '#modal-checkout-delivery-phone', function() {
        //switching to numeric virtual keyboard layout
        $("#modal-checkout-delivery-phone").attr("_originaltype", "number");
        bindBackspaceForSearchInDeliveryWindowPhone();
    })

    $(document).on('focusout', '#modal-checkout-delivery-phone', function() {
        //switching back to 'text' so the phone number with spaces can be saves in the field
        $("#modal-checkout-delivery-phone").attr("_originaltype", "text");

        //store field value in case the modal is closed to be reopened later
        localStorage.setItem('tmp_phone', $("input#modal-checkout-delivery-phone").val());
        setTimeout(function() {
            localStorage.setItem('tmp_address', $("input#modal-checkout-delivery-address").val());
         }, 0);
        localStorage.setItem('tmp_company', $("input#modal-checkout-delivery-company").val());
        localStorage.setItem('tmp_name', $("input#modal-checkout-delivery-name").val());


        clearInterval(bindBackspaceForSearchInDeliveryWindowPhone.interVal);
        bindBackspaceForSearchInDeliveryWindowPhone.interVal = false;
    })

    $(document).on('focusin', '#modal-checkout-delivery-address', function() {
        bindBackspaceForSearchInDeliveryWindowAddress();
        setTimeout(function() {
            $("#virtualKeyboardChromeExtensionMainKbdPH .k1234").trigger("click");
            window.keyboard_switch = 0;
        }, 100);
    })

    $(document).on('focusout', '#modal-checkout-delivery-address', function() {


        clearInterval(bindBackspaceForSearchInDeliveryWindowAddress.interVal);
        bindBackspaceForSearchInDeliveryWindowAddress.interVal = false;
         //store field value in case the modal is closed to be reopened later
         setTimeout(function() {
            localStorage.setItem('tmp_address', $("input#modal-checkout-delivery-address").val());
         }, 0);
    })


    $(document).on('focusout', '#modal-checkout-delivery-company', function() {
       //store field value in case the modal is closed to be reopened later
       localStorage.setItem('tmp_company', $("input#modal-checkout-delivery-company").val());
    })


    $(document).on('focusout', '#modal-checkout-delivery-name', function() {
       //store field value in case the modal is closed to be reopened later
       localStorage.setItem('tmp_name', $("input#modal-checkout-delivery-name").val());
    })

    $(document).on('focusout', '#delivery-note', function() {
       //store field value in case the modal is closed to be reopened later
       localStorage.setItem('tmp_note', $("input#delivery-note").val());
    })

    $(document).on('focusout', '#takeaway-note', function() {
       //store field value in case the modal is closed to be reopened later
       localStorage.setItem('tmp_note', $("input#takeaway-note").val());
    })

    $(document).on('shown.bs.modal', '#modal-closed-orders', function () {
       setFrontPrinterOnly(); // VV HACK TODO
    })

   $(document).on('shown.bs.modal', '#modal-checkout-type', function () {

        //all ShowDontKnowYet() & HideDontKnowYet() part is hackish  - will be all redone later on anyway - TODO
        //switch to 'Will Pay on delivery/pickup' on re-opening the modal
        if ($(".checkout-tabs[data-type='delivery']").closest('li').hasClass('active')) {
            $("#delivery-nav-pay-pay-now").closest('li').removeClass('active');
            $("#will_pay_on_delivery").closest('li').addClass('active');
            ShowDontKnowYet();
            //console.log('asdfXXX');
        }

        if ( $(".checkout-tabs[data-type='takeaway']").closest('li').hasClass('active') && $("#modal-checkout-type-pay-phone-button").closest('li').hasClass('active')  ) {
            HideDontKnowYet();

        }
        //show
        $("#id_kitchen_docket_delivery").closest('li').removeClass('active');
        $("#id_customers_docket_delivery").closest('li').addClass('active');
        $("#id_customers_docket_delivery").trigger('click')

        $("#id_kitchen_docket").closest('li').removeClass('active');
        $("#id_customers_docket").closest('li').addClass('active');
        $("#id_customers_docket").trigger('click')


       //retrevie stored field temp values if no callerID is used (sessionStorage.client_called_data is emtpy))
       //if(!sessionStorage.client_caller_data){
       /*
        if(1){
           $("input#modal-checkout-delivery-phone").val(localStorage.getItem('tmp_phone'));
           $("input#modal-checkout-delivery-address").val(localStorage.getItem('tmp_address'));
           $("input#modal-checkout-delivery-company").val(localStorage.getItem('tmp_company'));
           $("input#modal-checkout-delivery-name").val(localStorage.getItem('tmp_name'));
           $("input#delivery-note").val(localStorage.getItem('tmp_note'));
           $("input#takeaway-note").val(localStorage.getItem('tmp_note'));
        }
        */


            //fill manually entered data if Checkout modal is re-opened
            if (localStorage.getItem('tmp_name') != '') {
                $("input#modal-checkout-delivery-name").val(localStorage.getItem('tmp_name'));
            }
            if (localStorage.getItem('tmp_company') != '') {
                $("input#modal-checkout-delivery-company").val(localStorage.getItem('tmp_company'));
            }
            if (localStorage.getItem('tmp_phone') != '') {
                $("input#modal-checkout-delivery-phone").val(localStorage.getItem('tmp_phone'));
            }
            if (localStorage.getItem('tmp_address') != '') {
                $("input#modal-checkout-delivery-address").val(localStorage.getItem('tmp_address'));
            }
            $("input#delivery-note").val(localStorage.getItem('tmp_note'));
            $("input#takeaway-note").val(localStorage.getItem('tmp_note'));




        //recaltulating the total price if opening the modal the second time having a delivery suburb with a fee
        $('#checkout-delivery-button').children('.checout-total-container').text(price_recalculation());

    })

    //when comming from/to Deliver tab/Dine-in tab switch to appropriate payment options
    $(document).on('click', '.checkout-tabs', function() {
      if ( $(".checkout-tabs[data-type='delivery']").closest('li').hasClass('active') ) {
        $("#delivery-nav-pay-pay-now").closest('li').removeClass('active');
        $("#already_paid_tab_takeaway").closest('li').removeClass('active');
        $("#will_pay_on_delivery").closest('li').addClass('active');
        ShowDontKnowYet();
        console.log('asdfXXX');
      }

      if ( $(".checkout-tabs[data-type='takeaway']").closest('li').hasClass('active') ) {
        $("#modal-checkout-type-pay-payed-button").closest('li').removeClass('active');
        $("#already_paid_tab_dinein").closest('li').removeClass('active');
        $("#modal-checkout-type-pay-phone-button").closest('li').addClass('active');
        HideDontKnowYet();
        console.log('asdf');
      }
    });


   $("body").bind("DOMNodeInserted", function() {
        if(localStorage.getItem('drawer_show_kick_open') != "true" || globalSettings.getDefaultDrawer() == 0) {
            $(this).find('#open_till').addClass('hidden');
            $(this).find('#open_till_hr').addClass('hidden');
        }
    });

    if ($('#rescroller').length > 0) {
        $('#list-products').css('margin-right', '0');
    }

    $(document).on('click', '#search-control-delete', function() {
        var val = $('#search-control').val();
        if (val != '') {
            val = val.slice(0, -1);
        }
        $('#search-control').val(val).trigger('keyup');
    });

    $(document).on('click', '.kbdClick', function(e) {
        console.log($(this));
    });

    if (sessionStorage.getItem('client_caller_data')) {
        var _t_call_client = sessionStorage.getItem('client_caller_data');
        _t_call_client = JSON.parse(_t_call_client);
        var c_html = ($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
            return a.toUpperCase()
        }) + ' Order';
        if (_t_call_client.name != undefined && _t_call_client.name != '') {
            $('#client-details-container').html(c_html + ' for ' + _t_call_client.name);
        } else {
            $('#client-details-container').html(c_html + ' for ' + formatPhoneNumber(_t_call_client.number));
        }
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
    }

    setTimeout(function() {
        $('#delayOverflow').addClass('hide');

        $('#hide_search_control').click(function() {

            resetSearch();
        })



    }, 1000);

    //FastClick.attach(document.body);

    var _sy = new syncHandler();
    var _db = _sy.getDbInstance();


    if (_db.version == '-1')
    {
//        window.location.href = 'login';
        var sy = new syncHandler();
        sy.dropDatabase();
        return;
    }
    _db.transaction(function(tx) {

        tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function(tx, results) {
//        tx.executeSql('SELECT * FROM "printers"', [], function (tx, results) {
//
            for (var i = 0; i < results.rows.length; i++) {
                globalSettings.addDrawerToList(results.rows.item(i).id);
            }
//
        });


        //tx.executeSql('SELECT * FROM "settings" WHERE "enabled"=?', [1], function (tx, results) {
        //});
        tx.executeSql('SELECT * FROM "order_types" WHERE "enabled"=?', [1], function(tx, results) {
            var order_types = [],
                    tmp, client, to_c = '';


            if (sessionStorage.getItem('order_type') == undefined) {
                //oh
                sessionStorage.setItem('order_type', '2');
            }

            if (results.rows.length > 0) {
                for (var i = 0; i < results.rows.length; i++) {
                    tmp = $.extend({}, results.rows.item(i));
                    if (tmp.id == sessionStorage.getItem('order_type')) {
                        tmp.selected = true;
                    }
                    order_types.push(tmp);
                }
            }

            if (sessionStorage.getItem('client_caller_data')) {
                client = JSON.parse(sessionStorage.getItem('client_caller_data'));
            } else {
                client = false;
            }

            var html = Mustache.to_html($('#accordeon-order-types-template').html(), order_types);
            $('#accordeon-order-types-list').html(html).find('.order-type-action').on('click', function() {
                $('.order-type-action').removeClass('active');

                //VV HACK -TODO: make corestpoding pricegroup active accroding to order type (ie Phone-in->Delivery, EatNow, Menulog - > Online etc.)
                $('.price-type-action').removeClass('active');
                if ($(this).data('id') =='1')
                {
                   // alert('phone-in');
                    $('a[data-price-group=deliverytaway]').addClass('active');
                }
                if ($(this).data('id') =='2')
                {
                    //alert('walkin');
                    $('a[data-price-group=dinein]').addClass('active');
                }
                if ($(this).data('id') =='3')
                {
                    //alert('on-line');
                    $('a[data-price-group=online]').addClass('active');
                }
                if ($(this).data('id') =='6')
                {
                    //alert('eatnow');
                    $('a[data-price-group=online]').addClass('active');
                }
                if ($(this).data('id') =='7')
                {
                    //alert('menulog');
                    $('a[data-price-group=online]').addClass('active');
                }

                //end VV HACK


                $(this).addClass('active');
                sessionStorage.setItem('order_type', $(this).data('id'));
                sessionStorage.setItem('order_type_action', $(this).data('action'));
                var to_c = '';
                if (sessionStorage.getItem('client_caller_data')) {
                    var client = JSON.parse(sessionStorage.getItem('client_caller_data'));

                    /**
                     *  a bit unsure about the necessity of changes
                     *  but it seems that empty line shouldn't be shown as nam
                     *  e because in this case we see nowt , by trimming line we avoid such situation
                     */
                    client.name = $.trim(client.name);

                    if (client.name != '') {
                        to_c = ' for ' + client.name;
                    } else {
                        to_c = ' for ' + formatPhoneNumber(client.number);
                    }
                }
                var pricesLabel = $('.price-type-action.active').text();

                $('#client-details-container').html(($(this).html() + '').replace(/\b([a-z])/g, function(a) {
                    return a.toUpperCase()
                }) + ' Order' + to_c + ' - ' + pricesLabel + ' Prices');
            });

            if (client) {
                if (client.name != '') {
                    to_c = ' for ' + client.name;
                } else {
                    to_c = ' for ' + formatPhoneNumber(client.number);
                }
            }
            $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
                return a.toUpperCase()
            }) + ' Order' + to_c);
            $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
        });
    });
    $('#accordeon-order-prices-list').on('click', '.price-type-action', function() {
        $('.price-type-action').removeClass('active');




        $(this).addClass('active');
        var to_c = '';
        if (sessionStorage.getItem('client_caller_data')) {
            var client = JSON.parse(sessionStorage.getItem('client_caller_data'));
            if (client.name != '') {
                to_c = ' for ' + client.name;
            } else {
                to_c = ' for ' + formatPhoneNumber(client.number);
            }
        }
        $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
            return a.toUpperCase()
        }) + ' Order' + to_c);
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');

        remember_last_active();
    });
    $('#modal-checkout-delivery-time-types').on('click', '.button-pay-type-time', function() {


        $('#modal-checkout-delivery-time-types .button-pay-type-time').removeClass('active');
        $(this).addClass('active');
        $('.delivery-type-item').addClass('hide');
        $('.delivery-type-' + $(this).data('type')).removeClass('hide');
        if ($(this).data('type') == 'later') { //VV
            $('#fulloverflow').removeClass('hide');
            $("#delivery-type-later-datepicker").datetimepicker('show');
        }
        ;
    });

    $('#modal-checkout-takeaway-time-types').on('click', '.button-pay-type-time', function() {

//        alert("fdf");

        $('#modal-checkout-takeaway-time-types .button-pay-type-time').removeClass('active');
        $(this).addClass('active');
        $('.takeaway-type-item').addClass('hide');
        $('.takeaway-type-' + $(this).data('type')).removeClass('hide');
        if ($(this).data('type') == 'later') { //VV
            $('#fulloverflow').removeClass('hide');
            $("#takeaway-type-later-datepicker").datetimepicker('show');
        }
        ;

    });

    $('#modal-checkout-takeaway-time-types-park').on('click', '.button-pay-type-time', function() {

//        alert("fdfddff");

        $('#modal-checkout-takeaway-time-types-park .button-pay-type-time').removeClass('active');
        $(this).addClass('active');
        $('.takeaway-type-item').addClass('hide');
        $('.takeaway-type-' + $(this).data('type')).removeClass('hide');
        if ($(this).data('type') == 'later') { //VV
            $('#fulloverflow').removeClass('hide');
            $("#takeaway-type-later-datepicker-park").datetimepicker('show');
        }
        ;
    });


    enlargeProductContainer();

    if (globalSettings.getTabCollapsed()) {
        $('#collapse-order').removeClass('in').addClass('collapsed');
        cartCollapsed = true;
        enlargeProductContainer();
    }

    if (globalSettings.getShowCall()) {
        NovComet.run();
    }

    if (globalSettings.getOnlineState()) {
        _sy.lazySync();
        _sy.pushLocalData();
    }


    if (globalSettings.getDefaultPrice() !== "false")
    {

        $('.price-type-action').removeClass('active');
//        $('.price-type-action[data-price="' + globalSettings.getDefaultPrice() + '"]').addClass('active').trigger('click');
    }
    /**
     * only on the first loading of app, reloading of page shouldn't reset price group
     */
    control_modes(false);

    /**
     * Get current user and save it in the variable.
     */

    if (_db.version == '-1' || _db.version == "null")
    {
        alert("no db, logging out gnfjnfkj");
        var sy = new syncHandler();
        sy.dropDatabase();
    }


    _db.transaction(function(tx) {
        tx.executeSql('SELECT "firstname", "lastname", "id", "isadmin", "glympse",\n\
 "allparkedorders", "allclosedorders", "dayfunctions", "show_drawer_kick_open", "can_delete_orders" FROM "users" WHERE "id"=?', [myCart.getActiveUser()], function(tx, results) {

            if (results.rows.length > 0) {


                thisUser = results.rows.item(0);

                // whether option of drawer kick open should be showed
                if (thisUser['show_drawer_kick_open'])
                {
                    localStorage.setItem('drawer_show_kick_open', true); // will be shown
                }
                else
                {
                    localStorage.setItem('drawer_show_kick_open', false); // won't be shown
                }

                var drawerKickOpen = localStorage.getItem('default_drawer_kick_open_print')

                if (typeof drawerKickOpen === 'undefined') {
                    var FIRST_PRINTER = 0;
                    localStorage.setItem('default_drawer_kick_open_print', FIRST_PRINTER);
                }


                globalSettings.setCanDeleteOrders(thisUser['can_delete_orders']);
                // 1 and 4 indexes are existing only

//
                /**
                 * Show/Hide Drivers/Glympse Button
                 */
                if (thisUser.glympse == 1) {
                    $('#glympse-button').appendTo('#userActionButtons');
                } else {
                    $('#glympse-button').appendTo('#garbage');
                }

                if (globalSettings.getOnlineState()) {
                    $('.glyphicon.glyphicon-cog').removeClass('color-red').addClass('color-green');
                } else {
                    $('.glyphicon.glyphicon-cog').removeClass('color-green').addClass('color-red');
                }
                $('#user-menu-container').html(thisUser.firstname + ' ' + (thisUser.lastname).substr(0, 1));
                localStorage.setItem('user_initials', (thisUser.firstname).substr(0, 1).toUpperCase() + (thisUser.lastname).substr(0, 1).toUpperCase());
                if (!localStorage.getItem('orderInc')) {
                    localStorage.setItem('orderInc', 1);
                }



            } else {
                window.location.href = 'login';
                var sy = new syncHandler();
                sy.dropDatabase();
            }
        });



        // saving ids of printers on client side for correct sending of ids
        tx.executeSql('SELECT "id", "idPrinter"  FROM "products" WHERE "name"=?', ["misc-disc-"], function(tx, results) {
            for (var i = 0; i < results.rows.length; i++) {
                storePrinterForCustomItems(results.rows.item(i).id, results.rows.item(i).idPrinter)
            }
        });


    });

    $(document).on('click', '#switch-user-trigger', function() {
        var db = new syncHandler().getDbInstance(),
                u = null,
                p = $('#input-password').val(),
                e = false;

        if (p == '' || p.length == 0) {
            $('#input-password').parent().addClass('has-error');
            e = true;
        }

        if (!e) {
            db.transaction(function(tx) {
                tx.executeSql('SELECT "id","firstname","lastname" FROM "users" WHERE "password"=?', [md5(p)], function(tx, results) {
                    if (results.rows.length > 0) {
                        localStorage.setItem('currentUser', results.rows.item(0).id);
                        localStorage.setItem('user_initials', (results.rows.item(0).firstname).substr(0, 1).toUpperCase() + (results.rows.item(0).lastname).substr(0, 1).toUpperCase());
                        $('#modal-switch-users').modal('hide');

                        $.ajax({
                            url: "/data",
                            type: "POST",
                            context: document.body,
                            data: {
                                'request': 'checkTiltOpened',
                                'token': getToken(),
                            }
                        }).success(function(data) {
                            saveToken(data._token);
                            localStorage.setItem('tiltOpened', data.tiltOpened);
                            // alert('2 reload');
                            window.location.reload();
                        });

                    } else {
                        $('#input-password').val('');
                        alert('No user found with this passcode.');
                    }
                });
            });
        }
    });

    function resetTimeButtons() { //VV
        $('.takeaway-type-asap').removeClass('hide');
        $('.takeaway-type-later').addClass('hide');
        $('.delivery-type-asap').removeClass('hide');
        $('.delivery-type-later').addClass('hide');
        $('a[ data-type = "asap"]').addClass('active');
        $('a[ data-type = "later"]').removeClass('active');
    }
    $(document).on('click', '#top-accordion-void', function() {
        $('#modal-void-order').modal('show');
    });

    $(document).on('click', '#modal-discount-validate', function() {
        var sy = new syncHandler();
        sy.checkCoupon($('#modal-discount-input').val(), 'couponCbModal');
    });

    $(document).on('click', '#modal-checkout-type-close', function() {
        $('#modal-checkout-type').modal('hide');
        showDisplay("", "", "clear_immediatelly");
    });

    $(document).on('click', '#coupon-validate', function() {
        var sy = new syncHandler();
        sy.checkCoupon($('#coupon-validate-input').val(), 'couponCb');
    });

    $(document).on('click', '#topcall-get', function() {
        myCart.keepClient();
    });

    $(document).on('click', '#topcall-dismiss', function() {
        var sy = new syncHandler();
        sy.dismissCall();
    });

    $(document).on('hidden.bs.collapse', '#collapse-order', function() {
        cartCollapsed = true;
        enlargeProductContainer();
    });

    $(document).on('shown.bs.collapse', '#collapse-order', function() {
        cartCollapsed = false;
        enlargeProductContainer();
    });

    $(document).on('hidden.bs.modal', '#modal-change-back', function() {
        showDisplay("", "", "clear");
    });
    $('#btn-park-order').on('click', function(e) {


        if (globalSettings.getTiltOpened() == "false")
        {
            alert('You should open till');
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if ($.trim($('#empty-cart td').text()) == emptyCart) {
            $('#parking_order_note').val('');
        }

    });
    $.ajax({
        url: "/data",
        timeout: 10000,
        type: "POST",
        context: document.body,
        data: {
            request: 'getOpeningHours',
            token: getToken()
        }
    }).success(function(response) {
        saveToken(response._token);
        var daysOfWeekDisabled = [];
        for (var i in response.hours.exclude_days)
        {
            daysOfWeekDisabled.push(response.hours.exclude_days[i]);
        }


        // alert(JSON.stringify(response.hours.hours, null, 4));
        $("#delivery-type-later-datepicker, #takeaway-type-later-datepicker, #takeaway-type-later-datepicker-park").datetimepicker({
            //format: 'yyyy-mm-dd HH:ii P', //VV
            format: 'at HH:iip on M dd',
            startView: 'hour',
            pickerPosition: "top-left",
            startDate: new Date(),
            daysOfWeekDisabled: daysOfWeekDisabled,
            timeWork: response.hours.hours,
            endDate: '+7d',
            autoclose: true,
            showMeridian: true,
            minuteStep: 15,
        });



        $("#delivery-type-later-datepicker, #takeaway-type-later-datepicker, #takeaway-type-later-datepicker-park").on('hide', function() {
            $('#fulloverflow').addClass('hide');
            if (this.value == '') {
                resetTimeButtons();
            }
        });

        $(".takeaway-type-later, .delivery-type-later, .takeaway-type-later-datepicker-park").on('click', function() {
            if (!/iPad/i.test(navigator.userAgent)) { //for some reason the datepicker doesn't work well on iPad - TODO LATER
                $('#fulloverflow').removeClass('hide');
            }
        });


    });



    // order panel start
    $('#trigger-orders').sidr({
        displace: false,
        name: 'sidr-orders',
        source: '#sidr-orders',
        renaming: false,
        onOpen: function(a, b)
        {
            showFormattedTime("starting opening the tilt");
            $('.btn-close-sidr-left').text(textCloseOrder);
            $('.btn-close-sidr-left').css('background-color', 'blue');



            $('#fulloverflow').removeClass('hide');
            var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    tmp, date, d, h, t,
                    data = {},
                    dd = new Date();
            //cols = ["table","status","contents","total","userId","pay_value","pay_type","note","order_code","order_type"];

            /**
             * For being able to select only user's orders or all order, based on user's settings
             * @type {string}f
             */
            var filterOrdersByUser = '';
            //if(thisUser.allorders == 1) {
            filterOrdersByUser = ' OR 1=1 ';
            //}
//
            $('.btn-close-sidr-left').show();

            if (globalSettings.getOnlineState() && globalSettings.getTiltOpened() !== 'false')
            {
//

                $.ajax({
                    url: "/data",
                    timeout: 10000,
                    type: "POST",
                    context: document.body,
                    data: {
                        request: 'getOrderListForPanel',
                        showAllParkedOrders: thisUser.allparkedorders,
                        showAllClosedOrders: thisUser.allclosedorders,
                        userId: myCart.getActiveUser(),
                        token: getToken()
                    }
                }).success(function(response) {



//                    showFormattedTime("response from server is got");

                    saveToken(response._token);
                    db.transaction(function(tx) {
                        tx.executeSql('DELETE FROM orders WHERE status != "unsaved"', [], function(tx, results) {

                            for (var i in response.orders)
                            {
                                if (!response.orders.hasOwnProperty(i)) {
                                    continue;
                                }

                                // if order was deleted (i.e. marked as voided )
                                if (response.orders[i].voided != 0) {
                                    continue;
                                }


//
                                var temp_var = response.orders[i];

//

                                var tmpArr = [];
                                tmpArr.push(response.orders[i].table);
                                tmpArr.push(response.orders[i].status);
                                tmpArr.push(response.orders[i].contents);
                                tmpArr.push(response.orders[i].total);
                                tmpArr.push(response.orders[i].userId);
                                tmpArr.push(response.orders[i].pay_value);
                                tmpArr.push(response.orders[i].pay_type);
                                tmpArr.push(response.orders[i].note);
                                tmpArr.push(response.orders[i].order_code);
                                tmpArr.push(response.orders[i].order_type);
                                tmpArr.push(timeConverter(response.orders[i].date));
                                tmpArr.push(response.orders[i].order_time);
                                tmpArr.push(response.orders[i].address);
                                tmpArr.push(response.orders[i].voided);
                                tmpArr.push(response.orders[i].credit_card_fee);
                                tmpArr.push(response.orders[i].rounding);
                                tmpArr.push(response.orders[i].order_status);
                                tmpArr.push(response.orders[i].display_id);
                                tmpArr.push(response.orders[i].unique_id);


                                //tmpArr.push(response.orders[i].date);
                                //tmpArr.push('datetime('+response.orders[i].date+', "unixepoch")');
                                tx.executeSql('INSERT INTO orders ("table","status","contents","total","userId","pay_value","pay_type","note", "order_code", "order_type", "date","order_time","address", "voided", "credit_card_fee","rounding", "order_status", "display_id","unique_id") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', tmpArr, function(tx, results) {

                                }, function(a, b) {

                                    console.warn(a);
                                    console.warn(b);
                                });
                            }

//                            showFormattedTime("orders are inserted ");
                        });
                    }, function() {
                    }, function() {

//
//
//
                        db.transaction(function(tx) {
//                            tx.executeSql('SELECT o.*,ot."name" as "ot_name", ot."id" as "ot_id" FROM "orders" o LEFT JOIN "order_types" ot ON o."order_type"= ot."id" WHERE o."userId"=?' + filterOrdersByUser + ' ORDER BY date DESC, display_id DESC', [myCart.getActiveUser()], function(tx, results) {


                            tx.executeSql('SELECT o.*,ot."name" as "ot_name", ot."id" as "ot_id" FROM "orders" o LEFT JOIN "order_types" ot ON o."order_type"= ot."id" WHERE o."userId"=?' + filterOrdersByUser + ' ORDER BY date DESC,  display_id DESC', [myCart.getActiveUser()], function(tx, results) {


//                                showFormattedTime("started preparing order");
                                _prepareDataOnTriggerOrders(results.rows, 'webSql');

                            });
                        });
                    });



                }).error(function(XMLHttpRequest, textStatus, errorThrown) {
//
                    alert(XMLHttpRequest);
                    alert(textStatus);
                    alert(errorThrown);


//SELECT display_id, SUBSTRING_INDEX( display_id,'-',-1 ) FROM `pos_orders`

                    db.transaction(function(tx) {
                        tx.executeSql('SELECT o.*,ot."name" as "ot_name", ot."id" as "ot_id" FROM "orders" o LEFT JOIN "order_types" ot ON o."order_type"= ot."id" WHERE o."userId"=?' + filterOrdersByUser + ' ORDER BY date DESC,  display_id DESC', [myCart.getActiveUser()], function(tx, results) {

//                            showFormattedTime("started preparing order");
                            _prepareDataOnTriggerOrders(results.rows, 'webSql');
                        });
                    });
                });
            }
            else

            {


//
                db.transaction(function(tx) {
                    tx.executeSql('SELECT o.*,ot."name" as "ot_name", ot."id" as "ot_id" FROM "orders" o LEFT JOIN "order_types" ot ON o."order_type"= ot."id" WHERE o."userId"=?' + filterOrdersByUser + ' ORDER BY date DESC,  display_id DESC', [myCart.getActiveUser()], function(tx, results) {

//                        showFormattedTime("started preparing order");
                        _prepareDataOnTriggerOrders(results.rows, 'webSql');
                    });
                });
            }
        },
        onClose: function() {


            $('#searchFieldItems').on('focusout', function() {
//            console.log("disabled monitoring");
                clearInterval(bindBackspace.interVal);
                bindBackspace.interVal;
            })

            console.log("closing");
            $('#fulloverflow').addClass('hide');
            $('#sidr-orders .btn-close-sidr-left').hide();
        }
    });




    function timeConverter(UNIX_timestamp)
    {
        var now = new Date(UNIX_timestamp * 1000);
        var year = "" + now.getFullYear();
        var month = "" + (now.getMonth() + 1);
        if (month.length == 1) {
            month = "0" + month;
        }
        var day = "" + now.getDate();
        if (day.length == 1) {
            day = "0" + day;
        }
        var hour = "" + now.getHours();
        if (hour.length == 1) {
            hour = "0" + hour;
        }
        var minute = "" + now.getMinutes();
        if (minute.length == 1) {
            minute = "0" + minute;
        }
        var second = "" + now.getSeconds();
        if (second.length == 1) {
            second = "0" + second;
        }
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

    }


    function extractTotalPrice(content) {


        data = JSON.parse(content);

        var total = 0;

        $.each(data, function(index, elem) {
            total = total + parseFloat(elem['tot_price']);
        });

        if (data.length != 0)
        {
//
            var price = '$' + total.toFixed(2);
            return price;
        }
        return false;
    }

    function cutLastPartOfDisplayID(line) {
        if (line) {
            line = line.split('-');
            return line[2];
        } else {
//            return 'empty';
            return 'XXX';
        }

    }

    function _prepareDataOnTriggerOrders(inputData, from)
    {

        if (globalSettings.getTiltOpened() !== 'false') {
            var sel = false,
                    sts = true,
                    sts_name = '',
                    sts_alias = '',
                    data = {};

            for (var i = 0; i < inputData.length; i++)
            {
                if (from == 'webSql')
                {
                    tmp = jQuery.extend({}, inputData.item(i));
                }
                else
                {
                    tmp = jQuery.extend({}, inputData[i]);
                }



                tmp['total_price'] = extractTotalPrice(tmp.contents);
                tmp['display_id'] = cutLastPartOfDisplayID(tmp['display_id']);

                if (data[tmp['status']] == undefined) {
                    data[tmp['status']] = [];
                    data['has_' + tmp['status']] = true;
                }
                if (tmp['id'] == localStorage.getItem('cartSession')) {
                    sel = true;
                } else {
                    sel = false;
                }



                if (tmp['date'] != '') {
                    // for safari browser
                    tmp['date'] = tmp['date'].replace(/-/g, "/");
                    d = new Date(Date.parse(tmp['date']));
                    h = d.getHours();
                    if (h > 12) {
                        t = 'pm';
                        h = parseInt(h) - 12;
                    } else {
                        t = 'am';
                    }
                    date = h + ':' + (d.getMinutes()).toString().replace(/\d{0,2}/, function(m) {
                        return '0'.slice(m.length - 1) + m;
                    }) + t;
                } else {
                    date = '';
                }


                if (tmp['status'] == 'park')
                {
                    if (tmp['table'] == 'T')
                    {
                        sts = 1;
                        sts_alias = 'takeaway';
                        sts_name = 'Takeaway';
                    }
                    else if (tmp['table'] == 'D')
                    {
                        sts = 3;
                        sts_alias = 'delivery';
                        sts_name = 'Delivery';
                    } else
                    {
                        sts = 2;
                        sts_alias = 'tables';
                        sts_name = 'Table Orders'
                    }

                    if (data[tmp['status']][sts] == undefined)
                    {
                        data[tmp['status']][sts] = {};
                        data[tmp['status']][sts]['name'] = sts_name;
                        data[tmp['status']][sts]['items'] = [];
                    }






                    data[tmp['status']][sts]['items'].push({
                        'table': myCart.getTableType(tmp['table']),
                        'text': myCart.formatCartContent(tmp['contents']),
                        'value': tmp['contents'],
                        'id': tmp['id'],
                        'selected': sel,
                        'orderCode': tmp['order_code'],
                        'status': tmp['status'],
                        'date': date,
                        'voided': (tmp.voided === 'true'),
                        'note': tmp.note,
                        'color': document.pos_settings['order_' + tmp['status'] + '_' + sts_alias + '_color'],
                        'client': tmp['client'],
                        'order_type': tmp['order_type'],
                        'displayId': tmp['display_id'],
                        'tot_price': tmp['total_price'],
                        'unique_id': tmp['unique_id']
                    });
                } else {
                    if (tmp['order_status']) {
                        tmp['order_status'] = tmp['order_status'].replace('NOT PAID-', '').trim()
                        tmp['order_status'] = tmp['order_status'].replace('PAID-', '').trim();
                    }
//
                    data[tmp['status']].push({
                        'table': myCart.getTableType(tmp['table']),
                        'text': myCart.formatCartContent(tmp['contents'])+'<br>'+tmp['address'] || '',
                        'value': tmp['contents'],
                        'id': tmp['id'],
                        'status': tmp['status'],
                        'orderCode': tmp['order_code'],
                        'selected': sel,
                        'date': date,
                        'voided': (tmp.voided === 'true'),
                        'note': tmp.note,
                        'color': document.pos_settings['order_' + tmp['status'] + '_color'],
                        'client': tmp['client'],
                        'order_type': tmp['order_type'],
                        'displayId': tmp['display_id'],
                        'tot_price': tmp['total_price'],
                        'order_status': tmp['order_status'], //VV
                        'ot_name': tmp['ot_name'],
                        'unique_id': tmp['unique_id']

                    });
                }


            }
            data['park'] = normalize_array(data['park']);

            var html = Mustache.to_html($('#sidr-orders-template').html(), data);
            $('#sidr-orders-container').html(html);
        } else {

            $('#sidr-orders-container').html('');
        }

//        $('#fulloverflow').removeClass('hide');
        bindOrdersDoubleTap();


        $('#tableWithClosedOrdersToSort').filterTable({'minRows': 0, placeholder: 'search item', label: ''});

        bindBackspace();


        setTimeout(function () {
             $('.btn-close-sidr-left').show();
             enlargeProductContainer(); //needed, otherwise Delete on doubletap of Closed Orders won't work
        }, 200);


    }

    $(document).on('click', '.sidr-orders-trigger-order', function() {



        var sy = new syncHandler(),
                db = sy.getDbInstance();
        var self = $(this), order_code_here = self.data('orderCode');
        var display_id = self.data('display');
        var unique_id_clean = self.data('unique_id');

        storeTableForOrder(self.data('table'));

//        db.transaction(function(tx) {
//            tx.executeSql('SELECT "unique_id" FROM "orders" WHERE "order_code"=?', [order_code_here], function(tx, results) {



//                var unique_id = results.rows.item(0).unique_id;
        self['unique_id'] = unique_id_clean;

//                var unique_id = self.data('unique_id');
        var order_code = self.data('orderCode');


        var order_type = self.data('order-type'),
                orderId = self.data('id'),
                sy = new syncHandler(),
                db = sy.getDbInstance();
//                        self = $(this);
        if (globalSettings.getOnlineState() && self.data('status') != 'unsaved')
        {

            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {
                    request: 'checkParkedOrder',
                    orderCode: self.data('orderCode'),
                    'token': getToken(),
                    unique_id: unique_id_clean
                }
            }).done(function(response) {
                saveToken(response._token);
                if (!response.canClose)
                {
                    alert("Sorry, this order has been already closed");
                    return false;
                }

                console.log("real note " + self.data('note'));

                _ordersTriggerOrder(self);
            });
        }
        else
        {

            _ordersTriggerOrder(self);
        }
//            });
//        });

    });
    // order panel end


    function addDataAboutOrderTakenFromKitchen(order_code, unique_id) {
        $('#list-cart').addClass('takenFromPark');
        $('#list-cart').attr('order_code', order_code);
        $('#list-cart').attr('unique_id', unique_id);
    }


    function _ordersTriggerOrder(self)
    {


        if (myCart.getItemsNo() > 0 || sessionStorage.getItem('cartSession')) {

            if (localStorage.getItem('cartSession')) {
                console.log("note from holder" + $('#global-note-holder').val() + '  |' + self.data('note'));
                myCart.updateOrder(localStorage.getItem('cartSession'), '', self.data('note'));
            } else {
                // order is being unparked from the kitchen
//            console.log("entered 2");
                myCart.saveOrder(-1, 'unsaved', false, $('#global-note-holder').val(), false);
            }
        }



        myCart.clearCart();
        var contents = self.data('value');


        for (var i in contents) {
            if (contents.hasOwnProperty(i)) {
                myCart.addItem(contents[i]);
            }
        }


        addDataAboutOrderTakenFromKitchen(self.attr('data-order-code'), self['unique_id']);

        localStorage.setItem('cartSession', self.data('id'));
        updateCartElements();
        $('#global-note-holder').val(self.data('note'));

        // @TODO change the variable name by something more understable...
        var a;
        if (self.data('client')) {
            try {
                a = JSON.parse(JSON.parse(self.data('client')));
            } catch (e) {
                a = false;
            }
            if (a) {
                sessionStorage.setItem('client_caller_data', JSON.stringify(a));
            }
        }
        else {
          a = {number: self.find(".phone").text()};
          sessionStorage.setItem('client_caller_data', JSON.stringify(a));
        }

        // Ugly hack, it seem that the data are not in the good shape when the user is already know
        // The best thing is to get a function that return the user inside a promise but we have nothing here to handle this kind of thing
        // so we just get the number...
        if (typeof(a) == "number") {
          a = {number: self.find(".phone").text()};
          sessionStorage.setItem('client_caller_data', JSON.stringify(a));
        }

        if (a !== false && a != undefined) {
            var html = ($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
                return a.toUpperCase();
            }) + ' Order';
            if (a.name != undefined && a.name != '') {
                $('#client-details-container').html(html + ' for ' + a.name);
            } else {
                $('#client-details-container').html(html + ' for ' + formatPhoneNumber(a.number));
            }
        } else {
            $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
                return a.toUpperCase();
            }) + ' Order');
        }
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');


        if (self.data('order-type')) {
            $('#accordeon-order-types-list').find('a[data-id="' + self.data('order-type') + '"]').trigger('click');
        }

        $.sidr('close', 'sidr-orders');

    }

    $('#trigger-options').sidr({
        displace: false,
        name: 'sidr-options',
        source: '#sidr-product-options',
        side: 'right',
        renaming: false,
        speed: 200,
        onOpen: function() {
            $("#sidr-options").scrollTop(0);
            $('#fulloverflow').removeClass('hide');
            console.log('after fulloverflow - very end');

        },
        onClose: function() {
            $('#fulloverflow').addClass('hide');
        }
    });

    $('#fulloverflow').on('click', function() {
        $.sidr('close', 'sidr-orders');
        if (!$('#sidr-categories').is(':visible') || !$('#sidr-orders').is(':visible'))
        {
            resetSearch();
            $.sidr('close', 'sidr-options');
            if ($(window).width() <= '800') { //VV 815?
                $.sidr('close', 'sidr-categories');
            }
        }

    });



    /*
     * Collects ID of orders which should be voided and does manipulations with db
     * @returns {undefined}c
     */
    function  markingSelectedOrdersAsVoided() {

        var idOfItemsToVoid = [];
        $.each($('.closed-orders-popup.selected_for_deletion'), function() {
            idOfItemsToVoid.push($(this).attr('data-id'));
        });

        if (idOfItemsToVoid.length > 0) {

            var sy = new syncHandler(),
                    db = sy.getDbInstance();

            for (var i = 0; i < idOfItemsToVoid.length; i++) {
//
                var idOfOrder = parseInt(idOfItemsToVoid[i]);
//                alert(idOfOrder);

                (function(idOfOrder, i, totalLength) {
//
                    db.transaction(function(tx) {
                        tx.executeSql(
                                'UPDATE "orders" SET "voided"   =? WHERE "id"=?',
                                [1, idOfOrder],
                                function(tx, results) {
//                                    console.log('voided ' + idOfOrder);
//                                    alert("updating");

                                    if (i == totalLength - 1) {
//
                                        updateSqlPosOrdersData();
                                    }
                                },
                                function(a, b) {
                                    console.warn(a);
                                    console.warn(b);
                                }
                        );
                    });
                })(idOfOrder, i, idOfItemsToVoid.length);

            }
            ;

        }

    }


    function updateSqlPosOrdersData() {

        var _sy = new syncHandler(),
                _db = _sy.getDbInstance();

        _db.transaction(function(tx) {

            tx.executeSql('SELECT *  FROM orders', [], function(tx, response) {

//
//                    console.log("sending request");
//                    var value = response;
//                var ds = response;
//

                var dataToPush = [];
                for (var i = 0; i < response.rows.length; i++) {
                    dataToPush.push(response.rows.item(i));
                }


                _sy.pushData('pos_orders', dataToPush);

            });
        });

    }

    //$(document).on('click', '.close-sidr, .sidr-class-close-sidr, .sidr-categories, .btn-close-sidr-left', function() {
    $(document).on('click', '.sidr-class-close-sidr, .sidr-categories, .btn-close-sidr-left', function() {



        if ($.trim($('.btn-close-sidr-left').text()) == textDeleteOrder) {

            if (globalSettings.getOnlineState()) {

                console.log("deletion");
                markingSelectedOrdersAsVoided();
            } else {
                alert("Sorry, orders cannot be deleted when device is offline");
            }

            $('.btn-close-sidr-left').text(textCloseOrder);

        } else {
            console.log("usual closing");
        }

        $('#trigger-cartadd').hide();
        $('#sidr-' + $(this).data('target')).find('.btn-close-sidr-left').hide();
        $.sidr('close', 'sidr-' + $(this).data('target'));
        resetSearch();

//

//        $.each( response.orders, function(i,val) { console.log(response.orders[i].voided);  } );

//        setTimeout(function() {
//            updateSqlPosOrdersData();
//        }, 2000);

        /*
         if($(this).data('target') == 'orders' && $('#sidr-categories').is(':visible'))
         {
         $('#fulloverflow').addClass('hide');
         $('#sidr-orders').hide();
         //$.sidr('close', 'sidr-'+$(this).data('target'));
         //setTimeout(function(){$.sidr('close', 'sidr-categories');}, 200);
         //setTimeout(function(){$.sidr('open', 'sidr-categories');}, 500);
         }
         else
         {
         $.sidr('close', 'sidr-'+$(this).data('target'));
         }
         */
    });

    $('#modal-switch-users').on('show.bs.modal', function() {
        $('#change-user-modal').modal('hide');
    });


    // double tap implemented
    $("#trigger-settings")
            .hammer()
            .on('tap', function() {
                // Refactored this bullshit implementation to work as it should

//                alert("first");
                // TRICKY: Added 300ms timeout to capture the doubletap if the time between clicks is grater then 300ms then is a tap
                if (document['globalDoubleTap'] == undefined) {
                    document['globalDoubleTap'] = 1;
                } else {
                    document['globalDoubleTap'] = parseInt(document['globalDoubleTap']) + 1;
                }
                setTimeout(function() {
                    if (document['globalDoubleTap'] == 1) {
                        $('#change-user-modal').modal('show');
                    }
                    document['globalDoubleTap'] = 0;
                }, 300);



            })
            .on("doubletap", function(ev) {


//                alert("hereerre");


                var sy = new syncHandler(),
                        db = sy.getDbInstance(),
                        data = {}, html,
                        template = $('#ui-settings-modal-switch').html();

                /* Format view based on user settings */
                data['default_printer'] = globalSettings.getDefaultPrinter();
                data['online_offline'] = globalSettings.getOnlineState();
                data['show_called_id'] = globalSettings.getShowCall();
                data['tab_collapsed'] = globalSettings.getTabCollapsed();


                data['category_collapsed'] = globalSettings.getCategoryCollapsed();
                data['bash_script'] = globalSettings.getBashScript();
                data['defaultPrice'] = globalSettings.getDefaultPrice();
                data['simple_display'] = globalSettings.getSimpleDisplay();//VV
                data['show_alphascroll'] = globalSettings.getAlphaScroll();//VV



                data['default_drawer_kick_open_print'] = globalSettings.getDefaultDrawer();
                data['drawer_show_kick_open'] = (localStorage.getItem('drawer_show_kick_open') === "true");
                data['default_manager_printer'] = globalSettings.getDefaultManagersPrinter();
                data['print_park_order'] = globalSettings.getPrintParkOrder();
//                data['customers_copies'] = globalSettings.getCustomersCopiesNumber();



                db.transaction(function(tx) {
                    //tx.executeSql('SELECT * FROM "balances" WHERE "date" = strftime("%Y-%m-%d","now")',[], function(tx, results){
                    tx.executeSql('SELECT value, type, id FROM balances WHERE type IN ("open_tilt", "close_tilt") ORDER by value DESC LIMIT 2', [], function(tx, results) {
                        data['money_in'] = '';
                        data['money_in_exists'] = false;
                        data['cc_in'] = '';
                        data['cc_in_exists'] = false;
                        data['eod_exists'] = false;
                        data['balance_cash'] = 0;
                        data['balance_cc'] = 0;



                        if (results.rows.length > 0)
                        {

                            var whereBalance = '1=0',
                                    whereOrder = '1=0';
                            //tilt closed, can open
                            if (results.rows.item(0).type == 'close_tilt')
                            {
                                $('#ui-settings-modal-tilt-close-button').addClass('hide');
                                $('#ui-settings-modal-tilt-open-button').removeClass('hide');
                                //whereBalance = 'id <= ' + results.rows.item(0).id + ' AND id >= ' + results.rows.item(1).id;
                                whereBalance = '1=0';
                                whereOrder = 'date <= strftime("%Y-%m-%d %H:%M:%S", datetime(' + results.rows.item(0).value + ', "unixepoch")'
                                        + ') AND date >= strftime("%Y-%m-%d %H:%M:%S", datetime(' + results.rows.item(1).value + ', "unixepoch"))';
                            }
                            else
                            {
                                $('#ui-settings-modal-tilt-open-button').addClass('hide');
                                $('#ui-settings-modal-tilt-close-button').removeClass('hide');
                                whereBalance = 'id >= ' + results.rows.item(0).id;
                                whereOrder = 'date >= strftime("%Y-%m-%d %H:%M:%S", datetime(' + results.rows.item(0).value + ', "unixepoch"))';
                            }

                            tx.executeSql('SELECT * FROM "balances" WHERE ' + whereBalance, [], function(tx, results) {

                                if (results.rows.length > 0)
                                {
                                    for (var i = 0; i < results.rows.length; i++)
                                    {
                                        data[results.rows.item(i).type] = results.rows.item(i).value;
                                        data[results.rows.item(i).type + '_exists'] = true;
                                    }
                                }
                                tx.executeSql('SELECT SUM("total") AS "total", "taxes"."type" FROM "orders" JOIN "taxes" ON "taxes"."id" = "orders"."pay_type" WHERE ' + whereOrder + ' GROUP BY "taxes"."type"', [], function(tx, results) {

                                    if (results.rows.length > 0) {
                                        for (var i = 0; i < results.rows.length; i++) {
                                            data[results.rows.item(i).type] = results.rows.item(i).total;
                                        }
                                    }

                                    data['balance'] = 0;

                                    if (data['money_in'] != '') {
                                        data['balance'] = parseFloat(data['balance']) + parseFloat(data['money_in']);
                                        data['balance_cash'] = parseFloat(data['balance_cash']) + parseFloat(data['money_in']);
                                    }

                                    if (data['cc_in'] != '') {
                                        data['balance'] = parseFloat(data['balance']) + parseFloat(data['cc_in']);
                                        data['balance_cc'] = parseFloat(data['balance_cc']) + parseFloat(data['cc_in']);
                                    }

                                    if (data['cash'] != undefined) {
                                        data['balance_cash'] = parseFloat(data['balance_cash']) + parseFloat(data['cash']);
                                    } else {
                                        data['cash'] = 0.00;
                                    }

                                    if (data['creditcard'] != undefined) {
                                        data['balance_cc'] = parseFloat(data['balance_cc']) + parseFloat(data['creditcard']);
                                    } else {
                                        data['creditcard'] = 0.00;
                                    }

                                    data['balance'] = data['balance'].toFixed(2);

                                    data['balance_exists'] = !(data['balance'] > 0);

                                    data['printers'] = [];
                                    data['printer_drawer_kick_open'] = [];
                                    data['manager_printer'] = [];
//

                                    data['printer_drawer_kick_open'].push({
                                        'id': 0,
                                        'name': 'None',
                                        'selected': false
                                    });

                                    data['manager_printer'].push({
                                        'id': 0,
                                        'name': 'None',
                                        'selected': false
                                    });

                                    data['printers'].push({
                                        'id': 0,
                                        'name': 'None',
                                        'selected': false
                                    });


                                    data['customers_copies'] = [];
                                    var NUMBER_OF_COPIES = 3;
                                    for (var i = 1; i <= NUMBER_OF_COPIES; i++) {

                                        if (globalSettings.getCustomersCopiesNumber() == i) {
                                            data['customers_copies'].push({
                                                'id': i,
                                                'selected': true
                                            });
                                        } else {
                                            data['customers_copies'].push({
                                                'id': i,
                                                'selected': false
                                            });
                                        }

                                    }


                                    tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function(tx, results) {
//                                    tx.executeSql('SELECT * FROM "printers"', [], function (tx, results) {



                                        for (var i = 0; i < results.rows.length; i++) {
                                            data['printers'].push({
                                                'id': results.rows.item(i).id,
                                                'name': results.rows.item(i).printer_name,
                                                'selected': (results.rows.item(i).id == data['default_printer'])
                                            });

//
                                            data['printer_drawer_kick_open'].push({
                                                'id': results.rows.item(i).id,
                                                'name': results.rows.item(i).printer_name,
                                                'selected': (results.rows.item(i).id == data['default_drawer_kick_open_print'])
                                            });


                                            data['manager_printer'].push({
                                                'id': results.rows.item(i).id,
                                                'name': results.rows.item(i).printer_name,
                                                'selected': (results.rows.item(i).id == data['default_manager_printer'])
                                            });

                                        }


                                        data['scripts'] = [
                                            {
                                                'id': 'no',
                                                'name': 'No script',
                                                'selected': ('no' == data['bash_script'])
                                            },
                                            {
                                                'id': 'scriptA',
                                                'name': 'Script A',
                                                'selected': ('scriptA' == data['bash_script'])
                                            },
                                            {
                                                'id': 'scriptB',
                                                'name': 'Script B',
                                                'selected': ('scriptB' == data['bash_script'])
                                            }

                                        ];

                                        //VV for now the IPs are hardoceded here. TODO: read from dbs
                                        data['simple_display'] = [
                                            {
                                                'id': 'None',
                                                'name': 'None',
                                                'selected': ('None' == data['simple_display'])
                                            },
                                            {
                                                'id': '192.168.99.100:5555',
                                                'name': '1',
                                                'selected': ('192.168.99.100:5555' == data['simple_display'])
                                            },
                                            {
                                                'id': '192.168.99.101:5555',
                                                'name': "2",
                                                'selected': ('192.168.99.101:5555' == data['simple_display'])
                                            },
                                            {
                                                'id': '192.168.99.102',
                                                'name': '3',
                                                'selected': ('192.168.99.102:5555' == data['simple_display'])
                                            }
                                        ];


//                                         data['drawer_kick_open']

                                        tx.executeSql('SELECT name, value FROM "settings" WHERE name LIKE "button%" ', [], function(tx, results) {
                                            var tmpButtonOptions = {},
                                                    buttonsOptions = [];

//
                                            var arr = [];

                                            for (var i = 0; i < results.rows.length; i++) {
                                                tmpButtonOptions[results.rows.item(i).name] = results.rows.item(i).value;

                                                arr.push(results.rows.item(i).value);
                                            }
                                            for (var i in tmpButtonOptions)
                                            {
                                                if (i.indexOf('_enable') != -1)
                                                {
                                                    if (tmpButtonOptions[i] == 1)
                                                    {
                                                        var t = i.split('_');
                                                        if (typeof (t[2]) !== 'undefined' && t[2] == 'enable')
                                                        {
                                                            buttonsOptions.push({'id': 'price', 'name': tmpButtonOptions['button_price_label'], 'selected': (data['defaultPrice'] == 'price')});
                                                        }
                                                        else
                                                        {
                                                            buttonsOptions.push({'id': 'price' + t[2], 'name': tmpButtonOptions['button_price_' + t[2] + '_label'], 'selected': (data['defaultPrice'] == 'price' + t[2])});
                                                        }
                                                    }
                                                }
                                            }

                                            data['prices'] = buttonsOptions;
                                            if (thisUser.dayfunctions == 1) {
                                                $('#admin-open-close-tilt').removeClass('hide');
                                            } else {
                                                $('#admin-open-close-tilt').addClass('hide');
                                            }





//
                                            html = Mustache.to_html(template, data);

                                            $('#ui-close-tilt-modal-open-balance').html(parseFloat(data['money_in']).toFixed(2));
                                            $('#ui-settings-modal-money-in').val(parseFloat(data['money_in']).toFixed(2));
                                            $('#ui-close-tilt-modal-money-in').html(parseFloat(data['cash']).toFixed(2));

                                            $('#ui-settings-modal-cc-in').val(parseFloat(data['cc_in']).toFixed(2));
                                            $('#ui-close-tilt-modal-cc-in').html(parseFloat(data['creditcard']).toFixed(2));

                                            $('#ui-close-tilt-modal-subtotal').html((parseFloat(data['cash']) + parseFloat(data['creditcard'])).toFixed(2));


                                            $('#ui-close-tilt-modal-grant').html((parseFloat(data['cash']) + parseFloat(data['creditcard']) + parseFloat(data['money_in'])).toFixed(2));

                                            $('#ui-settings-modal-container').html(html);


                                            $('#ui-settings-modal').modal('show');

                                            data['printers'].shift();
                                            $('#ui-settings-printers').html(Mustache.to_html($('#ui-settings-printers-template').html(), data));

                                        });

                                    });
                                });
                            });
                        }
                        /*
                         if (results.rows.length > 0) {
                         for (var i=0;i<results.rows.length;i++) {
                         data[results.rows.item(i).type] = results.rows.item(i).value;
                         data[results.rows.item(i).type + '_exists'] = true;
                         }
                         $('#ui-settings-modal-tilt-open-button').addClass('hide');
                         $('#ui-settings-modal-tilt-close-button').removeClass('hide');
                         } else {
                         $('#ui-settings-modal-tilt-close-button').addClass('hide');
                         $('#ui-settings-modal-tilt-open-button').removeClass('hide');
                         }
                         */

                        //tx.executeSql('SELECT SUM("total") AS "total", "taxes"."type" FROM "orders" JOIN "taxes" ON "taxes"."id" = "orders"."pay_type" WHERE date > strftime("%Y-%m-%d","now") GROUP BY "taxes"."type"', [], function(tx, results){

                    });
//            });


                });



            });

    // old use with taphold - replaced with doubletap above
    if (0) {
        $("#trigger-settings").on("taphold", {
            clickHandler: function() {
                $('#change-user-modal').modal('show');
            }
        }, function() {

            var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    data = {}, html,
                    template = $('#ui-settings-modal-switch').html();

            /* Format view based on user settings */
            data['default_printer'] = globalSettings.getDefaultPrinter();
            data['online_offline'] = globalSettings.getOnlineState();
            data['show_called_id'] = globalSettings.getShowCall();
            data['tab_collapsed'] = globalSettings.getTabCollapsed();

//            console.log(data);

            db.transaction(function(tx) {
//            tx.executeSql('SELECT * FROM "user_settings" WHERE "user_id"=?',[myCart.getActiveUser()],function(tx, results){
//                for (var i=0;i<results.rows.length;i++) {
//                    if ('default_printer' != results.rows.item(i).setting) {
//                        data[results.rows.item(i).setting] = (results.rows.item(i).value === 'on');
//                    } else {
//                        data[results.rows.item(i).setting] = results.rows.item(i).value;
//                    }
//                }

                tx.executeSql('SELECT * FROM "balances" WHERE "date" = strftime("%Y-%m-%d","now")', [], function(tx, results) {
                    data['money_in'] = '';
                    data['money_in_exists'] = false;
                    data['cc_in'] = '';
                    data['cc_in_exists'] = false;
                    data['eod_exists'] = false;
                    data['balance_cash'] = 0;
                    data['balance_cc'] = 0;

                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            data[results.rows.item(i).type] = results.rows.item(i).value;
                            data[results.rows.item(i).type + '_exists'] = true;
                        }
                        $('#ui-settings-modal-tilt-open-button').addClass('hide');
                        $('#ui-settings-modal-tilt-close-button').removeClass('hide');
                    } else {
                        $('#ui-settings-modal-tilt-close-button').addClass('hide');
                        $('#ui-settings-modal-tilt-open-button').removeClass('hide');
                    }

                    tx.executeSql('SELECT SUM("total") AS "total", "taxes"."type" FROM "orders" JOIN "taxes" ON "taxes"."id" = "orders"."pay_type" WHERE date > strftime("%Y-%m-%d","now") GROUP BY "taxes"."type"', [], function(tx, results) {

                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                data[results.rows.item(i).type] = results.rows.item(i).total;
                            }
                        }
                        data['balance'] = 0;

                        if (data['money_in'] != '') {
                            data['balance'] = parseFloat(data['balance']) + parseFloat(data['money_in']);
                            data['balance_cash'] = parseFloat(data['balance_cash']) + parseFloat(data['money_in']);
                        }

                        if (data['cc_in'] != '') {
                            data['balance'] = parseFloat(data['balance']) + parseFloat(data['cc_in']);
                            data['balance_cc'] = parseFloat(data['balance_cc']) + parseFloat(data['cc_in']);
                        }

                        if (data['cash'] != undefined) {
                            data['balance_cash'] = parseFloat(data['balance_cash']) + parseFloat(data['cash']);
                        } else {
                            data['cash'] = 0.00;
                        }

                        if (data['creditcard'] != undefined) {
                            data['balance_cc'] = parseFloat(data['balance_cc']) + parseFloat(data['creditcard']);
                        } else {
                            data['creditcard'] = 0.00;
                        }

                        data['balance'] = data['balance'].toFixed(2);

                        data['balance_exists'] = !(data['balance'] > 0);

                        data['printers'] = [];

                        tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function(tx, results) {
//                        tx.executeSql('SELECT * FROM "printers"', [], function (tx, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                data['printers'].push({
                                    'id': results.rows.item(i).id,
                                    'name': results.rows.item(i).printer_name,
                                    'selected': (results.rows.item(i).id == data['default_printer'])
                                });
                            }


                            if (thisUser.dayfunctions == 1) {
                                $('#admin-open-close-tilt').removeClass('hide');
                            } else {
                                $('#admin-open-close-tilt').addClass('hide');
                            }

                            $('#ui-settings-printers').html(Mustache.to_html($('#ui-settings-printers-template').html(), data));
                            html = Mustache.to_html(template, data);

                            $('#ui-close-tilt-modal-open-balance').html(parseFloat(data['money_in']).toFixed(2));
                            $('#ui-settings-modal-money-in').val(parseFloat(data['money_in']).toFixed(2));
                            $('#ui-close-tilt-modal-money-in').html(parseFloat(data['cash']).toFixed(2));

                            $('#ui-settings-modal-cc-in').val(parseFloat(data['cc_in']).toFixed(2));
                            $('#ui-close-tilt-modal-cc-in').html(parseFloat(data['creditcard']).toFixed(2));

                            $('#ui-close-tilt-modal-subtotal').html((parseFloat(data['cash']) + parseFloat(data['creditcard'])).toFixed(2));



                            $('#ui-close-tilt-modal-grant').html((parseFloat(data['cash']) + parseFloat(data['creditcard']) + parseFloat(data['money_in'])).toFixed(2));

                            $('#ui-settings-modal-container').html(html);

                            $('#ui-settings-modal').modal('show');
                        });
                    });





                });



//            });
            });
        }
        );
    }

    // change user modal start
//    $('#trigger-settings')
////    .on('click',function() {
////        $('#change-user-modal').modal('show');
////    })
//        .on('click',function(e) {
////            console.log('clicked');
//
//    });

    $(document).on('keyup change', '#ui-settings-modal-money-in, #ui-settings-modal-cc-in', function() {
        var mi = parseFloat($('#ui-settings-modal-money-in').val());
        var ci = parseFloat($('#ui-settings-modal-cc-in').val());

        if (mi == null || $('#ui-settings-modal-money-in').val() == '')
            mi = 0;
        if (ci == null || $('#ui-settings-modal-cc-in').val() == '')
            ci = 0;

        var t = mi + ci;

        $('#ui-settings-modal-balance').val(t.toFixed(2));
    });

    $('#change-user-modal').on('show.bs.modal', function(e) {
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                data = [],
                activeUser = myCart.getActiveUser();

        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM "users" WHERE "id"=?', [activeUser], function(tx, results) {
                data = $.extend({}, results.rows.item(0));

                var html = Mustache.to_html($('#change-user-modal-template').html(), data);
                $('#change-user-modal-container').html(html);
                if (globalSettings.getOnlineState())
                {
                    $('#logout-user-trigger').prop('disabled', false).removeClass('disabled');
                    $('#logout-offline-text').addClass('hide');
                }
                else
                {
                    $('#logout-user-trigger').prop('disabled', true).addClass('disabled');
                    $('#logout-offline-text').removeClass('hide');
                }

            }, function() {
                var sy = new syncHandler();
                sy.dropDatabase();
            })
        });
    });

    $(document).on('click', '#logout-user-trigger', function() {

        cleanLocalStorageFromItems();
//        alert("dropping1 ");
// cleaning item is in cart and logging out - one more situation , necessary for resetting state of price group buttons
        myCart.clearCart();

        var sy = new syncHandler();
        sy.dropDatabase(true);
    });
    // change user modal end

    /**
     * User settings printer
     */

    $(document).on('change', '#user-setting-default-printer', function() {

        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                value = $(this).val();

        globalSettings.setDefaultPrinter(value);

//        db.transaction(function(tx){
//            tx.executeSql('UPDATE "user_settings" SET "value"=? WHERE "user_id"=? AND "setting"=?',[
//                value,
//                myCart.getActiveUser(),
//                'default_printer'
//            ])
//        });
    });



    $(document).on('change', '#user-setting-default-manager-printer', function() {

        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                value = $(this).val();

//        globalSettings.setDefaultPrinter(value);
        globalSettings.setDefaultManagersPrinter(value);

//        db.transaction(function(tx){
//            tx.executeSql('UPDATE "user_settings" SET "value"=? WHERE "user_id"=? AND "setting"=?',[
//                value,
//                myCart.getActiveUser(),
//                'default_printer'
//            ])
//        });
    });


    $(document).on('change', '#user-setting-default-customer_docket_number_of_copies', function() {
        var val = $('#user-setting-default-customer_docket_number_of_copies').find(':selected').text();

        globalSettings.setCustomersCopiesNumber(val);
    })

    $(document).on('change', '#user-setting-default-drawer', function() {
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                value = $(this).val();


//     alert("draewer changed  " + value);
//        localStorage.setItem('default_drawer_kick_open_print', value);
//        globalSettings.setDefaultPrinter(value);
        globalSettings.setDefaultDrawer(value);


//        db.transaction(function(tx){
//            tx.executeSql('UPDATE "user_settings" SET "value"=? WHERE "user_id"=? AND "setting"=?',[
//                value,
//                myCart.getActiveUser(),
//                'default_printer'
//            ])
//        });
    });

//    user-setting-default-drawer



    $(document).on('change', '#user-setting-default-script', function() {
        globalSettings.setBashScript($(this).val());
    });

    $(document).on('change', '#user-setting-simple-display', function() { //VV
        globalSettings.setSimpleDisplay($(this).val());
    });

    $(document).on('change', '#user-setting-default-price', function() {
        globalSettings.setDefaultPrice($(this).val());
        $('.price-type-action').removeClass('active');

        $('.price-type-action[data-price="' + globalSettings.getDefaultPrice() + '"]').addClass('active').trigger('click');
    });





    $(".action-checkout").on("taphold", {
        clickHandler: function() {
//                console.log('checked');
//        alert("clicked again");

            creditCardFeeStorage.feeWasAdded = 0;
            creditCardFeeStorage.priceBeforeFee = 0;
            creditCardFeeStorage.initialPriceForCredicardFeePrinting = 0;
            creditCardFeeStorage.priceBeforeSelectField = 0;



//            creditCardFeeStorage.priceBeforeFee

            if (globalSettings.getOnlineState() == false)
            {
                alert("Sorry, you can't checkout because your device is offline. You can however park the order and checkout later when you are online")
                return false;
            }

            if (myCart.getItemsNo() > 0)
            {
                if (globalSettings.getTiltOpened() && globalSettings.getTiltOpened() != "false")
                {
                    $('#modal-checkout-type').modal('show');

                }
                else
                {
                    alert('You should open till');
                }

            }
            else
            {
                alert('No product in cart');
            }

//            alert("set");
//            myCart.setTotal($('#cart-total').text());
//          creditCardFeeStorage.feeWasAdded = 0;
//          creditCardFeeStorage.priceBeforeFee = 0;
//          creditCardFeeStorage.initialPriceForCredicardFeePrinting = 0;
//          creditCardFeeStorage.addedFee = 0;

        }

    }, function() {

        $('#collapse-order').collapse('toggle');

    }
    );

    /*
     Handle Checkout Type
     */
    $('.btn-checkout-type').on('click', function() {


        $('#modal-checkout-type').modal('hide');
        if ($(this).data('value') == 'takeway') {
            $('#modal-checkout-takeway').modal('show').find('input, select, textarea').val('');
        } else {
            $('#modal-checkout-delivery').modal('show').find('input, select').val('');
        }

    });




    $('#modal-discount').on('show.bs.modal', function(e) {
        $('#modal-custom-orders-printers').addClass('hidden');
        $('#checkbox_hide_printers_custom_items_controller').addClass('hidden');
        $('.disc-product-inc').removeClass('active');

        custom_add_button.setInactive();
    })


    $('#modal-discount').on('shown.bs.modal', function(e) {

        var sy = new syncHandler(),
                db = sy.getDbInstance();



        $('#discValue').val('');
        $('#miscDescription').val('');

        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM "discount_codes"', [], function(tx, results) {
                var tmp = [],
                        template = $('#discount-codes-template').html(),
                        data = [];

                for (var i = 0; i < results.rows.length; i++) {
                    tmp.push(results.rows.item(i));
                    if ((i + 1) % 3 == 0) {
                        data.push({'list': tmp});
                        tmp = [];
                    }
                }
                if (tmp.length > 0) {
                    data.push({'list': tmp});
                }

                var html = Mustache.to_html(template, {'codes': data});
                $('#discount-codes-list').html(html).find('.discount-code-button').each(function() {
                    $(this).off('click').on('click', function(e) {
                        e.preventDefault();

                        resetPrintersOfCustomItems();

                        var $e = $(this);

                        document.dst = $e.data('percent');

                        myCart.addItem({
                            id: 'discount',
                            price: 0,
                            name: $e.data('description'),
                            qty: 1,
                            percent: $e.data('percent')
                        }, false, true);

                        updateCartElements();

                        $('#modal-discount').modal('hide');


                        return false;
                    });
                });

                $('.disc-product-inc').off('click').on('click', function() {
                    var a = $(this).data('val'),
                            b = $('#discValue').val();

                    b = b.replace('-$', '');
                    b = b.replace('$', '');
                    b = b.replace('-', '');
                    b = b.replace('+', '');
                    b = b.replace('%', '');
//                    console.log(a, b);





                    switch (a) {
                        case 'del':
                            b = b.slice(0, -1);
                            if (b.length > 0) {
                                if ($('.disc-product-inc[data-val!="del"]').hasClass('active')) {
                                    b = '-$' + b;
                                }
                                if ($('.disc-product-inc[data-val!="del"]').hasClass('active')) {
                                    b += '%';
                                }
                            }

                            break;
                        case '-$':
                            $(this).addClass('active');
                            $('.disc-product-inc[data-val!="-$"]').removeClass('active');
                            if (b.length > 0) {
                                b = '-$' + b;
                            }
                            setPrintersForCustomItems();
                            break;
                        case '+$':
                            $(this).addClass('active');
                            $('.disc-product-inc[data-val!="+$"]').removeClass('active');
                            if (b.length > 0) {
                                b = '$' + b;
                            }

                            setPrintersForCustomItems();
                            break;
                        case '-%':
                            $(this).addClass('active');
                            $('.disc-product-inc[data-val!="-%"]').removeClass('active');
                            if (b.length > 0) {
                                b = '-' + b + '%';
                            }
                            resetPrintersOfCustomItems();
                            break;
                        case '+%':
                            $(this).addClass('active');
                            $('.disc-product-inc[data-val!="+%"]').removeClass('active');
                            if (b.length > 0) {
                                b = b + '%';
                            }

                            resetPrintersOfCustomItems();
                            break;
                        default:

                            b = b + '' + a;
                            if ($('.disc-product-inc[data-val="-$"]').hasClass('active')) {
                                b = '-$' + b;
                            }
                            if ($('.disc-product-inc[data-val="+$"]').hasClass('active')) {
                                b = '$' + b;
                            }
                            if ($('.disc-product-inc[data-val="+%"]').hasClass('active')) {
                                b += '%';
                            }
                            if ($('.disc-product-inc[data-val="-%"]').hasClass('active')) {
                                b = '-' + b + '%';
                            }



                            break;
                    }
//                    disc-product-inc

                    console.log(a, b);
                    $('#discValue').val(b)

                    custom_add_button.setActive();
                });

                $('#modal-custom-orders-printers').off('click').on('click', '.btn', function() {
//                    alert("fdjnfdjkdf");

                    setTimeout(function() {
                        Custom_Add_Button.prototype.setActive();
                    }
                    , 0);
                })


                $('#modal-custom-orders-printers').children().on('click', function() {

                    $('.btn-printer-custom_orders').attr('data-count', 0);
                    setTimeout(function() {
                        $('#modal-custom-orders-printers').find('label.active').children().attr('data-count', 1);
                    }, 0);

                })



                $('#disc-product-add').off('click').on('click', function() {



                    var t,
                            val = $('#discValue').val(),
                            item = false,
                            description = $('#miscDescription').val();
                    if (val == '')
                    {
                        return;
                    }
                    val = val.replace('-$', '');
                    val = val.replace('$', '');
                    val = val.replace('-', '');
                    val = val.replace('+', '');
                    val = val.replace('%', '');

                    if ($('.disc-product-inc[data-val="+%"]').hasClass('active')) {
                        item = {
                            id: 'extraCharge',
                            price: 0,
                            //name: 'Discount ' + parseFloat(val) + '%',
                            name: (description != '') ? description : 'Manual Discount/Extra Charge ' + $('#discValue').val(),
                            qty: 1,
                            percent: val,
                            is_discount: true,
                        };
                    }
                    if ($('.disc-product-inc[data-val="-%"]').hasClass('active')) {
                        item = {
                            id: 'discount',
                            price: 0,
                            //name: 'Discount ' + parseFloat(val) + '%',
                            name: (description != '') ? description : 'Manual Discount/Extra Charge ' + $('#discValue').val(),
                            qty: 1,
                            percent: val,
                            is_discount: true
                        };
                    }
                    if ($('.disc-product-inc[data-val="-$"]').hasClass('active')) {



//                        var idOfItem = getIdForCustomItem();
//                        console.log(idOfItem);

                        item = {
                            id: 'misc-disc-' + val,
//                            id: idOfItem,
//                            idNumerical: idOfItem,
                            price: 0 - parseFloat(val),
                            //name: 'Discount -$' + parseFloat(val),
                            name: (description != '') ? description : 'Manual Discount/Extra Charge ' + $('#discValue').val(),
                            qty: 1,
                            is_discount: true,
                        };
                    }
                    if ($('.disc-product-inc[data-val="+$"]').hasClass('active')) {




//                        var idOfItem = getIdForCustomItem();
//                        console.log(idOfItem);

                        item = {
                            id: 'misc-disc-' + val,
//                            idNumerical: idOfItem,
                            price: 0 + parseFloat(val),
                            //name: 'Discount -$' + parseFloat(val),
                            name: (description != '') ? description : 'Manual Discount/Extra Charge ' + $('#discValue').val(),
                            qty: 1,
                            is_discount: true,
                        };
                    }


                    if (item) {
                        item['temp_unique_id'] = getUniqueID();
                        myCart.addItem(item, false, true);
                        updateCartElements();
                        $('.order-list-name:first').effect("highlight", {}, 3000); //VV
                    }
                    else {

                    }
                });
            });
        });
    });


    $('#modal-park-order').on('hidden.bs.modal', function(e) {
        resetTimeButtons(); //VV
    })

    $('#modal-checkout-type').on('hidden.bs.modal', function(e) {

        showDisplay("", "", "clear_immediatelly"); //VV
        resetTimeButtons(); //VV
        setNumberOfCopiesForCustomersDocket(false, false, true);
    })


    $('#modal-checkout-type').on('show.bs.modal', function(e)
    {
        $('#modal-checkout-type-pay-phone-button').tab('show'); //VV select Pay Now tab TEMP SOLUTION - TODO

        //VV HACK  - hide 'Don't Know Yet'; to be removed - TODO
        HideDontKnowYet();




       if ( $("#delivery-type-later-datepicker").data('datetimepicker').isVisible || $('#takeaway-type-later-datepicker').data('datetimepicker').isVisible ) {
            return;
        }

        setPriceTotal(myCart.getTotal());

        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                note = $('#global-note-holder').val();

//
        if (typeof note == "undefined" && $.trim($('#parking_order_note')) != '') {
            note = $('#parking_order_note').val();
        }

        var nameOfTable = getTableForOrder();
//        if (nameOfTable == nonNumericalTables[1]) {
//            console.log("should select delivery tab");
//            $('#modal-checkout-type-nav a:last').tab('show');
//        }


        if (note == '') {
            getNote();
        }
        // initial reset
        var $t = $(this);
        $t.find('input[type="text"]').val('');
        $t.find('input[type="number"]').val('');
        $t.find('#takeaway-note').val(note);
        $t.find('#delivery-note').val(note);
//        $t.find('#takeaway-nav-pay li:nth-child(2) a').tab('show');
//        $t.find('#delivery-nav-pay li:nth-child(3) a').tab('show');

        $('#id_customers_docket').parent().removeClass('active');
        $('#id_kitchen_docket').parent().addClass('active');


        $('#id_customers_docket_delivery').parent().removeClass('active');
        $('#id_kitchen_docket_delivery').parent().addClass('active');

        if (sessionStorage.getItem('order_type_action') == 'delivery' || nameOfTable == nonNumericalTables[1]) {
            $t.find('#modal-checkout-type-nav a:last').tab('show');
        } else {
            $t.find('#modal-checkout-type-nav a:first').tab('show');
        }
        $('#modal-checkout-delivery-phone').data('idUser', 0);

        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM "taxes" WHERE "active"=?', ['1'], function(tx, results) {
                var tax = [],
                        tax_pickup = [],
                        tax_template = $('#payment-types-list').html(),
                        tax_fee,
                        tables = {};

                for (var i = 0; i < results.rows.length; i++) {
                    tax_fee = ' ';
                    if (results.rows.item(i).percent_fee > 0) {
                        tax_fee += ((results.rows.item(i).percent_fee + '').substr(0, 1) == '0'
                                ? (results.rows.item(i).percent_fee + '').slice(1)
                                : results.rows.item(i).percent_fee)
                                + '%';
                    }
                    if (results.rows.item(i).fixed_fee > 0) {
                        tax_fee += ' +$' + results.rows.item(i).fixed_fee;
                    }

                    //

                    if (results.rows.item(i).type == 'cash') {
                        updatingCashPrice.defaultCacheName = results.rows.item(i).name;
                    }

                    tax.push({
                        'id': results.rows.item(i).id,
                        'name': results.rows.item(i).name,
                        'tax': tax_fee
                    });
                    if (results.rows.item(i).type != 'cash') {
                        tax_pickup.push({
                            'id': results.rows.item(i).id,
                            'name': results.rows.item(i).name,
                            'tax': tax_fee
                        });
                    }
                }

                var pay_dine_in = Mustache.to_html(tax_template, {'list': tax, 'type': 'dinein'});
                var pay_takeout = Mustache.to_html(tax_template, {'list': tax, 'type': 'takeout'});

//
                $('#pay_now_buttons').html(pay_dine_in);
                $('#modal-checkout-delivery-payment-types').html(pay_takeout);



                var will_pay_dine_in = Mustache.to_html(tax_template, {'list': tax, 'type': 'dinein'});
                var will_pay_takeout = Mustache.to_html(tax_template, {'list': tax, 'type': 'takeout'});
                var will_pay_delivery = Mustache.to_html(tax_template, {'list': tax, 'type': 'takeout'});


                $('#will_pay_on_pickup').html(will_pay_dine_in);
                $('#modal-checkout-delivery-payment-types-b').html(will_pay_takeout);
                $('#modal-checkout-delivery-payment-types-c').html(will_pay_delivery);


                //VV HACK - hide "Don't Know Yet" on Pay Now tab - TODO
                if ($('#modal-checkout-type-pay-phone').hasClass('active')) {
                    HideDontKnowYet();
               }


               if ($("#delivery-nav-pay-pay-now").parent().hasClass('active')) {
                    HideDontKnowYet();
               }

                var def_printer = globalSettings.getDefaultPrinter();

                tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function(tx, results) {
                    var printers = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        printers.push({
                            'name': results.rows.item(i).printer_name,
                            'id': results.rows.item(i).id,
                            'selected': (results.rows.item(i).id == def_printer)
                        });
                    }



                    tx.executeSql('SELECT * FROM "suburb"', [], function(tx, results) {
                        var suburb = {
                            'suburb': []
                        };

                        for (var i = 0; i < results.rows.length; i++) {
                            suburb.suburb.push({
                                'name': results.rows.item(i).name,
                                'id': results.rows.item(i).id
                            });
                        }

//                        alert("here");
//

                        var t = {
                            'tables': []
                        },
                        k = 1;
                        t.tables[k] = {
                            'list': []
                        };


                        t.tables[k].list.push({
                            'name': 'Takeway',
                            'value': 'T',
                            'should_be_selected': nameOfTable == nonNumericalTables[0] ? true : false
                        });


                        for (var i = 1; i <= parseInt(document.pos_settings.number_of_tables); i++) {
                            if (i % 4 == 0) {
                                k++;
                                t.tables[k] = {
                                    'list': []
                                };
                            }
                            t.tables[k].list.push({
                                'name': 'Table ' + i,
                                'value': i,
                                'should_be_selected': Number(nameOfTable) === i ? true : false

                            });
                        }



                        var tables_html = Mustache.to_html($('#table-list-template').html(), t);
                        $('#modal-checkout-table-list').html(tables_html);



                        var printers_checkout = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'checkout'});
                        var printers_checkout_second = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'checkout_second'});

                        var printers_checkout_delivery = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'delivery'});
                        var printers_checkout_delivery_second = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'delivery_second'});

                        var suburb_html = Mustache.to_html($('#modal-checkout-delivery-suburb-options').html(), suburb);
                        $('#modal-checkout-delivery-suburb').html(suburb_html);

                        $('#modal-checkout-takeway-printers').html(printers_checkout);
                        $('#modal-checkout-takeway-printers_second').html(printers_checkout_second);

                        $('#modal-checkout-delivery-printers').html(printers_checkout_delivery);
                        $('#modal-checkout-delivery-printers_second').html(printers_checkout_delivery_second);

                        $('#modal-checkout-takeway-printers').show();
                        $('#modal-checkout-takeway-printers_second').hide();

                        $('#modal-checkout-delivery-printers').show();
                        $('#modal-checkout-delivery-printers_second').hide();


//                        setPriceTotal(myCart.getTotal());

                        $('#id_kitchen_docket').off('click').on('click', function() {

                            $('#modal-checkout-takeway-printers_second').hide();
                            $('#modal-checkout-takeway-printers').show();
                            setRelationBetweenCustomerAndKitchenDockets();
                        })

                        $('#id_customers_docket').off('click').on('click', function() {
                            $('#modal-checkout-takeway-printers').hide();
                            $('#modal-checkout-takeway-printers_second').show();


//                            setNumberOfCopiesForCustomersDocket.statesOfMainPrinters[0] =
                            setNumberOfCopiesForCustomersDocket();
                        })


                        $('#id_kitchen_docket_delivery').off('click').on('click', function() {

                            $('#modal-checkout-delivery-printers_second').hide();
                            $('#modal-checkout-delivery-printers').show();
                            setRelationBetweenCustomerAndKitchenDockets();
                        })

                        $('#id_customers_docket_delivery').off('click').on('click', function() {
                            $('#modal-checkout-delivery-printers').hide();
                            $('#modal-checkout-delivery-printers_second').show();
                            setNumberOfCopiesForCustomersDocket();

                        })


//                        dine-nin tab - credit card fee
                        $('#dinein-checkout-fee').off('keyup blur').on('keyup blur', function() {



                            var tot = parseFloat(myCart.getTotal());
                            var v = parseFloat($(this).val());
                            if (isNaN(v)) {
                                v = 0;
                            }
//
//                            $('.checout-total-container').html(' - $' + parseFloat(tot + v).toFixed(2));

                            setPriceTotal(parseFloat(tot + v).toFixed(2));
                            updatingCashPrice('');
                        });


                        //delivery tab - credit card fee
                        $('#asd1').find('input').off('keyup blur').on('keyup blur', function() {

                            console.log("fireddd");

                            var tot = parseFloat(myCart.getTotal());
                            var v = parseFloat($(this).val());
                            if (isNaN(v)) {
                                v = 0;
                            }

                            setPriceTotal(parseFloat(tot + v).toFixed(2));
                            updatingCashPrice('');
                        })


                        $('#modal-checkout-type-pay-phone-button').off('click').on('click', function() {

//                            $('.checout-total-container').html(' - $' + myCart.getTotal());


                            //VV HACK  - hide 'Don't Know Yet';
                            HideDontKnowYet();


                            setPriceTotal(myCart.getTotal());

                            $('#dinein-checkout-fee').val('');
//                            alert("updating");


                            // if none of buttons has class active
//                            if ($('#pay_now_buttons .button-pay-type-dinein.active').length == 0) {
//                                $('.button-pay-type-dinein[data-type="1"]:first').addClass('active');
//                            }

                            // if button cash is active
                            if ($('.button-pay-type-dinein[data-type="1"]:first').hasClass('active'))
                            {
                                settingAsterisk();
                                updatingCashPrice('');
                                setRelationBetweenCustomerAndKitchenDockets();
//                                $('.button-pay-type-dinein[data-type="1"]:first').removeClass('active');
                            }

                            creditCardFeeStorage.feeWasAdded = 0;
                        });

                        $('#modal-checkout-type-pay-payed-button').off('click').on('click', function() {

                            //VV HACK  - hide 'Don't Know Yet';
                            ShowDontKnowYet();


//                            $('.checout-total-container').html(' - $' + myCart.getTotal());
                            setPriceTotal(myCart.getTotal());

                            $('#dinein-checkout-fee').val('');
//                             alert('settingAsterisk '+ $('#modal-checkout-type-pay-payed-button').parent('li.active').length);
                            unsettingAsterisk();
                            updatingCashPrice('');
                            creditCardFeeStorage.feeWasAdded = 0;
//                            settingAsterisk(false);
//
                        });



                        $("#modal-checkout-delivery-address").autocomplete({
                            appendTo: "#modal-checkout-delivery-p",
                            source: function(inputData, cb) {
                                var term = inputData.term;
                                var matches = [],
                                sy = new syncHandler(),
                                db = sy.getDbInstance();
                                var lastCharTyped = term.substr(term.length-1); //VV
                                tmp = term.match(/([0-9\-\/A-Za-z]+) ?(.*)/);
                                term = tmp[2];
                                if (tmp[1] == undefined) {
                                    tmp[1] = ' ';
                                }
                                var suburbsAll = [];
                                db.transaction(function(tx) {
                                    tx.executeSql('SELECT "name", "suburb_fee_in_dollars" FROM "suburb"', [], function(tx, results_suburbs) {

                                        for (var i = 0; i < results_suburbs.rows.length; i++) {
                                            suburbsAll[i] = [results_suburbs.rows.item(i).name, results_suburbs.rows.item(i).suburb_fee_in_dollars];
                                        }

                                        /*
                                         * @param {array} suburb  - array of all existing suburbs
                                         * @param {string} address  - consists of adress plus suburb
                                         * @returns - string containing address and fee for delivery
                                         */
                                        function concatenateSuburbAndDeliveryFee(suburbsAll, address) {
//
//                                            var full  =    address.split(',');
                                            var suburbName = $.trim(address.split(',')[1]);

                                            for (var i = 0; i < suburbsAll.length; i++) {
                                                // if  fee is not zero  suburbsAll[i][1] > 0
                                                // [0] - suburb name, [1] - suburb fee
//                                               if(address.indexOf(suburbsAll[i][0])  > -1 ) {
//                                                var gfdfsd = $.trim(suburbsAll[i][0]);
                                                if (suburbName == $.trim(suburbsAll[i][0])) {
                                                    var price = suburbsAll[i][1];

                                                    if (price != 0) {
                                                        address = address + ' (+$' + price + ')'; //vv
                                                    }
                                                    break;
                                                }
                                            }


                                            return address;
                                        }
                                        var where = '';
                                        var termList = term.split(' ');
                                        $.each(termList,function(index,word){
                                          where += index ? 'and' : '';
                                          where += '"address" like "%' + word + '%"' ;
                                        });

                                        db.transaction(function(tx) {
                                            tx.executeSql('SELECT "address" FROM "addresses" WHERE '+where+' LIMIT 7', [], function(tx, results) {

//                                              var addrWithPrice = concatenateSuburbAndDeliveryFee(suburb,)
//
                                                for (var i = 0; i < results.rows.length; i++) {

                                                    var adddrr = results.rows.item(i).address;
//                                                    var ffdd = tmp[1] + ' ' + results.rows.item(i).address;


                                                    var addressWithPrice = concatenateSuburbAndDeliveryFee(suburbsAll, adddrr);

                                                    matches.push({
                                                        'value': tmp[1] + ' ' + addressWithPrice,
                                                        "id": i
                                                    });
                                                }

                                                cb(matches);
                                            });
                                        });


                                    });
                                });
                                if (lastCharTyped == ' ' && window.keyboard_switch != 1){  //VV - change virtual keyboard back to alphanumeric after 1st space
                                    console.log('changin keyboard WWW');
                                    $("#virtualKeyboardChromeExtensionMainNumbers .kAbc").trigger("click");
                                    window.keyboard_switch = 1; //
                                }


                            },
                            select: function(event, ui) {
                                // ADDRESS select

//                                $('.checout-total-container').html(' - $' + myCart.getTotal());
                                setPriceTotal(myCart.getTotal());
//
                                var val = ui.item.label;
                                var tmp = val.split(',');
                                $(this).val(tmp[0]);
                                tmp[1] = tmp[1].substring(1);
                                $('#modal-checkout-delivery-suburb').find('option').each(function() {
                                    if ($(this).val() == tmp[1]) {
                                        $(this).attr('selected', true);
                                    } else {
                                        $(this).attr('selected', false);
                                    }
                                });

//                               var fullDeliveryAddress = $('#modal-checkout-delivery-address').val().split(' ');
                                var fee = tmp[1];  //fullDeliveryAddress[fullDeliveryAddress.length-1];
                                fee = fee.replace(/[^0-9]/g, '');
                                fee = Number(fee) + Number(getPriceCreditCardFeeFromField());

                                var price = getWellFormedPriceFromTotalField(fee);

                                creditCardFeeStorage.priceBeforeFee = price;
//                                creditCardFeeStorage.priceBeforeSelectField = myCart.getTotal();




                                //currentTotalPrice = ' - $' + price;
                                currentTotalPrice = price;
                                //currentTotalPrice = currentTotalPrice.toString();
                                showDisplay("TOTAL", currentTotalPrice, "total"); //VV


                                $('#checkout-delivery-button').children('.checout-total-container').text(currentTotalPrice);


//                              button-pay-type-takeout
                                // amex tab gets cancelled so making amex button unactive

                                if ($('#delivery-nav-pay-pay-now').parent().hasClass('active')) {
                                    $('#modal-checkout-delivery-payment-types-b').find('a[data-type="3"]').removeClass('active');

                                }

                                if ($('#will_pay_on_delivery').parent().hasClass('active')) {
                                    $('#modal-checkout-delivery-payment-types-c').find('a[data-type="3"]').removeClass('active');
                                }

                                creditCardFeeStorage.feeWasAdded = 0;
                                $(this).blur();
//                                $('#modal-checkout-delivery-payment-types-b').find('a[data-type="1"]');
                            },

                        });


                        $("#modal-checkout-delivery-phone").autocomplete({
                            appendTo: "#modal-checkout-delivery-ph",
                            search: function(event, ui) {
                                var current_value = $('#modal-checkout-delivery-phone').val();
                                current_value = trim_spaces_inside(current_value);
                                $('#modal-checkout-delivery-phone').val(formatPhoneNumber(current_value));

                            },
                            source: function(a, cb) {
                                var q = a.term;
                                q = trim_spaces_inside(q);

//                                $('#modal-checkout-delivery-phone');
                                var matches = [],
                                        sy = new syncHandler(),
                                        db = sy.getDbInstance(),
                                        tmp = q.match(/([0-9\-\/A-Za-z]+) ?(.*)/);
                                //q = tmp[2];

                                if (tmp[1] == undefined) {
                                    tmp[1] = ' ';
                                }
                                //alert(q);
                                db.transaction(function(tx) {
                                    tx.executeSql('SELECT "mobile", "address", "userid", "company_name",\n\
                     "suburb", "first_name", "last_name" FROM "customers" WHERE "mobile" like "' + q + '%"  LIMIT 5',
                                            [], function(tx, results)
                                    {

                                        for (var i = 0; i < results.rows.length; i++) {
                                            matches.push({
                                                'mobile': results.rows.item(i).mobile,
                                                'value': formatPhoneNumber(results.rows.item(i).mobile),
                                                'address': results.rows.item(i).address,
                                                'suburb': results.rows.item(i).suburb,
                                                'first_name': results.rows.item(i).first_name,
                                                'last_name': results.rows.item(i).last_name,
                                                'company': results.rows.item(i).company_name,
                                                'userid': results.rows.item(i).userid,
                                                "id": i
                                            });
                                        }


                                        cb(matches);
                                    }, function(a, b) {
                                        console.warn(a);
                                        console.warn(b);
                                    });
                                });
                            },
                            select: function(event, ui) {
                                // PHONE select


//                                $('.checout-total-container').html(' - $' + myCart.getTotal());
                                setPriceTotal(myCart.getTotal());
//
                                var val = ui.item.label;
                                $('#modal-checkout-delivery-name').val(ui.item.first_name + ' ' + ui.item.last_name);
                                $('#modal-checkout-delivery-company').val(ui.item.company);
                                $('#modal-checkout-delivery-address').val(ui.item.address);
                                //$('#modal-checkout-delivery-suburb').val(ui.item.suburb)
                                //var tmp = val.split(',');
                                $(this).val(val).data('idUser', ui.item.userid);
                                //console.log($(this).attr('id'));

                                //tmp[1] = tmp[1].substring(1);
                                /*$('#modal-checkout-delivery-suburb').find('option').each(function(){
                                 if ($(this).val() == tmp[1]) {
                                 $(this).attr('selected', true);
                                 } else {
                                 $(this).attr('selected', false);
                                 }
                                 });*/
                                $('#modal-checkout-delivery-suburb option[data-id="' + ui.item.suburb
                                        + '"]').prop('selected', true);


                                currentTotalPrice = price_recalculation();

                                $('#checkout-delivery-button').children('.checout-total-container').text(currentTotalPrice);
                                $(this).blur();


                                setTimeout(function() {
//                                    $('#modal-checkout-delivery-phone').val(formatPhoneNumber($('#modal-checkout-delivery-phone').val()));
                                    $('#modal-checkout-delivery-phone').val(ui.item.value);
                                }, 0);
//
                            },
                            close: function(event, ui) {

                            }
                        });

                        $('.modal-checkout-takeway-list-item').off('click').on('click', function() {

                            var $el = $(this);

                            $('.modal-checkout-takeway-list-item').each(function() {
                                $(this).removeClass('active');
                            });

                            $el.addClass('active');
                        });

                        $('#already_paid_tab_dinein').off('click').on('click', function() {


//
//                            $('.checout-total-container').html(' - $' + myCart.getTotal());
                            setPriceTotal(myCart.getTotal(), true);

                            $('.button-pay-type-dinein').each(function() {
                                $(this).removeClass('active');
                            });
                            $('#checkout-input-total').val(myCart.getTotal());

                            unsettingAsterisk();
                            updatingCashPrice('');
                            creditCardFeeStorage.feeWasAdded = 0;
//                            settingAsterisk();
                        });

                        $('#will_pay_on_delivery').off('click').on('click', function() {


                            //VV hack - hide 'Don't Know Yet', to be removed -  TODO
                            ShowDontKnowYet();

                            setPriceTotal(myCart.getTotal());
                            setPriceTotal(price_recalculation());
                            $('#asd1').find('input').val('');

                            unsettingAsteriskDelivery();
                            updatingCashPrice('');
                        });

                        $('#already_paid_tab_takeaway').off('click').on('click', function() {

                            unsettingAsteriskDelivery();
                            updatingCashPrice('');
                            // reset amex fee
//                            $('.checout-total-container').html(' - $' + creditCardFeeStorage.priceBeforeFee);
                            setPriceTotal(creditCardFeeStorage.priceBeforeFee, true);
                            creditCardFeeStorage.feeWasAdded = 0;

//                            setPriceTotal(myCart.getTotal(),true);
                        });


                        $('#delivery-nav-pay-pay-now').off('click').on('click', function() {


                            //VV hack - hide 'Don't Know Yet', to be removed -  TODO
                            HideDontKnowYet();

                            setPriceTotal(myCart.getTotal());
                            setPriceTotal(price_recalculation());
                            $('#asd1').find('input').val('');

                            settingAsteriskDelivery();
                            setRelationBetweenCustomerAndKitchenDockets();
                        });

                        $('.button-pay-type-takeout').off('click').on('click', function() {


                            var id = $(this).data('type'),
                                    sy = new syncHandler()
                            db = sy.getDbInstance()
                            $el = $(this);

//

                            $('.button-pay-type-takeout').each(function() {
                                $(this).removeClass('active');
                            });

                            $('#modal-checkout-dinein-money-module').remove();
                            $el.addClass('active');





                            db.transaction(function(tx) {
                                tx.executeSql('SELECT * FROM "taxes" WHERE "id"=?', [id], function(tx, results) {
                                    var d = results.rows.item(0),
                                            total = myCart.getTotal(),
                                            out_total = 0;


//
                                    var value = creditCardFeeStorage.feeWasAdded;

//                                    if ($('a[href="#modal-checkout-type-delivery"]').parent('li').hasClass('active'))
                                    {
                                        if (creditCardFeeStorage.feeWasAdded == 1) {
                                            creditCardFeeStorage.feeWasAdded = 0;
                                            total = creditCardFeeStorage.priceBeforeFee;
                                        } else {

//                                        creditCardFeeStorage.priceBeforeFee = total;
                                            creditCardFeeStorage.priceBeforeFee = getWellFormedPriceFromTotalField();
                                            total = creditCardFeeStorage.priceBeforeFee;
                                        }
                                    }


                                    total = parseFloat(total);
                                    if (d.percent_fee != 0) {

//
                                        //total = getWellFormedPriceFromTotalField();
//                                        creditCardFeeStorage.priceBeforeFee = total;
                                        out_total += total * parseFloat(d.percent_fee / 100);
                                        creditCardFeeStorage.feeWasAdded = 1;
                                        creditCardFeeStorage.addedFee = parseFloat(d.percent_fee / 100);


                                    }
                                    if (d.fixed_fee != 0) {

//                                        creditCardFeeStorage.priceBeforeFee = total;
                                        out_total += parseFloat(d.fixed_fee);
                                        creditCardFeeStorage.feeWasAdded = 1;
                                        creditCardFeeStorage.addedFee = parseFloat(d.fixed_fee);
                                    }

                                    out_total += total;
                                    out_total = parseFloat(out_total).toFixed(2);

//                                    $('.checout-total-container').html(' - $' + out_total);
//                                    currentTotalPrice = price_recalculation();
//                                    $('#checkout-delivery-button').children('.checout-total-container').text(currentTotalPrice);

                                    out_total = price_recalculation();
                                    setPriceTotal(out_total);
//                                    setPriceTotal();
                                    $('#checkout-input-total').val(out_total);
                                });
                            });

                            setPriceTotal(myCart.getTotal());

                            unsettingAsteriskDelivery();
                            updatingCashPrice('');


                        });


                        $('#checkout-delivery-button').off('click').on('click', function(e) {
                            e.preventDefault();
//                            var valuePrice = $('#checkout-delivery-button').children('.checout-total-container').text();

//                            window.alert('fdfddf');
//

                            var phone = false,
                                    pay_type = false,
                                    PHONE_NUMBER_MIN_LENGTH = 10;


                            if ($('#modal-checkout-delivery-phone').val() != '') {
                                phone = true;
                             //   var isPhoneLongEnough = (trim_spaces_inside($('#modal-checkout-delivery-phone').val()).length >= PHONE_NUMBER_MIN_LENGTH) ? true : false;
                            }

                         //   if (!isPhoneLongEnough) {
                         //       alert('Please make sure that number has more than ' + PHONE_NUMBER_MIN_LENGTH + ' digits!');
                         //       return false;
                         //   }


                            $('.button-pay-type-takeout').each(function() {
                                if ($(this).hasClass('active')) {
                                    pay_type = true;
                                    return false;
                                }
                            });

                            if ($('#already_paid_tab_takeaway').parent().hasClass('active')) {
                                pay_type = true;
                            }


//
                            if (pay_type && phone) {
                                var idUser = $('#modal-checkout-delivery-phone').data('idUser'),
                                        name = $('#modal-checkout-delivery-name').val(),
                                        company = $('#modal-checkout-delivery-company').val(),
                                        address = $('#modal-checkout-delivery-address').val(),
                                        suburb = $('#modal-checkout-delivery-suburb option:selected').data('id'),
                                        phoneUser = $('#modal-checkout-delivery-phone').val(),
                                        sy = new syncHandler(),
                                        db = sy.getDbInstance();


//                                phone_number = $('#modal-checkout-delivery-phone').val();

                                var name = name.split(' '),
                                        data = {
                                            'userid': idUser,
                                            'first_name': name[0],
                                            'last_name': ((name[1] != undefined) ? name[1] : ''),
                                            'company_name': company,
                                            'address': address,
                                            'suburb': suburb,
                                            'mobile': phoneUser,
                                            'usertypeid': 3,
                                        };



                                db.transaction(function(tx)
                                {
                                    data.mobile = trim_spaces_inside(data.mobile); //remove spacing before search if it exists already
//            'SELECT * FROM "taxes" WHERE "active"=?', ['1'],
                                    tx.executeSql('SELECT * FROM customers WHERE "mobile"=?', [data.mobile], function(tx, results) {

                                        //remove spaces befre storing in db
                                       // data.mobile = trim_spaces_inside(data.mobile);
//                                        delayWithGettingUserId(sy, 'users', data, 'editCustomers', results, myCart.checkoutDelivery);
                                        delayWithGettingUserId(sy, 'users', data, 'editCustomers', results);

                                    }, function(a, b) {
                                        console.log(a);
                                        console.log(b);
                                    });
                                    //second_additional(result_mine);
                                });

                            } else {
                                console.log(phone, pay_type);
                                alert('Please provide phone number and payment method!');
                            }
                            //deleting temp values
                            localStorage.setItem('tmp_phone',"");
                            localStorage.setItem('tmp_address',"");
                            localStorage.setItem('tmp_company',"");
                            localStorage.setItem('tmp_name',"");
                            localStorage.setItem('tmp_note',"");

                            return false;
                        });


                        $('.button-pay-type-dinein').off('click').on('click', function() {


                            var id = $(this).data('type'),
                                    sy = new syncHandler()
                            db = sy.getDbInstance()
                            $el = $(this);

                            $('.button-pay-type-dinein').each(function() {
                                $(this).removeClass('active');
                            });
                            $('#modal-checkout-dinein-money-module').remove();

                            $el.addClass('active');

                            db.transaction(function(tx) {
                                tx.executeSql('SELECT * FROM "taxes" WHERE "id"=?', [id], function(tx, results) {
                                    var d = results.rows.item(0),
                                            total = myCart.getTotal(),
                                            out_total = 0;

                                    total = parseFloat(total);
                                    if (d.percent_fee != 0) {
                                        out_total += total * parseFloat(d.percent_fee / 100);
                                    }
                                    if (d.fixed_fee != 0) {
                                        out_total += parseFloat(d.fixed_fee);
                                    }

                                    out_total += total;
                                    out_total = parseFloat(out_total).toFixed(2);

//
//                                    $('.checout-total-container').html(' - $' + out_total);
                                    setPriceTotal(out_total);
                                    $('#checkout-input-total').val(out_total);
                                });
                            });

                            // letting DOM to get loaded
                            setTimeout(function() {
                                //
                                if ($('#pay_now_buttons .button-pay-type-dinein:last').hasClass('active')
                                        || $('#will_pay_on_pickup .button-pay-type-dinein:last').hasClass('active')
                                        )
                                {
                                    creditCardFeeStorage.feeWasAdded = 1;
                                }
                                else {
                                    creditCardFeeStorage.feeWasAdded = 0;

                                }

                            }, 0);


                            updatingCashPrice('');


//                            settingAsterisk();
//                            setRelationBetweenCustomerAndKitchenDockets();
                        });

                        $('.checkout-tabs').off('click').off('click').on('click', function() {

                            remember_current_active_tab($(this).data('type'));

                            $('#modal-checkout-dinein-money-module').remove();
                            $('.button-pay-type-dinein').each(function() {
                                $(this).removeClass('active');
                            });
                            $('.modal-checkout-takeway-list-item').each(function() {
                                $(this).removeClass('active');
                            });
                            $('.button-pay-type-takeout').each(function() {
                                $(this).removeClass('active');
                            });



//                            $('.checout-total-container').html(' - $' + myCart.getTotal());
                            setPriceTotal(myCart.getTotal());

                            $('#checkout-input-total').val(myCart.getTotal());

                            $('#modal-checkout-delivery-address').val('');

                            creditCardFeeStorage.feeWasAdded = 0;
                            creditCardFeeStorage.priceBeforeFee = myCart.getTotal();
                            creditCardFeeStorage.initialPriceForCredicardFeePrinting = 0;
                            creditCardFeeStorage.priceBeforeSelectField = 0;
                            updatingCashPrice('');


                            $('#asd1').find('input').val('');
                            $('#dinein-checkout-fee').val('');

                            setNumberOfCopiesForCustomersDocket();
                        });


                        $('#checkout-submit-button').off('click').on('click', function(e) {
                            e.preventDefault();


                            var p_type = false,
                                    table = false;

                            if ($('#already_paid_tab_dinein').parent().hasClass('active')) {
                                p_type = true;
                            }


                            if (!p_type) {
                                $('.button-pay-type-dinein').each(function() {
                                    if ($(this).hasClass('active')) {
                                        p_type = true;
                                        return false;
                                    }
                                });
                            }

                            $('.modal-checkout-takeway-list-item').each(function() {
                                if ($(this).hasClass('active')) {
                                    table = true;
                                    return false;
                                }
                            });

                            if (p_type && table) {
                                $('#parking_order_note').val('');
                                $('#global-note-holder').val('');
                                $('#delivery-note').val('');

                                // necessary to check whether order taken from kitchen was already checked out
                                if (isOrderTakenFromTheKitchen())
                                {
                                    checkoutWithCaution('dine-in');
                                } else
                                {
                                    myCart.checkout();
                                }

                            } else {
                                alert('Please select table or Takeaway and payment type!');
                            }

                            return false;
                        });

                        if (sessionStorage.getItem('client_caller_data')) {
                            var c = sessionStorage.getItem('client_caller_data');
                            c = JSON.parse(c);

                            $('#modal-checkout-delivery-phone').val(formatPhoneNumber(trim_spaces_inside(c.number)));
                            $('#modal-checkout-delivery-name').val(c.name);
                            $('#modal-checkout-delivery-address').val(c.address);
                            $('#modal-checkout-delivery-company').val(c.company);
                        }
                        $('#pay_now_buttons').find('a[data-type="1"]').off('click').on('click', function() {





//                            if ($('#modal-checkout-dinein-money-module').length != 0)

                            {
//                                $('#modal-checkout-dinein-money-module').remove();
                            }

                            $el = $(this);
                            if (!$el.hasClass('active')) {
                                $('.button-pay-type-dinein').each(function() {
                                    $(this).removeClass('active');
                                });

                                $el.addClass('active');
                                var html = Mustache.to_html($('#modal-checkout-dinein-money').html(), '');
                                $el.parent().parent().append(html);

                                //FastClick.attach($('.modal-checkout-dinein-money-trigger'));
                                $('.modal-checkout-dinein-money-trigger').off('click').on('click', function() {
                                    var $inp = $('#modal-checkout-dinein-money-input');

                                    var val = parseFloat($inp.val());

                                    if (isNaN(val)) {
                                        val = 0;
                                    }

                                    if ($(this).data('val') == 'x') {
                                        $inp.val('');
                                        updatingCashPrice('');
                                        return false;
                                    }

                                    val += parseFloat($(this).data('val'));
                                    $inp.val(val.toFixed(2));
                                    updatingCashPrice(val);

                                    console.log(val.toFixed(2));
                                });

                            }



                            if ($(".modal-checkout-dinein-money-module_class").length > 1) {
                                $(".modal-checkout-dinein-money-module_class:last").remove();
                            }

                            setPriceTotal(myCart.getTotal());

                            creditCardFeeStorage.feeWasAdded = 0;
                            settingAsterisk();
                            setRelationBetweenCustomerAndKitchenDockets();

                        });


                        $('#modal-checkout-delivery-payment-types-b').find('a[data-type="1"]').off('click').on('click', function() {



                            var total = 0;
                            if (creditCardFeeStorage.feeWasAdded == 1) {
                                creditCardFeeStorage.feeWasAdded = 0;
                                var priceInTotalWindowNow = getWellFormedPriceFromTotalField();


                                var currentTotalPrice = priceInTotalWindowNow.replace(/[^0-9]/g, '');  // converting $3  to 300 cents
                                total = creditCardFeeStorage.priceBeforeFee;

                            } else {
                                total = getWellFormedPriceFromTotalField();
                            }

//                            $('.checout-total-container').html(' - $' +total);



//
                            $el = $(this);
                            if (!$el.hasClass('active')) {
                                $('.button-pay-type-takeout').each(function() {
                                    $(this).removeClass('active');
                                });

                                $el.addClass('active');
                                var html = Mustache.to_html($('#modal-checkout-dinein-money').html(), '');
                                $el.parent().parent().append(html);
                                $('.modal-checkout-dinein-money-trigger').off('click').on('click', function() {
                                    var $inp = $('#modal-checkout-dinein-money-input');
                                    var val = parseFloat($inp.val());

                                    if (isNaN(val)) {
                                        val = 0;
                                    }

                                    if ($(this).data('val') == 'x') {
                                        $inp.val('');
                                        updatingCashPrice('');
                                        return false;
                                    }

                                    val += parseFloat($(this).data('val'));
                                    $inp.val(val.toFixed(2));
                                    updatingCashPrice(val);

                                    console.log(val.toFixed(2));
                                });
                            }


                            setPriceTotal(total);

                            settingAsteriskDelivery();
                            setRelationBetweenCustomerAndKitchenDockets();
//                            alert("finished");
                        });

                        if ($('#modal-checkout-dinein-money-module').length == 0) {

                            $('.button-pay-type-dinein[data-type="1"]:first').trigger('click');

                        } else {


                            $('.button-pay-type-dinein[data-type="1"]:first').addClass('active');
                        }


                        settingAsterisk();
                        $('.button-pay-type-dinein[data-type="1"]:first').click(function() {
// alert("mclicked");

//                            console.log("clicled");
//                            settingAsterisk();
                        });



                        $('.button-pay-type-dinein[data-type="2"]:first').click(function() {
// alert(mlclicked");
//                            console.log("clicled");
// settingAsterisk();

                            unsettingAsterisk();
                        });


                        $('.button-pay-type-dinein[data-type="3"]:first').click(function() {
// alert("l;clicked");
//                            console.log("clicled");
// settingAsterisk();

                            unsettingAsterisk();
                        });

                    });


                    setTimeout(function(  ) {
//                        if ( $('#client-details-container').text() ()check if call mode is active
//                        settingAsterisk();
                        updateTotalPriceWhenAcceptingCall();


                        var printers = new PrintersMarking();

                        var idsOfItems = printers.getIdsFromDOM(),
                                printersIdsOfCustomItems = getFilteredPrintersOnCustomOrders();

                        printers.whatPrintersToSelect(idsOfItems, false, printersIdsOfCustomItems);
//                        setNumberOfCopiesForCustomersDocket();

                    }, 0);
                });
            })
        });




//        alert("fine");
    });


    function updateTotalPriceWhenAcceptingCall() {
        var fullDeliveryAddress = $('#modal-checkout-delivery-address').val().split(' ');
        var fee = fullDeliveryAddress[fullDeliveryAddress.length - 1];
        fee = fee.replace(/[^0-9]/g, '');



        var price = getWellFormedPriceFromTotalField(fee);
        creditCardFeeStorage.priceBeforeFee = price;
//                                creditCardFeeStorage.priceBeforeSelectField = myCart.getTotal();

//
        //   currentTotalPrice = '-$' + price; //VV
        currentTotalPrice = price;

//                               currentTotalPrice = currentTotalPrice.toString();

        $('#checkout-delivery-button').children('.checout-total-container').text(currentTotalPrice);

    }


    var address_autocomplete = function(strs) {
        return function findMatches(q, cb) {
            var matches = [],
                    sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    tmp = q.match(/([0-9\-\/A-Za-z]+) ?(.*)/);
            q = tmp[2];
            if (tmp[1] == undefined) {
                tmp[1] = ' ';
            }
            db.transaction(function(tx) {
                tx.executeSql('SELECT "address" FROM "addresses" WHERE "address" like "%' + q + '%" OR "address" like "' + q + '%" OR "address" like "%' + q + '" OR "address" like "' + q + '" LIMIT 5', [], function(tx, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        matches.push({
                            'value': tmp[1] + ' ' + results.rows.item(i).address
                        });
                    }
                    cb(matches);
                });
            });
        };
    };





    /**
     * Misc Product Related
     */
    $('.miscButtonType').on('click', function() {
        $('.miscButtonType').removeClass('selected');
        $('#typeOfMisc').val($(this).data('value'));
        $(this).addClass('selected');
    });

    $('#misc-add').on('click', function() {
        var btn = $(this);
        btn.button('loading');

        var price = $('#miscValue').val();

        if ($('#typeOfMisc').val() == 'minus') {
            price = -price;
        }
        if (price != 0) {
            var item = {
                id: 'misc-' + price,
                price: price,
                name: $('#miscName').val(),
                qty: 1,
                is_discount: 1,
                has_coupon: 1
            };
            myCart.addItem(item);
            updateCartElements();
        }

        /* Reset everything */
        $('#typeOfMisc').val('plus');
        $('#miscName').val('');
        $('#miscValue').val(0);
        $('.miscButtonType').removeClass('selected');
        $('.miscButtonType:first').addClass('selected');

        $('#modal-universal-product').modal('hide');
        btn.button('reset');
    });

    $(document).on('hidden.bs.modal', '#modal-universal-product', function() {
        $('#miscName').val('');
        $('#miscValue').val('');
    });

    $(document).on('shown.bs.modal', '#modal-universal-product', function() {
        $('#miscName').focus();
        $('.misc-product-inc').off('click').on('click', function() {
            var a = $(this).data('val'),
                    b = $('#miscValue').val();

            switch (a) {
                case 'del':
                    b = b.slice(0, -1);
                    break;
                case 'sign':
                    if (parseFloat(b) < 0) {
                        b = b.replace('-', '');
                        $(this).html('-');
                    } else {
                        b = '-' + b;
                        $(this).html('+');
                    }
                    break;
                default:
                    b = b + '' + a;
                    break;
            }

            $('#miscValue').val(b)
        });
    });

    function getNote() {

//

        var sy = new syncHandler(),
                db = sy.getDbInstance();

        db.transaction(function(tx) {
            tx.executeSql('SELECT "table", "note" FROM "orders" WHERE "id"=?', [localStorage.getItem('cartSession')], function(tx, results) {
                var dd,
                        data = {
                            'tables': []
                        };

//

                if (results.rows.length > 0) {
                    dd = $.extend({}, results.rows.item(0));
                    if (dd.table != 'T' && dd.table != 'D' && dd.table != '') {
                        dd.table = parseInt(dd.table);

                        var noteToParkedOrder = results.rows.item(0).note;
                        $('#parking_order_note').val(noteToParkedOrder);
                        $('#takeaway-note').val(noteToParkedOrder);
                        $('#delivery-note').val(noteToParkedOrder);
                    }
                    else
                    {
                        $('#parking_order_note').val(results.rows.item(0).note);
                        $('#takeaway-note').val(results.rows.item(0).note);
                        $('#delivery-note').val(results.rows.item(0).note);
                    }

                }
            }
            )
        })


    }



    $('#id_kitchen_docket_closed_orders').off('click').on('click', function() {

        $('#modal-closed-orders-printers_second').hide();
        $('#modal-closed-orders-printers').show();
    })


    $('#id_customers_docket_closed_orders').off('click').on('click', function() {


        $('#modal-closed-orders-printers_second').show();
        $('#modal-closed-orders-printers').hide();
    })


    $('#id_kitchen_docket_parked').off('click').on('click', function() {
        $('#modal-park-order-printers').show();
        $('#modal-park-order-printers_second').hide();
    });

//    $('#id_customers_docket_parked').off('click').on('click', function () {
//        $('#modal-park-order-printers').hide();
//        $('#modal-park-order-printers_second').show();
//    });

    // park options and triggers start
    $('#modal-park-order').on('show.bs.modal', function(e) {

        var itemsInBasket = myCart.getItems(true);


        var sy = new syncHandler(),
                db = sy.getDbInstance();

        $('#printOnlyNewItems').prop('checked', true);

        $('#modal-park-order-printers').hide();
        $('#modal-park-order-printers_second').show();






        $("[name='checkbox_hide_park_printers']").bootstrapSwitch('onSwitchChange', function(event, state) {

            if (state) { // button got enabled
                $.each($('#modal-park-order-printers_second').find('.btn-printer-checkout_second_park'), function(index, element) {
                    $(this).removeClass('hide');
                    $('#printOnlyNewItems').parent().show();
                    $("#textNotifierAboutPrintersState").show();

                })
            } else { // button was disabled
                $.each($('#modal-park-order-printers_second').find('.btn-printer-checkout_second_park'), function(index, element) {
                    $(this).addClass('hide');
                    $('#printOnlyNewItems').parent().hide()
                    $("#textNotifierAboutPrintersState").hide();
                })
            }


        });



        db.transaction(function(tx) {
            tx.executeSql('SELECT "table", "note" FROM "orders" WHERE "id"=?', [localStorage.getItem('cartSession')], function(tx, results) {
                var dd,
                        data = {
                            'tables': []
                        };

//

                if (results.rows.length > 0) {

                    dd = $.extend({}, results.rows.item(0));
                    //line below didn't let to restore the note for orders taken from the kitchen
//                    if (dd.table != 'T' && dd.table != 'D' && dd.table != '')
                    {
                        dd.table = parseInt(dd.table);
                        var noteToParkedOrder = results.rows.item(0).note;
                        $('#parking_order_note').val(noteToParkedOrder);
                        $('#global-note-holder').val(noteToParkedOrder);
                        $('#delivery-note').val(noteToParkedOrder);
                    }
                } else {
//
                    dd = {};
                    dd.table = 0;
                }


                tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function(tx, results) {
                    var printers = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        printers.push({
                            'name': results.rows.item(i).printer_name,
                            'id': results.rows.item(i).id
                        });
                    }

                    for (var i = 1; i <= parseInt(document.pos_settings.number_of_tables); i++) {
                        data.tables.push({'number': i});
                    }

                    var html = Mustache.to_html($('#park-order-table-list').html(), data);
                    $('#park-order-table-list-html').html(html);

                    $('.trigger-park-table').removeClass('btn-primary');

//                    $('button[data-value="' + dd.table + '"]').removeClass('btn-default').addClass('btn-primary');


                    var printers_html = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'checkout'});
                    var printers_html_second = Mustache.to_html($('#modal-checkout-printer-list').html(), {'printers': printers, 'type': 'checkout_second_park'});
                    $('#modal-park-order-printers').html(printers_html);
                    $('#modal-park-order-printers_second').html(printers_html_second);


//                    $('#modal-custom-orders-printers').html


                    $("[name='checkbox_hide_park_printers']").bootstrapSwitch('state', globalSettings.getPrintParkOrder());

                    if (!globalSettings.getPrintParkOrder()) {
                        $.each($('#modal-park-order-printers_second').find('.btn-printer-checkout_second_park'), function(index, element) {
                            $(this).addClass('hide');
                        })

                        $("#textNotifierAboutPrintersState").hide();
                    }



                    settingAsterisk();
                    var printers = new PrintersMarking();
                    var ids = printers.getIdsFromDOM();
                    var customItemsPrintsIds = getFilteredPrintersOnCustomOrders();

                    printers.whatPrintersToSelect(ids, itemsInBasket.length, customItemsPrintsIds);

                });




            });
        });
    });

    // order notes
    $('#modal-order-note').on('show.bs.modal', function(e) {


        var n = localStorage.getItem('order-notes');
        if (n) {
            $('#modal-order-note-textarea').val(n);
        }
    });

    $('#modal-order-note').on('shown.bs.modal', function(e) {
//

        $('#modal-order-note-textarea').focus();

        $('#modal-order-note-save').off('click').on('click', function() {
            localStorage.setItem('order-notes', $('#modal-order-note-textarea').val());
            $('#modal-order-note').modal('hide');
        });
    });

    // order notes end



//trigger-park-table
// for adding  property of  button  -  active
    $(document).on('click', '.trigger-park-table', function() {
//    $('.trigger-park-table').off('click').on('click', function() {
        var $el = $(this);
//                        alert("herefdfd");
        $('.trigger-park-table').each(function() {
            $(this).removeClass('active');
        });


        $el.addClass('active');
    });


    $('#checkout-submit-button-park').off('click').on('click', function(e) {
        e.preventDefault();

        var itemsInBasket = '';
        if ($('#printOnlyNewItems').prop('checked')) {
            itemsInBasket = myCart.getItems(true);
        } else {
            itemsInBasket = myCart.getItems();
        }



        var activeTable = $('.trigger-park-table.active').attr('data-value');

        if (typeof activeTable == 'undefined')
        {
            alert('Please select table or Takeaway or Delivery!');
            return false;
        }



        var datePicker = ($('#modal-checkout-takeaway-time-types-park .button-pay-type-time.active').data('type') == 'asap') ? $('#modal-checkout-takeaway-time-types-park .button-pay-type-time.active').data('type')
                : $('#takeaway-type-later-datepicker-park').val();


        console.log(localStorage.getItem('cartSession'));
        if (sessionStorage.getItem('order_type')) {
            var order_type = sessionStorage.getItem('order_type');
        } else {
            var order_type = 0;
        }


//        localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) + 1)  ;


        var order_code = '',
                unique_id = '';

        if (isOrderTakenFromTheKitchen()) {
            order_code = [];
            order_code['order_code'] = $('#list-cart').attr('order_code');
            unique_id = $('#list-cart').attr('unique_id');
        } else {
            order_code = myCart.getOrderCode();
            unique_id = getUniqueID();
        }




        var print = {}, can_print = false,
                data = [
                    activeTable, //$(this).data('value'), //table
                    'park', // status
                    JSON.stringify(myCart.getItems()), //contents
                    myCart.getTotal(), //total
                    myCart.getActiveUser(), // userId
                    0, //pay_value
//                    $('#global-note-holder').val(), //note
                    $('#parking_order_note').val(),
                    new Date().getHours(), //hour
                    order_code.order_code, // order_code
                    order_type,
                    datePicker,
                    unique_id
                ],
                cols = ["table", "status", "contents", "total", "userId", "pay_value", "note", "hour", "order_code", "order_type", "order_time", "unique_id"];



//        $('#modal-park-order-printers .btn-printer-checkout').each(function () {

        if ($("[name='checkbox_hide_park_printers']").bootstrapSwitch('state')) {
            $('#modal-park-order-printers_second .btn-printer-checkout_second_park').each(function() {
                if ($(this).data('count') > 0) {
                    can_print = true;
                    print[$(this).data('id')] = $(this).data('count');

                }
            });
        }

//  cols = ["table", "status", "contents", "total", "userId", "pay_value", "pay_type", "note", "hour", "order_code", "order_type", "order_time"],


//        can_print = true;

        var dd = array_combine(cols, data);
        if (can_print && $("[name='checkbox_hide_park_printers']").bootstrapSwitch('state')) {

            dd['order_status'] = 'UNPAID';
            if ($('#printOnlyNewItems').prop('checked'))
            {
                dd['contents'] = JSON.stringify(myCart.getItems(true));
            }

            if (!$('#printOnlyNewItems').is(':checked'))
            {
                dd['contents'] = markAllItemsAsUnprinted(dd['contents']);
            }


            var Printing = {
                printPrinting: print,
                printPrinting2: false,
                ddCopyPrinting: dd
            };
//            thisClass.Printing = Printing;

//            myCart.setPrinted();

        }

        var Syncronisation = packObjectForSync(dd);

        if (localStorage.getItem('cartSession')) {


            if (can_print && itemsInBasket.length) {

                myCart.setPrinted();
                printOrderWithDelayForRetrivievingId(print, false, dd);
            }

            myCart.updateOrder(localStorage.getItem('cartSession'), activeTable, $('#parking_order_note').val());

            $('#modal-park-order').modal('hide');
            myCart.clearCart();
            updateCartElements();
        } else {


            if (can_print && itemsInBasket.length) {
                myCart.setPrinted();
            }

            myCart.saveOrder(activeTable, 'park', '#modal-park-order', $('#parking_order_note').val(), 'undefined', Printing, Syncronisation);
            myCart.incrementOrderCode();
        }

        localStorage.removeItem('cartSession');
//        $('#parking_order_note').val('')
//        $('#global-note-holder').val('');


        $('.trigger-park-table.active').removeClass('active');
        $('#parking_order_note').val('');
//        $('.trigger-park-table').each(function() {
//            $(this).removeClass('active');
//        });


        $('#modal-checkout-takeaway-time-types-park a:first').addClass('active');
        $('#modal-checkout-takeaway-time-types-park a:last').removeClass('active');
        $('#takeaway-type-later-datepicker-park').val(''); // cleaning input field
        $('#id-takeaway-type-later').addClass('hide');

        sessionStorage.removeItem('client_caller_data');
        $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function(a) {
            return a.toUpperCase()
        }) + ' Order');
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');



        return false;
    });





    // park options and triggers end
    /*$(document).on('click', '#trigger-cartadd', function() {

        resetSearch();

        if ($(this).hasClass('must_update')) {
            myCart.updateProduct($(this).data('cart-id'),$(this).find('span.btn-price').text());

        } else {

            var productExtra = myCart.fetchProductExtra();
            var item = {
                id: parseInt($('#p-productId').val()),
                name: getProductName($('#p-productName').val(), productExtra),
                srcName: $('#p-productName').val(),
                price: myCart.calculateProductPrice(this,$('#p-productPrice').val()),
                qty: parseInt($('#p-quantity').val()),
                extra: productExtra,
                has_coupon: $('#p-has_coupon').val()
            };
            myCart.addItem(item);
        }
        updateCartElements();
        $.sidr('close', 'sidr-options');
        $('.order-list-name:first').effect("highlight", {}, 3000);
    });*/

    document.bindProductsEvent = function() {




//        $(".product-item").off('tap');
        // double tap implemented
        $(".product-item")
                .hammer()
                .off('tap')
                .on('tap', function(event)
                {

                    event.stopPropagation();
                    event.preventDefault();
                    event.stopImmediatePropagation();


                    var $el = $(this);


                   if (!Device.turn_on_thick_scrollbars()){
                      $('#half-ingredients select').prop('disabled',true);
                    }




                    if ($el.data('var') != 1) {
                        var item = {
                            id: $el.data('id'),
                            price: $el.data(getDataPrice()),
                            //price: $el.data('price'),
                            name: $el.data('name'),
                            qty: 1,
                            has_coupon: $el.data('has_coupon')
                        };

//
                        myCart.addItem(item, true);
                        updateCartElements();
                        $('.order-list-name:first').effect("highlight", {}, 3000);
                    } else {
//                                $.sidr('open', 'sidr-options');

                        populateOptionSliderForProduct($el.data('id'));

                        //$.sidr('open', 'sidr-options');
                    }
                });


        // old use with taphold - replaced with doubletap above
        if (0) {
            $('.product-item').on('taphold', {
                clickHandler: function(el) {
                    var $el;
                    if ($(el.target).hasClass('product-item')) {
                        $el = $(el.target);
                    } else {
                        $el = $(el.target).closest('.product-item');
                    }
                    if ($el.data('var') != 1)
                    {
                        var item = {
                            id: $el.data('id'),
                            price: $el.data('price'),
                            name: $el.data('name'),
                            qty: 1,
                            has_coupon: $el.data('has_coupon')
                        };
                        myCart.addItem(item, true);
                        updateCartElements();
                    }
                    else
                    {

                        populateOptionSliderForProduct($el.data('id'));
                        $.sidr('open', 'sidr-options');
                    }
                }
            }, function() {
                var $el;
                if ($(this).hasClass('product-item')) {
                    $el = $(this);
                } else {
                    $el = $(this).parent().parent();
                }
                if ($el.data('var') != 1) {

                    populateOptionSliderForProduct($el.data('id'));


                    $.sidr('open', 'sidr-options', function() {
                        $('#trigger-cartadd').show();
                    });
                }
            });
        }
    };



    $(document).on('change', '.half-selector-option-all', function(event) {
        var productList;
        var linkedHalf = false;
        if ($(this).val() != '') {
            $(this).next('.halfPizzaMsg').show();
            linkedHalf = $(this).parent().prevAll('.variation_selector').first();
            if($(this).data('type') == 'half' ){
              $(this).parent().prevAll('.variation_selector').first().find('option').each(function() {
                if(parseFloat($(this).data('price')) != 0) {
                  $(this).text($(this).data('name') + '($'+ (parseFloat($(this).data('price'))/2).toFixed(2)  + ')')
                }
              });
            }
        } else {
            $(this).next('.halfPizzaMsg').hide();
            if($(this).data('type') == 'half' ){
              $(this).parent().prevAll('.variation_selector').first().find('option').each(function() {
                if(parseFloat($(this).data('price')) != 0) {
                  $(this).text($(this).data('name') + '($'+ parseFloat($(this).data('price')).toFixed(2)  + ')')
                }
              });
            }
        }
    })


    /**
     * Remove Product from Cart
     */


    $(document).on('click', '.delete-cart-item', function() {
        myCart.removeItem($(this).data('id'), $(this).closest('tr').find('.list-cart-change-product').data('printed'));
        updateCartElements();
    }
    );

    $(document).on('click', '.cash-money-inc', function() {
        var a = $('#input-total').val(), t = 0;
        if (a == '') {
            a = 0;
        }

        t = (parseFloat(a) + parseFloat($(this).data('val'))).toFixed(2);

        $('#input-total').val(t);

    });

    $(document).on('click', '.group_button', function(e) {
        e.preventDefault();

        var thisEl = $(this),
                sy = new syncHandler();

        $('button[data-group="' + $(this).data('group') + '"]').each(function() {
            $(this).removeClass('active');
        });


        thisEl.addClass('active');
        if (thisEl.data('group') == 'show_called_id') {
            if (thisEl.data('value') == 'on') {
                NovComet.run();
                globalSettings.setShowCall(true);
            } else {
                NovComet.cancel = true;
                clearTimeout(NovComet._timeout);
                globalSettings.setShowCall(false);
            }
        }

        if (thisEl.data('group') == 'online_offline') {
            if (thisEl.data('value') == 'on') {
                globalSettings.setOnlineState(true);
                _sy.lazySync();
                _sy.pushLocalData();
            } else {
                globalSettings.setOnlineState(false);
                _sy.stopLazySync();

            }
        }

        if (thisEl.data('group') == 'tab_collapsed') {
            if (thisEl.data('value') == 'on') {
                globalSettings.setTabCollapsed(true);
                $('#collapse-order').collapse('hide');
//                  alert("a");
            } else {
                globalSettings.setTabCollapsed(false);
                $('#collapse-order').collapse('show');
//                alert("b");
            }
        }


        if (thisEl.data('group') == 'category_collapsed') {
            if (thisEl.data('value') == 'on') {
                globalSettings.setCategoryCollapsed(true);
//                globalSettings.setTabCollapsed(true);
//                $('#collapse-order').collapse('hide');
                $.sidr('open', 'sidr-categories');

//                  alert("a");
            } else {
                globalSettings.setCategoryCollapsed(false);
//                globalSettings.setTabCollapsed(false);
//                $('#collapse-order').collapse('show');
//                alert("b");
                $.sidr('close', 'sidr-categories');
            }
        }

        if (thisEl.data('group') == 'park_printing_enabled') {


            if (thisEl.data('value') == 'on') {
                globalSettings.setPrintParkOrder(true);
            } else {
                globalSettings.setPrintParkOrder(false);
            }
        }

        if (thisEl.data('group') == 'show_alphascroll') {


            if (thisEl.data('value') == 'on') {
                globalSettings.setAlphaScroll(true);
                $("#product-floated").show();
                enlargeProductContainer();

            } else {
                globalSettings.setAlphaScroll(false);
                $("#product-floated").hide();
                enlargeProductContainer();
            }
        }

    });

    $(document).on('click', '.po-custom-radio', function() {
      $(this).siblings().removeClass('btn-primary').find('input').prop('checked','false');
      $(this).addClass('btn-primary').find('input').prop('checked','true');
    });


    $(document).on('click', '.btn-printer', function() {


        $(this).removeClass('blue_again');
        var c = $(this).attr('data-count');

        if (c >= MAXIMAL_NUMBER_OF_COPIES) {
            $(this).attr('data-count', 0);
            $(this).find('span').html('');
            $(this).removeClass('active');

            $(this).trigger('blur');
            $(this).trigger("focusout");

            $(this).addClass('blue_again');

            unsettingAsterisk($(this));
            unsettingAsteriskDelivery($(this));

        } else {

            c = ++c;
            $(this).attr('data-count', c);
            $(this).find('span').html(c + 'x ');
            $(this).addClass('active');

            settingAsterisk();
            settingAsteriskDelivery();
//            $("#id_customers_docket_delivery").trigger("click");
        }

        // if customer's docket is active currently
        if ($('#id_customers_docket_delivery').parent().hasClass('active') || $('#id_customers_docket').parent().hasClass('active'))
        {
            setNumberOfCopiesForCustomersDocket(true, $(this));
        }

        setRelationBetweenCustomerAndKitchenDockets();

    });


    if (globalSettings.getCategoryCollapsed())
    {
        $.sidr('open', 'sidr-categories');
    } else
    {
        $.sidr('close', 'sidr-categories');
    }

    // before page gets refreshed state of buttons should be remembered
    $(document).bind('beforeunload', function() {
//        window.alert("fgnkj");
        remember_last_active();
    });

    //VV
    $("#fulloverflow").touchwipe({
        wipeLeft: function() {
            $.sidr('close', 'sidr-categories');
            $.sidr('close', 'sidr-orders');
        },
        wipeRight: function() {
            $.sidr('close', 'sidr-options');
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: true
    });

    $("#sidr-options").touchwipe({
        wipeRight: function() {
            $.sidr('close', 'sidr-options');
        },
        wipeLeft: function() {
            $("#trigger-cartadd").trigger("click");
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: false
    });

    $("#sidr-orders").touchwipe({
        wipeLeft: function() {
            $.sidr('close', 'sidr-orders');
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: false
    });

    $("#sidr-categories").touchwipe({
        wipeLeft: function() {
            $.sidr('close', 'sidr-categories');
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: false
    });

    $("#function_buttons,#category_and_search_buttons").touchwipe({
        wipeRight: function() {
            $.sidr('open', 'sidr-categories');
        },
        wipeDown: function() {
            ChangeTabHeight('up');
        },
        wipeUp: function() {
            ChangeTabHeight('down');
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: true
    });

    $(document).on('click', '#expand-tab', function() {
        ChangeTabHeight('toggle');
    });


    setTimeout(function() { //let's set some global vars for  ChangeTabHeight()
        window.TabHeightFromCSS = $("#cart-items-list").css("height");
        //console.log('TabHeightFromCSS is ' + window.TabHeightFromCSS);
        window.AplhaScrollHeight = $('.alpha-slider-container, .alpha-scroll, .slider-track').css('height');
        // window.productCollapse = $("#product-collapse").offset();
        // window.productCollapse.width = $("#product-collapse").css("width");
        // window.productCollapse.height = $("#product-collapse").css("height");
        window.swiperHeightRelativeHeigth = $("#swiper-height-relative").css("height");
        // console.log('position is ' + JSON.stringify($("#product-collapse").offset()));

        //  //alert('position is ' + JSON.stringify($("#product-collapse").offset()));
    }, 200);

});

/*VV
 /*increase/decrease cart and product containers*/
/* works OK on mobile. need to come with something better on desktop, toggle goes bewteen middle (default position) and bottom (so no up)
 /* can go only by step by step - so no bottom->top
 /*@param - up/down/toggle
 */
function ChangeTabHeight(direction) {
    var footerHeight = $("#footer-navigation").css("height");
    footerHeight = footerHeight.replace('px', '');
    footerHeight = parseInt(footerHeight);
    //console.log('footerHeight is ' + footerHeight);

    var fceButtonsHeight = $("#function_buttons").css("height");
    fceButtonsHeight = fceButtonsHeight.replace('px', '');
    fceButtonsHeight = parseInt(fceButtonsHeight);
    //console.log('fceButtonsHeight is ' + fceButtonsHeight);

    var PriceGroupsHeight = $("#accordeon-order-prices-list").css("height");
    PriceGroupsHeight = PriceGroupsHeight.replace('px', '');
    PriceGroupsHeight = parseInt(PriceGroupsHeight);
    //console.log('PriceGroupsHeight is ' + PriceGroupsHeight);

    var panelHeadingHeight = $(".panel-heading:first").css("height");
    panelHeadingHeight = panelHeadingHeight.replace('px', '');
    panelHeadingHeight = parseInt(panelHeadingHeight);
    //console.log('panelHeadingHeight is ' + panelHeadingHeight);

    //console.log('#cart-items-list is ' + $("#cart-items-list" ).css("height"));
    //console.log('window.TabHeightFromCSS s  ' + window.TabHeightFromCSS);
    var newHeight = '';

    //going UP from middle
    if (($("#cart-items-list").css("height") == window.TabHeightFromCSS) && direction == 'up') {

        if (window.scaledWindowHeight > 800) { //desktop
            newHeight = $(window).height() - footerHeight - panelHeadingHeight - 20;
        } else { // mobile (portrait)
            newHeight = $(window).height() - footerHeight - fceButtonsHeight - PriceGroupsHeight - panelHeadingHeight;
        }

        $("#cart-items-list").animate({height: 0 + 'px'}, 100);
        $("#swiper-height-relative").animate({height: newHeight + 'px'}, 100);
        $('.alpha-slider-container, .alpha-scroll, .slider-track').css('height', (newHeight - 120) + 'px'); //VV
        $('#expand-tab span').text('Shrink Tab');
    }

    //going to the BOTTOM from middle
    if (($("#cart-items-list").css("height") == window.TabHeightFromCSS) && ((direction == 'down') || (direction == 'toggle'))) {

        //doesn't play nice on desktop - TODO later
        console.log('scaledWindowWidth is ' + scaledWindowWidth);
        if (window.scaledWindowWidth > 800) { //desktop - landscape mode
            /*
             $('#fulloverflow').removeClass('hide');
             $('#category_and_search_buttons').hide();
             //$("#product-collapse").hide();
             $( "#cart-items-list" ).animate({height: 750 + 'px'}, 400);
             $('#cart-items-list').css("background-color","silver");
             $('#cart-items-list').css("z-index","3000");
             $('#fulloverflow').css("z-index","2000");
             $('#product-collapse').css('position', 'absolute');

             $('#product-collapse').css('left', (window.productCollapse.left) + 'px');
             $('#product-collapse').css('width', window.productCollapse.width +'px');
             $('#product-collapse').css('height', window.productCollapse.height +'px');
             $('#product-collapse').css('top', window.productCollapse.top + 'px');
             $('#product-collapse').css('position', 'absolute');
             */
            //TEMPORARY SOLUTION
            newHeight = $(window).height() - footerHeight - panelHeadingHeight - 20;
            console.log('newHeight is ' + newHeight);
            $("#product-container").hide("slide", {direction: 'down'}, "slow", function() {
                $("#cart-items-list").animate({height: newHeight + 'px'}, 300)
            });

        } else { //mobile - portrait mode

            newHeight = $(window).height() - footerHeight - fceButtonsHeight - PriceGroupsHeight - panelHeadingHeight + 10;

            $("#cart-items-list").animate({height: newHeight + 'px'}, 400, function() {
                $("#product-container").hide();
            });
            $("#swiper-height-relative").animate({height: 0 + 'px'}, 400);
            $('#expand-tab span').text('Shrink Tab');

        }
    }

    //going to the MIDDLE (default position) from bottom or up
    if ($("#cart-items-list").css("height") != window.TabHeightFromCSS) {

        //doesn't play nice on desktop - TODO later
        if (window.scaledWindowWidth > 800) { //desktop
            /*
             $('#fulloverflow').addClass('hide');
             //$("#product-collapse").hide();
             $( "#cart-items-list" ).animate({height: 223 + 'px'}, 400, function(){
             $('#cart-items-list').css("background-color","");
             $('#cart-items-list').css("z-index","");
             $('#fulloverflow').css("z-index","");
             $('#product-collapse').css('position', '');
             $('#product-collapse').css('left', '');
             $('#product-collapse').css('top', '');
             $('#product-collapse').css('width', '');
             $('#product-collapse').css('height', '');
             });
             */

            //TEMPORARY SOLUTION
            $("#cart-items-list").animate({height: window.TabHeightFromCSS}, 400, function() {
                $("#product-container").show("slide", {direction: "down"}, "slow");
                $('.alpha-slider-container, .alpha-scroll, .slider-track').css('height', window.AplhaScrollHeight);
                $("#swiper-height-relative").animate({height: window.swiperHeightRelativeHeigth}, 400);

            });

        } else { //mobile

            $("#product-container").show();
            $("#cart-items-list").animate({height: window.TabHeightFromCSS}, 400);
            $('.alpha-slider-container, .alpha-scroll, .slider-track').css('height', window.AplhaScrollHeight);
            $("#swiper-height-relative").animate({height: window.swiperHeightRelativeHeigth}, 400);

        }
    }


} //fce ChangeTabHeight(direction)

/**
 * Remembers in sessionstorage current active tab
 * @param {type} tabs_identifier
 * @returns {undefined}
 */
function remember_current_active_tab(tabs_identifier) {
//    alert('jfdbjh');
//
    sessionStorage.setItem('order_type_action', tabs_identifier);
}

/**
 * Recalculates price depend on delivery fee
 * @returns {undefined}
 */
function price_recalculation() {
    var fullDeliveryAddress = $('#modal-checkout-delivery-address').val().split(' ');
    var fee = fullDeliveryAddress[fullDeliveryAddress.length - 1];
    fee = fee.replace(/[^0-9]/g, '');

    var price = getWellFormedPriceFromTotalField(fee);
    creditCardFeeStorage.priceBeforeFee = price;
//                                creditCardFeeStorage.priceBeforeSelectField = myCart.getTotal();

//                                window.alert('ggf');

//    currentTotalPrice = price;
    //currentTotalPrice = ' - $' + price;
    return price;
//                               currentTotalPrice = currentTotalPrice.toString();
}

Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/**
 *  Checks multidimensional array for emptyness
 *
 * @returns {Boolean} - true if array is empty  otherwise false
 */

Array.prototype.isEmptyMultiArray = function() {

    // if array is empty at all
    if (!this) {
        return false;
    }

    var is_empty = true;

    $.each(this, function() {
        if ($(this).length) {
            is_empty = false;
            return;
        }
    })

    return is_empty;
}


//VV HACK - hiding 'DON'T KNOW YET' on the Pay Now tab - TODO
function HideDontKnowYet() {
     $('[data-type="3"]').hide();
     $('[data-type="2"]').css("border-radius","0px 5px 5px 0px")

}

function ShowDontKnowYet() {
     $('[data-type="3"]').show();
     $("[data-type='3']").css("border-radius","0px 5px 5px 0px")
     $('[data-type="2"]').css("border-radius","0px 0px 0px 0px")

}


