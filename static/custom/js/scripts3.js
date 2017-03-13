/** @fileOverview  this file was created to fasten uploading of files via ftp */

/*
 *
 * @returns {Number}
 */

function getActiveSelection() {

    var correspElem = $('.half-selections:not(.hide)');
    var idOfElem = $(correspElem).attr('id');
    var wasFound = 0;

    if (idOfElem) {

        var cleanedId = idOfElem.replace(/[^0-9]/g, '');

        $.each($(".half-selector-option-all"), function (ind, elem) {

            var attrName = $(elem).attr('name');

            if (attrName && attrName != '') {
                var cleanedName = attrName.replace(/[^0-9]/g, '');

                if (cleanedName == cleanedId &&  ( $(elem).val() || $(elem).select2('data').id)) { //VV
                    wasFound++;
                    return false;
                }
            }
        })
    }
    return wasFound;

}


function setPrintersForCustomItems() {

    $('#modal-custom-orders-printers').removeClass('hidden');
    $('#modal-custom-orders-printers').find('label.btn').removeClass('active');
    $('#modal-custom-orders-printers').find('label.btn input').attr('data-count', 0);
    $('#checkbox_hide_printers_custom_items_controller').removeClass('hidden');

}

function resetPrintersOfCustomItems() {
    $('.btn-printer-custom_orders').attr('data-count', 0);
    $("[name='checkbox_hide_printers_custom_items']").bootstrapSwitch('state', true);
    $('#modal-custom-orders-printers').addClass('hidden');

    $('#checkbox_hide_printers_custom_items_controller').addClass('hidden');

}


// only for $ items
/**
 *
 * @returns {undefined} - returns corresponding id which should be passed further
 */
function getIdForCustomItem(content) {

    if (!content) {
        if ($('.btn-printer-custom_orders.active').length > 1) {
            alert("console log , critical error, no more than one printer can be selected ");
        }

    }
    var index = 0;

//    $('.btn-printer-custom_orders.active')
//
//    $('.btn-printer-custom_orders.active').attr('data-count')
    var idOfPrinter = 0;
    if (!content) {
        idOfPrinter = $('.btn-printer-custom_orders.active').attr('data-id');
    } else {
        var content = JSON.parse('[' + content + ']');
        $.each($(content), function (ind, elem) {
            if ($(elem)[0].copies != 0) {
                idOfPrinter = $(elem)[0].printer_id;
            }
        })
    }

    $.each(storePrinterForCustomItems.storage, function (ind, elem) {
        if ($(elem)[0].idOfPrinter == idOfPrinter) {
            index = $(elem)[0].idOfItem;
            return;
        }
    })


    return index;
}

storePrinterForCustomItems.storage = [];
storePrinterForCustomItems.lookup = [];
function storePrinterForCustomItems(idOfItem, idOfPrinter) {
    storePrinterForCustomItems.storage.push({'idOfItem': idOfItem, 'idOfPrinter': idOfPrinter});

}

function customItemsPrinterLimitations(currentButton) {

    var numberOfClicks = 0;

    if ($('#modal-discount').attr('aria-hidden') == "false") {

        // if current printer has more than one copies we can't allow the second printer to be selected
        $.each($('#modal-custom-orders-printers .btn-printer-custom_orders'), function (ind, elem) {

// if this is not this printer and we try to increment count of copies
            if ($(currentButton).get(0) !== $(elem).get(0)) {
                numberOfClicks += Number($(elem).attr('data-count'));
            }
        })
    }

    return numberOfClicks;

}



function getActivePrintersOnCustomOrdersFromDb() {
}


function getFilteredPrintersOnCustomOrders(sourceOfData) {

    var printersIds = [];

    // parsing data from DOM
    if (!sourceOfData) {

        $.each($('#list-cart').find('tr td.order-list-name a[data-custom-items-printers]'), function (ind, elem) {
            if ($(elem).attr('data-custom-items-printers').length) {

                var properlyFormedJSON = '[' + $(elem).attr('data-custom-items-printers') + ']';
                var unparsedJSON = JSON.parse(properlyFormedJSON);

                $.each(unparsedJSON, function (index, element) {
                    if (element.copies != 0) {
                        printersIds.push(element.printer_id);
                    }
                })
            }
        })
    } else         // parsing data from passed source
    {

        var properlyFormedJSON = '[' + sourceOfData + ']';
        var unparsedJSON = JSON.parse(properlyFormedJSON);

        $.each(unparsedJSON, function (ind, elem) {
            if (elem.copies != 0) {
                printersIds.push(elem.printer_id);
            }
        })
    }
    return printersIds;
}

function getActivePrintersOnCustomOrders() {


    if ($('input[name="checkbox_hide_printers_custom_items"]').is(':checked') == false) {
        return false;
    }

    var listNumberOfCopies = [];
    // if printers are not hidden
    if ($("input[name='checkbox_hide_printers_custom_items']").is(':visible'))
    {

//        $.each($('.btn-printer-custom_orders'), function(index, element) {
        $.each($('#modal-custom-orders-printers').find('input'), function (index, element) {
            var idPrinter = $(element).attr('data-id'),
                    numberCopies = $(element).attr('data-count');

            listNumberOfCopies.push(JSON.stringify({'printer_id': idPrinter, 'copies': numberCopies}));
        })
    }

    return listNumberOfCopies;
}


$('#modal-discount').on('show.bs.modal', function (e) {

    var sy = new syncHandler(),
            db = sy.getDbInstance();

    db.transaction(function (tx) {
        tx.executeSql('SELECT "id","printer_name" FROM "printers" WHERE "status"=?', [1], function (tx, results) {
            var printers = [];
            for (var i = 0; i < results.rows.length; i++) {
                printers.push({
                    'name': results.rows.item(i).printer_name,
                    'id': results.rows.item(i).id
                });
            }

            var printers_html = Mustache.to_html($('#modal-checkout-printer-list-radiobuttons').html(), {'printers': printers, 'type': 'custom_orders'});
            $('#modal-custom-orders-printers').html(printers_html);

            $("[name='checkbox_hide_printers_custom_items']").bootstrapSwitch('state', true);

        });

    })


    $("[name='checkbox_hide_printers_custom_items']").bootstrapSwitch('onSwitchChange', function (event, state) {

        if (state) { // button got enabled
            $('#modal-custom-orders-printers').show();
            $(this).removeClass('hide');
            $("#textNotifierAboutPrintersStateCustomOrders").show();

        } else { // button was disabled
            $('#modal-custom-orders-printers').hide();
            $(this).addClass('hide');
            $("#textNotifierAboutPrintersStateCustomOrders").hide();
            // cleaning up printers so that item wouldn't got to printer
            $('.btn-printer-custom_orders').parent().removeClass('active');
        }

        Custom_Add_Button.prototype.setActive();

    })




})



function getPriceCreditCardFeeFromField() {


    var price = $('#delivery-checkout-fee').val();
    if ($.isNumeric(price)) {
        return price;
    } else {
        return 0;
    }
}


function isString(o) {
    return typeof o == "string" || (typeof o == "object" && o.constructor === String);
}

storeTableForOrder.nameOfTable = 0;
function storeTableForOrder(nameOfTable) {
    storeTableForOrder.nameOfTable = nameOfTable;
}



var nonNumericalTables = ["Takeaway", "Delivery"];
function getTableForOrder() {
    if (isOrderTakenFromTheKitchen()) {

        if (storeTableForOrder.nameOfTable) {
            var numberOfTable = storeTableForOrder.nameOfTable.match(/\d+/g);
        }

        // Table in range from  1 to 10
        if (numberOfTable) {
            return numberOfTable;
        }

        if (isString(storeTableForOrder.nameOfTable) && (nonNumericalTables[0] == storeTableForOrder.nameOfTable ||
                nonNumericalTables[1] == storeTableForOrder.nameOfTable))
        {
            return storeTableForOrder.nameOfTable;
        }

        // nothing to select
        return false;
    }
}



function isCashButtonActive() {
    if ($('.button-pay-type-dinein[data-type="1"].active').length > 0 ||
            $('.button-pay-type-takeout[data-type="1"].active').length > 0)
    {
        return true;
    }

    return false;
}

/**
 *  Unchecks all selected items before , necessary function
 * @returns {undefined}
 */
function resetChosenExtraIngredients(id)
{
    var elem = $('.first-ingredients-panel').find('#extra-' + id);
    if (elem)
    {
        $('.first-ingredients-panel').find('#extra-' + id).children().prop('checked', false);
    }
}


function deleteEmptyIngredients() {

    var counter = 0;
    $.each($('.options_content_holder .tab-content'), function (index, element) {
        if ($(element).length) {
            $.each($(element), function (ind, elem) {

                if ($(elem) instanceof jQuery && $(elem).find('.checkbox').length) {
                    counter++;
                }
            })
        }
    })

    return counter;
}

/**
 *  Hides tabs with empty ingredients
 * @returns {undefined}
 */
function  cleanUpEmptyOptions() {
    var elem = $('.first-ingredients-panel, .half-pizza-ingredients-panel, .options_content_holder').filter(function (ind, elem) {
        return !$(elem).find('.checkbox').length;
    });

    $(elem).hide();
}

function saveCurrentProductType(type) {
    saveCurrentProductType.type = type;
}


function  setOtderVoidedOnServer(id)
{
    var sy = new syncHandler(),
            db = sy.getDbInstance();


    db.transaction(function (tx) {
        tx.executeSql('UPDATE "orders" SET "voided"=? WHERE "id"=?', [1, id], function (tx, results) {
//            console.log('voided');
        });



//tx.executeSql('SELECT * FROM "product_variations" WHERE "variation_id"=?', [variation_id], function (tx, results) {
        tx.executeSql('SELECT "unique_id" FROM "orders" WHERE "id"=?', [id], function (tx, results) {
//            console.log('voided2');



            if (results.rows.length > 0) {
                var unique_id = results.rows.item(0).unique_id;

//                console.log(unique_id);

                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'setOrderVoided',
                        'token': getToken(),
                        'unique_id': unique_id
                    }
                }).success(function (response) {

                    saveToken(response._token);
                    var id = response;

                    if (!response.result) {
                        console.log("failed  setting order as voided - kdfsnfkj");
                    }


                }).error(function (XMLHttpRequest, textStatus, errorThrown) {

                    console.log("jgfdd - failed setting order as voided");

                });


            } else {
                console.log("nfdk - failed getting unique_id from local db");
            }


        });

    });


}


bindBackspaceForSearchInMainWindow.interVal = false;
bindBackspaceForSearchInMainWindow.numberOfSymbols = 0;
function bindBackspaceForSearchInMainWindow() {

    if (!bindBackspaceForSearchInMainWindow.interVal) {

        bindBackspaceForSearchInMainWindow.interVal = setInterval(function () {
           // console.log('lkml - search in  main window');
            $('#search-control').trigger('keyup');


            // removing blinking of autocomplete
            if ($('#search-control').val().length < bindBackspaceForSearchInMainWindow.numberOfSymbols) {
                $("#search-control").autocomplete("search", $("#search-control").val());
            }

            bindBackspaceForSearchInMainWindow.numberOfSymbols = $('#search-control').val().length;



        }, 100);
    }


}


bindBackspaceForSearchInDeliveryWindowPhone.interVal = false;
bindBackspaceForSearchInDeliveryWindowPhone.numberOfSymbols = 0;
function bindBackspaceForSearchInDeliveryWindowPhone() {

    if (!bindBackspaceForSearchInDeliveryWindowPhone.interVal) {

        bindBackspaceForSearchInDeliveryWindowPhone.interVal = setInterval(function () {
            //console.log('gjjk - search in  delivery window phone field');
            $('#modal-checkout-delivery-phone').trigger('keyup');

            // removing blinking of autocomplete
            if ($('#modal-checkout-delivery-phone').val().length < bindBackspaceForSearchInDeliveryWindowPhone.numberOfSymbols) {
                $("#modal-checkout-delivery-phone").autocomplete("search", $("#modal-checkout-delivery-phone").val());
            }

            bindBackspaceForSearchInDeliveryWindowPhone.numberOfSymbols = $('#modal-checkout-delivery-phone').val().length;

        }, 100);
    }


}


bindBackspaceForSearchInDeliveryWindowAddress.interVal = false;
bindBackspaceForSearchInDeliveryWindowAddress.numberOfSymbols = 0;
function bindBackspaceForSearchInDeliveryWindowAddress() {

    if (!bindBackspaceForSearchInDeliveryWindowAddress.interVal) {

        bindBackspaceForSearchInDeliveryWindowAddress.interVal = setInterval(function () {
            //console.log('ewrw - search in  delivery window address field');
            $('#modal-checkout-delivery-phone').trigger('keyup');

            // removing blinking of autocomplete
            if ($('#modal-checkout-delivery-address').val().length < bindBackspaceForSearchInDeliveryWindowAddress.numberOfSymbols) {
                $("#modal-checkout-delivery-address").autocomplete("search", $("#modal-checkout-delivery-address").val());
            }

            bindBackspaceForSearchInDeliveryWindowAddress.numberOfSymbols = $('#modal-checkout-delivery-address').val().length;

        }, 100);
    }


}


bindBackspaceForSearchInMainWindow.interVal = false;
bindBackspaceForSearchInMainWindow.numberOfSymbols = 0;
function bindBackspaceForSearchInMainWindow() {

    if (!bindBackspaceForSearchInMainWindow.interVal) {

        bindBackspaceForSearchInMainWindow.interVal = setInterval(function () {
           // console.log('lkml - search in  main window');
            $('#search-control').trigger('keyup');

            // removing blinking of autocomplete
            if ($('#search-control').val().length < bindBackspaceForSearchInMainWindow.numberOfSymbols) {
                $("#search-control").autocomplete("search", $("#search-control").val());
            }

            bindBackspaceForSearchInMainWindow.numberOfSymbols = $('#search-control').val().length;

        }, 100);
    }


}

/**   controls whether interval was set or not */
bindBackspace.interVal = false;

/** @class
 *  Sets/unsets backspace loop triggering
 *
 *
 *
 * @returns {Boolean} - ignored
 */
function bindBackspace() {  //for virtual keyboard


    if (!bindBackspace.interVal)
    {
        $('#searchFieldItems').on('focus', function () {
//            console.log("on focus is fired");

            bindBackspace.interVal = setInterval(function () {
                console.log('fdnfd');
                $('#searchFieldItems').trigger('keyup');

            }, 100);
        })

        $('#searchFieldItems').on('focusout', function () {
//            console.log("disabled monitoring");
            clearInterval(bindBackspace.interVal);
            bindBackspace.interVal = false;
        })
    }
}
/**
 * Before printing the order its  displayid must be retrieved,
 * it gets generated by server and client side should wait for response from server
 *
 * @param {Object} print
 * @param {Boolean} second_p
 * @param {Object} dd
 * @returns {Boolean} - just passses processing to other function
 */

function printOrderWithDelayForRetrivievingId(print, second_p, dd)
{
    /**  @type {Number}  */
    var unique_id = dd.unique_id;

    $.ajax({
        url: "/data",
        type: "POST",
        context: document.body,
        data: {'request': 'getDisplayIdForUniqueId', 'unique_id': unique_id, 'token': getToken()},
        success: function (data) {

            saveToken(data._token);

            dd['display_id'] = data.display_id['display_id'];

            alert('3rd  - printing');
            new syncHandler().print_invoice(print, second_p, JSON.stringify(dd));

            console.log("success");
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("failed ninkj");
        }
    });
}

/**
 * Check whether the current device is iphone
 * @returns {Boolean} - iphone or not
 */
function isiPhone() {
    return (
            //Detect iPhone
                    //var isiPad = navigator.userAgent.match(/iPad/i) != null;
                            (navigator.platform.indexOf("iPhone") != -1) ||
                            //Detect iPod
                                    (navigator.platform.indexOf("iPad") != -1)
                                    );
                }






