

function markAllItemsAsUnprinted(items) {
    var parsedItems = JSON.parse(items);
    for (var i = 0; i < parsedItems.length; i++) {
        parsedItems[i]['printed'] = false;
    }

    parsedItems = JSON.stringify(parsedItems);
    return parsedItems;
}

$('#printOnlyNewItems').change(function() {
    if (this.checked) {
        var printers = new PrintersMarking();
        var ids = printers.getIdsFromDOM();

        printers.disableNotNecessaryPrinters(ids);
//        printers.whatPrintersToSelect(ids);
    } else {

        var printers = new PrintersMarking();
        var ids = printers.getIdsFromDOM(true);
        printers.whatPrintersToSelect(ids);
    }
})


function setFrontPrinterOnly(){ //VV HACK FUNCTION - TEMP SOLUTION TODO


    $('#id_customers_docket_closed_orders').tab('show');
    $('#modal-closed-orders-printers button').children('span').text('');
    $('#modal-closed-orders-printers button').removeClass('active');
    $('#modal-closed-orders-printers button').attr("data-count","0");


    $('#modal-closed-orders-printers_second button').children('span').text('');
    $('#modal-closed-orders-printers_second button').removeClass('active');
    $('#modal-closed-orders-printers_second button').attr("data-count","0");


    $('#modal-closed-orders-printers_second button[data-id="1"]').children('span').text('1x ');
    $('#modal-closed-orders-printers_second button[data-id="1"]').addClass('active');
    $('#modal-closed-orders-printers_second button[data-id="1"]').attr("data-count","1");

    //$('#modal-closed-orders-printers_second button[data-id="1"]').trigger("click");

}


// enabliing the reaction of kitchen's docket to actions in the customer's docket
function setRelationBetweenCustomerAndKitchenDockets() {

//    if ($('#id_customers_docket').parent().hasClass('active') || $('#id_customers_docket_delivery').parent().hasClass('active'))
    {

        var elementsToCheckOnlyKitchen = ['#modal-checkout-takeway-printers', '#modal-checkout-delivery-printers'
        ], elementsToCheckOnlyCustomers = ['#modal-checkout-takeway-printers_second', '#modal-checkout-delivery-printers_second',
        ];


        var totalLength = elementsToCheckOnlyCustomers.length;
        for (var i = 0; i < totalLength; i++) {

//               var allButtonsCustomersDocket = $('#modal-checkout-takeway-printers_second').find('.btn'),
            var allButtonsCustomersDocket = $(elementsToCheckOnlyCustomers[i]).find('.btn'),
                    allButtonsKitchenDocket = $(elementsToCheckOnlyKitchen[i]).find('.btn');

            for (var i2 = 0; i2 < allButtonsCustomersDocket.length; i2++) {
                if (!$(allButtonsCustomersDocket[i2]).hasClass('asterisk_input')) {
                    $(allButtonsKitchenDocket[i2]).removeClass('asterisk_input');
                } else {
                    $(allButtonsKitchenDocket[i2]).addClass('asterisk_input');
                }
            }

        }
    }
}

function getManagerPrinterId()
{
    return globalSettings.getDefaultManagersPrinter();
}


setNumberOfCopiesForCustomersDocket.statesOfMainPrinters = [globalSettings.getCustomersCopiesNumber(), globalSettings.getCustomersCopiesNumber()];
function setNumberOfCopiesForCustomersDocket(rememberState, exactElement, resetAll) {

    if (typeof resetAll != 'undefined') {

        $.each(setNumberOfCopiesForCustomersDocket.statesOfMainPrinters, function(index, elem) {
            setNumberOfCopiesForCustomersDocket.statesOfMainPrinters
                    [index] = globalSettings.getCustomersCopiesNumber();
        })


        return true;
    }


    rememberState = rememberState | false;
    var def = globalSettings.getDefaultPrinter();

    if (rememberState) {
        // checking default printer buttons
        // button of default printer was clicked
        if ($(exactElement).attr('data-id') == globalSettings.getDefaultPrinter())
        {
            //detection of which tab is active currently
            var elements = $('#modal-checkout-type-nav').children();

            $.each(elements, function(index, elem) {

                setNumberOfCopiesForCustomersDocket.statesOfMainPrinters[index] = $(exactElement).attr('data-count');
            })
        }
        return true;
    }

    var elementsToSetNumberOfCopiesAsCustomersDocket = ['#modal-checkout-takeway-printers_second', '#modal-checkout-delivery-printers_second'];

//    var numberOfCopiesSetByUser = setANewNumberOfCopies | false;
//    if (numberOfCopiesSetByUser){
//        globalSettings.setCustomersCopiesNumber(numberOfCopiesSetByUser)
//    }

    var customersDocketNumberOfCopiesDefault = globalSettings.getCustomersCopiesNumber();
    var customersDocketNumberOfCopies = setNumberOfCopiesForCustomersDocket.statesOfMainPrinters;

    if (customersDocketNumberOfCopies != 0)
    {
        for (var i = 0; i < elementsToSetNumberOfCopiesAsCustomersDocket.length; i++)
        {
            $.each($(elementsToSetNumberOfCopiesAsCustomersDocket[i]).find('button'), function(index, elem)
            {

                if ($(elem).attr('data-id') == def)
                {
//                    $(this).addClass('active');
                    if (customersDocketNumberOfCopies[i] == 0)
                    {
                        $(this).children('span').text();
                        $(this).find('span').html('');
                        customersDocketNumberOfCopies[i] = 0;
                        $(this).attr('data-count', customersDocketNumberOfCopies[i]);
                    }
                    else if (customersDocketNumberOfCopies[i] !== false)
                    {
                        // reset to zero
                        $(this).attr('data-count', customersDocketNumberOfCopies[i]);
                        $(this).find('span').html(customersDocketNumberOfCopies[i] + 'x ');
                    }
                    else
                    {
                        $(this).children('span').text(customersDocketNumberOfCopiesDefault + 'x ');
                        $(elem).attr('data-count', customersDocketNumberOfCopiesDefault);
                    }
                }
            })

        }
    }
}

// strips duplicates
function uniq(a) {
    return a.sort().filter(function(item, pos) {
        return !pos || item != a[pos - 1];
    })
}

function PrintersMarking()
{
    var _this = this;
    this.storageItemsIds = [];

    this.disableNotNecessaryPrinters = function(activeItemIds) {



        var _sy = new syncHandler(),
                _db = _sy.getDbInstance();

        var q = "";
        for (var i = 0; i < activeItemIds.length; i++) {
            q += '"' + activeItemIds[i] + '", ';
        }

        q = q.substring(0, q.length - 2);
        var query = 'SELECT * FROM "products" WHERE "id"  IN (' + q + ')';
        _db.transaction(function(tx) {
            tx.executeSql(query, [], function(tx, results) {

                var elementsToCheck = ['#modal-park-order-printers_second'];
//                console.log(results);
                var printerIds = [];
                {

                    for (var i = 0; i < results.rows.length; i++) {
                        printerIds.push(results.rows.item(i).idPrinter);
                    }

                    printerIds = uniq(printerIds);

                    for (var i = 0; i < elementsToCheck.length; i++)
                    {
                        $.each($(elementsToCheck[i]).find('button'), function(index, elem) {

                            var idPrinter = $(this).attr('data-id');


                            if ($.inArray(Number(idPrinter), printerIds) == -1) {
                                $(this).children('span').text('');
                                $(this).attr('disabled', true);
                            }
                        })
                    }
                }
            }, function(a, b) {
                console.warn(' products where in problem ' + a);
                console.warn(b);
            })
        })

    }

    // checks what printers should be selected
    this.whatPrintersToSelect = function(activeItemIds, numberOfNewItemsInTheBasket, customItemsPrintersIds) {

        var _sy = new syncHandler(),
                _db = _sy.getDbInstance();

        var q = "";
        for (var i = 0; i < activeItemIds.length; i++) {
            q += '"' + activeItemIds[i] + '", ';
        }

        q = q.substring(0, q.length - 2);
        var query = 'SELECT * FROM "products" WHERE "id"  IN (' + q + ')';
        _db.transaction(function(tx) {
            tx.executeSql(query, [], function(tx, results) {
//                console.log(results);

                var printerIds = [];

                //attaching custom items
                if (customItemsPrintersIds) {
                    printerIds = printerIds.concat(customItemsPrintersIds);
                }
//                if (results.rows.length > 0)
                {

//                    alert('fdd');

                    for (var i = 0; i < results.rows.length; i++) {
                        printerIds.push(results.rows.item(i).idPrinter);
                    }

                    printerIds = uniq(printerIds);
                    //first tab of printers
                    var elementsToCheck = ['#modal-checkout-takeway-printers', '#modal-checkout-delivery-printers',
//                        '#modal-park-order-printers',
                        '#modal-closed-orders-printers',
                        '#modal-closed-orders-printers_second',
//                        '#modal-checkout-takeway-printers_second', '#modal-checkout-delivery-printers_second',

                        '#modal-park-order-printers_second'
                    ];


                    var elementsToCheckOnlyKitchen = ['#modal-checkout-takeway-printers', '#modal-checkout-delivery-printers',
                        '#modal-park-order-printers', '#modal-closed-orders-printers',
                    ];

                    var elemtsToCheckOnlyCustomers = ['#modal-checkout-takeway-printers_second', '#modal-checkout-delivery-printers_second',
                        '#modal-closed-orders-printers_second'];

                    // if all items in the kitchen were printed
                    var elementsToDisablePrinterButtons = ['#modal-park-order-printers_second'];

//                    setNumberOfCopiesForCustomersDocket();

                    for (var i = 0; i < elementsToCheck.length; i++)
                    {

                        var current = $(elementsToCheck[i]);
                        var number = $(elementsToCheck[i]).find('button');

                        $.each($(elementsToCheck[i]).find('button'), function(index, elem) {
//                        console.log($(this).attr('data-id'));
                            var dataId = $(this).attr('data-id'),
                                    data_count = $(this).attr('data-count');

                            $(this).removeClass('active');
                            for (var i = 0; i < printerIds.length; i++)
                            {
                                if (dataId == printerIds[i]) {
                                    $(this).addClass('active');
                                    $(this).children('span').text('1x ');
                                    $(this).attr('data-count', 1); // 1 by default
                                    $(this).attr('disabled', false);
                                }
                            }

                            // only on parking window
                            if ($(this).children('span').text() == "" && current.attr('id') == "modal-park-order-printers_second") {
                                $(this).attr('disabled', true);
                            }
                        })
                    }

                    for (var i = 0; i < elementsToCheckOnlyKitchen.length; i++) {
                        $.each($(elementsToCheckOnlyKitchen[i]).find('button'), function(index, elem) {
                            if (!$(this).hasClass('active')) {
                                $(this).attr('disabled', true);
                            }

                        })
                    }

                    // disabling all buttons for printing if already printed items are printed
//                    if (typeof numberOfNewItemsInTheBasket != 'undefined' && numberOfNewItemsInTheBasket == 0)
                    {

                        for (var i = 0; i < elementsToDisablePrinterButtons.length; i++) {
                            $.each($(elementsToDisablePrinterButtons[i]).find('button'), function(index, elem) {
                                if (!$(this).children('span').text().length) {
                                    $(this).attr('disabled', true);
//                                    $(this).children('span').text('');
                                }
                            })
                        }
                    }



                    for (var i = 0; i < elemtsToCheckOnlyCustomers.length; i++)
                    {
                        $.each($(elemtsToCheckOnlyCustomers[i]).find('button'), function(index, elem) {
                            if ($(this).hasClass('active')) {
                                $(this).attr('data-count', 1);
                                $(this).children('span').text('1x ');
                            }
                        })
                    }


//                    var globalIds = globalSettings.drawersIds;
                }
//                else
                {
//                    console.log("no results were found");
                }

                settingAsterisk(1);
                setNumberOfCopiesForCustomersDocket(false, false, true);
                setRelationBetweenCustomerAndKitchenDockets();



            }, function(a, b) {
                console.warn(' products where in problem ' + a);
                console.warn(b);
            })
        })
    }



// of products
    this.getIdsFromDOM = function(addPrintedOrNot) {

        var shouldPrintPrintedItems = addPrintedOrNot | false;

        var storageItemsIds = [];
        $.each($('#list-cart').find('a'), function()
        {
            var id = $(this).attr('data-id');
            if ($.isNumeric(id)) {
                if (shouldPrintPrintedItems) {
                    storageItemsIds.push(id);
                } else
                if ($(this).attr('data-printed') == "false") { // we don't add already printed items
                    storageItemsIds.push(id);
                }
            }
//            console.log($(this).attr('data-id'))
        })

        return storageItemsIds;
    }


    this.addIdsForCustomItems = function() {

    }


    // of products
    this.getIdsFromDbAndMark = function(uniqueID) {

        var sy = new syncHandler(),
                db = sy.getDbInstance();


        db.transaction(function(tx) {
            tx.executeSql('SELECT "contents" FROM "orders" WHERE "unique_id"=?', [uniqueID], function(tx, results) {

//                alert("fgdjnvdjk");

                if (results.rows.length > 0) {
                    var activeIds = [], directPrintersIds = [],
                            content = results.rows.item(0).contents;

                    var elementsAsObjects = JSON.parse(content);


                    for (var i = 0; i < elementsAsObjects.length; i++)
                    {
                        activeIds.push(elementsAsObjects[i].id);

                        if (typeof elementsAsObjects[i].custom_items_printers != undefined) {
                            var res = getFilteredPrintersOnCustomOrders(elementsAsObjects[i].custom_items_printers);
                            directPrintersIds.push(res);
                        }
                    }

                    console.log(activeIds);


//                    console.log('direct ids ' + directPrintersIds);

//                    var printersIdsCustom = getActivePrintersOnCustomOrdersFromDb();
//                    activeIds = concat.activeIds()


                    _this.whatPrintersToSelect(activeIds, false, directPrintersIds);
                } else {
                    console.log("kind of critical error, order wasn't found in local db jojoijiofd");
                }

            }, function(a, b) {
                console.warn(' problem in getidsfromDb ' + a);
                console.warn(b);
            })
        })
    }

// marks printers as selected in DOM
    this.selectPrinters = function(ids) {

    }
}


function showFormattedTime(message)
{
    var d = new Date();
    console.log(message + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
}


function getProductCache(product_id)
{
    console.log("trying to take from storage " + product_id);

    var data = localStorage.getItem(product_id);
    if (data)
    {
        console.log("found in storage");
        return JSON.parse(data);
    }

    console.log("not found in storage");
    return false;
}

function saveOptionsToLocalStorage(product_id, data)
{
    console.log("saved to storage " + product_id);
    localStorage.setItem(product_id, JSON.stringify(data));
}

function cleanLocalStorageFromItems()
{
    var allKeys = Object.keys(localStorage);
    var length = allKeys.length;

    for (var i = 0; i < length; i++)
    {
        if (!isNaN(parseInt(allKeys[i])))
        {
            localStorage.removeItem(allKeys[i]);
        }
    }

    sessionStorage.removeItem('order_code_from_html');
    sessionStorage.removeItem('unique_id_from_html');

    localStorage.removeItem('gcLsCart');

    $('#list-cart').removeClass('takenFromPark');

    $('#list-cart').removeAttr('order_code');
    $('#list-cart').removeAttr('unique_id');

    Cachestorage.clean();
}



function restoreInformationAboutPrintersForCustomItems()
{/*
 var items =   sessionStorage.getItem('informationAboutPrintersForCustomItems');

 */


}

function saveInformationAboutPrintersForCustomItems()
{
    /*

     var storage = [];
     var storageEntiry = {
     'key': 0,
     'printers': 0
     }
     $.each($('#list-cart').find('tr td.order-list-name a[data-custom-items-printers]'), function (ind, elem) {

     storageEntiry.key = $(elem).attr('data-cartid');
     storageEntiry.printers = $(elem).attr('data-custom-items-printers');
     storage.push(storageEntiry);
     })

     sessionStorage.setItem('informationAboutPrintersForCustomItems', storage);
     */

}


$(document).ready(function() {


    $(window).unload(function() {
//        alert("onunload");
    })

    $(window).on('beforeunload', function()
    {

//        alert("unloading");
        // if there is any order in the cart and we reload page, we should keep order code in html page

        if (isOrderTakenFromTheKitchen() && $('#list-cart').is('[order_code]'))
        {
            var order_code = $('#list-cart').attr('order_code'),
                    unique_id = $('#list-cart').attr('unique_id');

            sessionStorage.setItem('order_code_from_html', order_code);
            sessionStorage.setItem('unique_id_from_html', unique_id);
            sessionStorage.setItem('tableName', storeTableForOrder.nameOfTable);

            saveInformationAboutPrintersForCustomItems();

            console.log("order code is saved " + order_code);
            console.log("unique id is saved " + unique_id);
        }

        console.log("just loaded");
    })

    window.onload = function(e)
    {

        var order_code = sessionStorage.getItem('order_code_from_html'),
                unique_id = sessionStorage.getItem('unique_id_from_html');

        storeTableForOrder.nameOfTable = sessionStorage.getItem('tableName');

        if (order_code)
        {
            console.log("restoring " + order_code);
            $('#list-cart').addClass('takenFromPark');
            $('#list-cart').attr('order_code', order_code);
            $('#list-cart').attr('unique_id', unique_id);
            sessionStorage.removeItem('order_code_from_html');
            sessionStorage.removeItem('unique_id_from_html');
            sessionStorage.removeItem('tableName');
            restoreInformationAboutPrintersForCustomItems();

        }
        console.log("usual loading");
    }

});

function isOrderTakenFromTheKitchen()
{
    if ($('#list-cart').hasClass('takenFromPark'))
    {
        return true;
    }
    return false;
}

// checking out checking whether this order was parked already
function checkoutWithCaution(typeOfPayment)
{

    var sy = new syncHandler(),
            db = sy.getDbInstance();

    var order_code = myCart.getOrderCodeFromFieldOnPage(),
            unique_id = $('#list-cart').attr('unique_id');

    if (!order_code) {
        console.log("usual check outing");

        if (typeOfPayment == 'delivery') {
            myCart.checkoutDelivery();
        }
        else {
            myCart.checkout();
        }
//        function_to_call();
        return true;
    }

    console.log("avoiding parking twice");


    if (typeof unique_id == 'undefined')
    {
        console.log("gfkm critical order code problem");
    }


    $.ajax({
        url: "/data",
        type: "POST",
        context: document.body,
        data: {
            'request': 'avoidCheckoutingParkedOrderTwice',
            'token': getToken(),
            'order_code': order_code,
            'unique_id': unique_id
        }
    }).success(function(response) {
        saveToken(response._token);

        if (response['exists'])
        {
            alert("This order was already checked out");
            $('#modal-checkout-type-close').trigger("click");
            myCart.clearCart();
            updateCartElements();
            myCart.removeOrderByOrderCode(order_code);

            //and now we should delete this order from websql

            return true;
        }
        else
        {
            var objOrderCode = [];
            objOrderCode['order_code'] = order_code;

            console.log("first time");
//            return true;
            if (typeOfPayment == 'delivery') {
                myCart.checkoutDelivery(objOrderCode, unique_id);
            }
            else {
                myCart.checkout(objOrderCode, unique_id);
            }

        }

    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
        alert("achtng");
    });



}


function packObjectForSync(data)
{
    var Syncronisation = {};
    Syncronisation.unique_id = data['unique_id'];
    Syncronisation.order_code = data['order_code'];
    return Syncronisation;
}


function getUniqueID() {

    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;

}


function getPriceFromActiveTab() {

    var currentTotalPrice = 0;

    // dine-in/takeaway tab
    if ($('a[href="#modal-checkout-type-takeaway"]').parent().hasClass('active')) {
        console.log("taking from dine-in tab");
        currentTotalPrice = $('#checkout-submit-button').children('.checout-total-container').text();
    }
    // delivery tab
    else if ($('a[href="#modal-checkout-type-delivery"]').parent().hasClass('active')) {
        console.log("taking from delivery tab");
        currentTotalPrice = $('#checkout-delivery-button').children('.checout-total-container').text();
    }
    // park window
    else {
        console.log("parking window");
        currentTotalPrice = $('#checkout-submit-button-park').children('.checout-total-container').text();
    }

    return currentTotalPrice;
}


// 20.00  - in such format
function getWellFormedPriceFromTotalField(fee) {


    if (typeof fee == 'undefined' || fee == '') {
        fee = 0;
    }

    var currentTotalPrice = 0;

//      cart-total
//   if (   )

//    var currentTotalPrice = $('#checkout-delivery-button').children('.checout-total-container').text();
    currentTotalPrice = getPriceFromActiveTab();
  //  var position = currentTotalPrice.indexOf('$');
  //  currentTotalPrice = currentTotalPrice.slice(position);

    currentTotalPrice = currentTotalPrice.replace(/[^0-9|^-]/g, '');  // converting $3  to 300 cents


//    var savingCurrentTotalPrice = currentTotalPrice;

    // multiplied by 100 , because in dollars not in cents
    currentTotalPrice = parseInt(fee) * 100 + parseInt(currentTotalPrice);
    var lastTwoDigits = currentTotalPrice % 100,
            firstDigits = currentTotalPrice / 100 >> 0;

    // e.g. $20.4 is not good, we need to do $20.40
    lastTwoDigits = lastTwoDigits.toString();

//    if (lastTwoDigits.length == 1) {
//        lastTwoDigits = lastTwoDigits + '0';
//    }

    if (lastTwoDigits.length == 1 && (currentTotalPrice % 100 < 10)) {
        lastTwoDigits = '0' + lastTwoDigits;
    } else if (lastTwoDigits.length == 1) {
        lastTwoDigits = lastTwoDigits + '0';
    }


    currentTotalPrice = firstDigits + '.' + lastTwoDigits;
    return currentTotalPrice;
}


function unParseDeliveryFee(previousPrice) {
    var currentDeliveryFee = $('#modal-checkout-delivery-address').val();
    currentDeliveryFee = currentDeliveryFee.replace(/[^0-9]/g, '');
    var prev = previousPrice;

}




function settingAsterisk(val)
{
//    if (val)
    {
        if (checkIfCashIsSelected())
//    if (checkIfCashIsSelected() && (getManagerPrinterId() != '0'))
        {

//        var searchedDataId = localStorage.getItem('default_drawer_kick_open_print');
            var searchedDataId = globalSettings.getDefaultDrawer();
//            var elementsB = $('#modal-checkout-takeway-printers').find(".btn");
            var elementsB = $('#modal-checkout-takeway-printers').find(".btn"),
                    elementsC = $('#modal-checkout-takeway-printers_second').find(".btn");

// kitchen docket
            $.each(elementsB, function() {
//                if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0) {
                if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0 && $(this).hasClass('active')) {
                    // test for presense of Numberx symbol in line
                    $(this).addClass("asterisk_input");
                } else if
                        ($(this).attr('data-id') == searchedDataId && $(this).is(":disabled")) {
                    $(this).addClass("asterisk_input");
                }


            })

            // customer's  docket
            $.each(elementsC, function() {
//                if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0) {
                if ($(this).attr('data-id') == searchedDataId && $(this).hasClass('active')) {
//                if ($(this).attr('data-id') == searchedDataId) {
                    // test for presense of Numberx symbol in line
                    $(this).addClass("asterisk_input");
                }
            })


        }
    }

    updatingCashPrice('');
//    console.log("this one");

}

function unsettingAsterisk(button) {

    if (typeof button != "undefined")
    {
        button.removeClass('asterisk_input');
    }
    else {
//    var searchedDataId = localStorage.getItem('default_drawer_kick_open_print');
        var searchedDataId = globalSettings.getDefaultDrawer();
//    var elementsB = $('#modal-checkout-takeway-printers').find(".btn");
        var elementsB = $.merge($('#modal-checkout-takeway-printers').find(".btn"), $('#modal-checkout-takeway-printers_second').find(".btn"));
        var length = elementsB.length;

        for (var i = 0; i < length; i++)
        {
            if (elementsB[i].attributes['data-id'].value == searchedDataId)
            {
                elementsB[i].classList.remove('asterisk_input');
//                alert("changed");
            }
        }
    }
}


function settingAsteriskDelivery(resetParameter)
{

    if (($.trim($('#modal-checkout-delivery-payment-types-b').children('a.active').text()) == 'Cash'))
//            && !$('#id_kitchen_docket_delivery').parent().hasClass('active') ) ||
//            ($.trim($('#modal-checkout-delivery-payment-types-b').children('a.active').text()) == 'Cash' &&
//            resetParameter))
    {
        var searchedDataId = globalSettings.getDefaultDrawer();
//        var elementsB = $('#modal-checkout-delivery-printers').find(".btn");
        var elementsB = $('#modal-checkout-delivery-printers').find(".btn"),
                elementsC = $('#modal-checkout-delivery-printers_second').find(".btn");
        var length = elementsB.length;


// kitchen docket
        $.each(elementsB, function() {
//            if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0) {
            if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0 && $(this).hasClass('active')) {
                $(this).addClass("asterisk_input");
            } else if
                    ($(this).attr('data-id') == searchedDataId && $(this).is(":disabled")) {
                $(this).addClass("asterisk_input");
            }
        })

//customer's docket
        $.each(elementsC, function() {
//            if ($(this).attr('data-id') == searchedDataId && $(this).attr('data-count') != 0) {
            if ($(this).attr('data-id') == searchedDataId && $(this).hasClass('active')) {
                $(this).addClass("asterisk_input");
            }
        })

    }

    updatingCashPrice('');
//    console.log("this one");
}

function unsettingAsteriskDelivery(button)
{

    if (typeof button != "undefined")
    {
        button.removeClass('asterisk_input');
    } else {

//    var searchedDataId = localStorage.getItem('default_drawer_kick_open_print');
        var searchedDataId = globalSettings.getDefaultDrawer();
//    var elementsB = $('#modal-checkout-delivery-printers').find(".btn");
        var elementsB = $.merge($('#modal-checkout-delivery-printers').find(".btn"), $('#modal-checkout-delivery-printers_second').find(".btn"));
        var length = elementsB.length;


        for (var i = 0; i < length; i++)
        {
            if (elementsB[i].attributes['data-id'].value == searchedDataId)
            {
                elementsB[i].classList.remove('asterisk_input');
//                alert("changed");
            }
        }
    }
}

