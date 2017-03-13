/**
 * Created with JetBrains PhpStorm.
 * User: Gabriel Colita
 * Date: 2/8/14
 * Time: 2:30 AM
 * A JavaScript Cart class using HTML5 Local Storage
 */

Date.prototype.dayofYear = function () {
    var d = new Date(this.getFullYear(), 0, 0);
    return Math.floor((this - d) / 8.64e+7);
};


var gcLsCart = function () {

    this.cartItems = [];
    this.numberOfItems = 0;
    this.total = 0;
    self = this;
    // Events

    $(document).on('click','.order-list-price',function(e){
      if(!$(this).hasClass('inEdit')){
        $(this).addClass('inEdit');
        var value = $(this).text().replace('$','');
        // Store the old price somewhere in case of a cancel or an error
        $(this).data('old_price',value);

        var form = $('<form><input type="text"></form>');
        form.find('input').val(value);
        $(this).html(form);
        $('input',this).focus().attr("_originaltype", "number").get(0).setSelectionRange(0, 9999);
      }
    });

    $(document).on('submit','.order-list-price form',function(e){
      e.preventDefault();

      e.stopPropagation();
      self.setSpecificPrice($(this));

    });

    $('html').on('click', function(e) {
        self.setSpecificPrice($('#list-cart .order-list-price form'));
    });

    this.setSpecificPrice = function(object){

      var value = $('input',object).val();
      // Add the focus


      // test is the value is a number
      if(isNaN(value) || value == ''){
        var old_price = object.parent().data('old_price');
        $('input',object).val(old_price);
      }
      else {
        var cart_id = $(object).parents('tr').data('cart_id');
        object.parent().removeClass('inEdit').text('$'+value);
        $.each(this.cartItems,function(index,item){
          if(item.cart_id == cart_id){
            item.price = value;
            // Create a new hash for the item
            item.cart_id = md5(cart_id + value);
          }
        });
        // @TODO why update manually , maybe perform an update of the cart at each time we save data ?
        // Or better listen directly the change of the cartItems and save data directly
        this.saveData();
        updateCartElements();
      }

    };

    this.printCart = function () {
        this.retriveData();
    };

    this.getItems = function (onlyNeverPrinted) {
        onlyNeverPrinted = onlyNeverPrinted || false;
        if (onlyNeverPrinted)
        {
            var tmp = [];
            for (var i = 0; i < this.cartItems.length; i++)
            {
                if (!this.cartItems[i].printed)
                {
                    tmp.push(this.cartItems[i]);
                }

            }
            return tmp;
        }
        else
        {
            return this.cartItems;
        }

    };

    this.getItemsNo = function () {
        return this.numberOfItems;
    };


    this.setTotal = function (newTotalValue) {
        this.total = newTotalValue;
    }


    this.getTotal = function () {
        return parseFloat(this.total).toFixed(2);
    };

    this.addItem = function (data, rcalc, customItem) {
        /*
         Check if it's an existing item to update the qty
         or a new one
         */
        var update = false;
        var holder = this.cartItems;
        var numberOfItems = 0;
        var total = 0;

        if (typeof (data.printed) === 'undefined')
        {
            data.printed = false;
        }

        data.cart_id = md5(data.id + '' + data.extra + '' + data.temp_unique_id);

        $.each(this.cartItems, function (index, item) {
            if (item.cart_id == data.cart_id && data.printed == item.printed) {
                if (data.id != 'discount') {
                    // Update the qty
                    item.qty += data.qty;
                    item.price = parseFloat(data.price) * parseInt(item.qty);

                    holder[index] = item;
                } else {
                    holder[index] = data;
                }
                update = true;

            }
            /* Since we are surfing the cart anyway, let's save total and no. of products as well */
            numberOfItems += item.qty;
            total += parseFloat(item.qty) * parseFloat(item.price);

        });


        showDisplay(data.name, data.price, "product"); //VV

        if (update) {
            this.cartItems = holder;
        } else {

            this.cartItems.unshift(data);
            numberOfItems += data.qty;
            if (data.id != 'discount') {
                total += parseFloat(data.qty) * parseFloat(data.price);
            }
        }

        //
        if ($.isNumeric(this.cartItems[0].id))
        {// discounts shouldn't be moved
            var wasMoved = false;
            for (var i = 1; i < this.cartItems.length; i++) {
                if ($.isNumeric(this.cartItems[i].id)) {
                    this.cartItems.splice(i - 1, 0, this.cartItems.shift());
                    wasMoved = true;
                    break;
                }
            }
            if (!wasMoved) {
                this.cartItems.push(this.cartItems.shift());
            }
//            this.cartItems.push(this.cartItems.shift());
        }

        /*if (total.substr(0,1) == '0') {
         total = total.slice(1);
         }*/

        this.numberOfItems = numberOfItems;
        this.total = total.toFixed(2);

        this.saveData();
        updateCartElements(customItem);
    };

    this.removeItem = function (id, printed) {
        /*
         Check if it's an existing item to update the qty
         or a new one
         */
        var update = false;
        var holder = this.cartItems;
        var numberOfItems = 0;
        var total = 0;
        printed = printed || false;
        $.each(this.cartItems, function (index, item) {

            if (item.cart_id == id && item.printed == printed) {
                // Update the qty
                item.qty = 0;
                update = true;
                holder = index;
                //numberOfItems += item.qty;
                //total         += item.qty * item.price;
            } else {
                numberOfItems += item.qty;
                total += item.qty * item.price;
            }


        });

        if (update) {
            this.cartItems.splice(holder, 1);
        }

        this.numberOfItems = numberOfItems;
        this.total = total;

        if (this.numberOfItems == 0) {
            this.clearCurrentSession();
        }
        this.saveData();
    };

    this._cartReinit = function (action) {
        /*
         Check if it's an existing item to update the qty
         or a new one
         */
        var update = false;
        var holder = this.cartItems;
        var numberOfItems = 0;
        var total = 0;
        $.each(this.cartItems, function (index, item) {

            if (item.id == data.id) {
                if (action == 'update') {
                    // Update the qty
                    item.qty += data.qty;
                    update = true;
                } else {
                    item.qty = 0; // price doesn't matter since if it's a removal will be a zero multiply
                }
                holder[index] = item;

            }
            /* Since we are surfing the cart anyway, let's save total and no. of products as well */

            numberOfItems += item.qty;
            total += item.qty * item.price;

        });

        if (update) {
            this.cartItems = holder;
        } else {
            this.cartItems.push(data);
            numberOfItems += data.qty;
            total += data.qty * data.price;
        }

        this.numberOfItems = numberOfItems;
        this.total = total;

        this.saveData();
    };



    this.clearCart = function () {

        $('#list-cart').removeAttr('order_code');
        $('#list-cart').removeAttr('unique_id');
        $('#list-cart').removeClass('takenFromPark');

        this.cartItems = [];
        this.total = 0;
        this.numberOfItems = 0;
        this.saveData();
    };


    this.retriveData = function () {
        var data = localStorage.getItem("gcLsCart");
        if (data != null) {
            this.cartItems = JSON.parse(data);
        }
        var misc = localStorage.getItem("gcLsCartMisc");
        if (misc != null) {
            var temp = JSON.parse(misc);
            this.numberOfItems = temp.items;

            this.total = temp.total;
        }
    };

    this.saveData = function () {

        localStorage.setItem("gcLsCart", JSON.stringify(this.cartItems));
        var save = JSON.stringify({total: this.getTotal(), items: this.getItemsNo()});
        localStorage.setItem("gcLsCartMisc", save);
    };

    /**
     * Update the order into local database
     * @param sessionId
     * @param tableId
     */
    this.updateOrder = function (sessionId, tableId, note, printParking, Syncronisation) {
        if (note == undefined) {
            note = '';
        }
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                sql = 'UPDATE "orders" SET "contents"=?, "total"=?, "note"=?, "order_type"=? WHERE "id"=?',
                data = [
                    JSON.stringify(this.getItems()),
                    this.getTotal(),
                    note,
                    sessionStorage.getItem('order_type')
                ];
        if (tableId != undefined) {
            data.push(tableId);
            sql = 'UPDATE "orders" SET "contents"=?, "total"=?, "note"=?, "order_type"=?, "table"=? WHERE "id"=?';
        }
        data.push(sessionId);

        db.transaction(function (tx) {
            tx.executeSql(sql, data, function () {
                tx.executeSql('SELECT "table","status","contents","total","userId","note","order_type","order_code", "unique_id", "order_code", "order_time", "credit_card_fee", "rounding" FROM orders WHERE id=?', [sessionId], function (tx, res) {
//                tx.executeSql('SELECT * FROM orders WHERE id=?', [sessionId], function(tx, res) {
                    if (res.rows.length > 0 && res.rows.item(0).status != 'unsaved')
                    {
                        var data = {};
                        data = res.rows.item(0);
                        data['date'] = Math.ceil(new Date().getTime() / 1000);
                        data['pay_value'] = 0
                        data['pay_type'] = 0;

                        if (typeof printParking != 'undefined' && typeof printParking.ddCopyPrinting != 'undefined') {
                            printParking.ddCopyPrinting['order_at'] = data['date'];
                        }

                        var objDisplayId = {
                            obj: false,
                            order_code: data['order_code'],
                            printing: printParking

                        };



//                        sy.pushData('pos_orders', data, 'insertProducts', res.rows.item(0).contents, objDisplayId, Syncronisation);
                        sy.pushData('pos_orders', data, 'insertProducts', res.rows.item(0).contents);
                    }
                });
            }, function (a, b) {
                console.log(a);
                console.log(b);
            });
        });
    };

    /**
     * Save the order in local database
     * @param tableId
     * @param type
     * @param disposeModal
     * @param callback
     */
    this.saveOrder = function (tableId, type, disposeModal, note, callback, printParking, Syncronisation) {
        if (type == undefined) {
            type = 'order';
        }
        if (note == undefined) {
            note = '';
        }


        var adress
        if (sessionStorage.getItem('client_caller_data')) {
            client = JSON.stringify(sessionStorage.getItem('client_caller_data'));
            sessionStorage.removeItem('client_caller_data');
        }


        var datePicker = ($('#modal-checkout-takeaway-time-types-park .button-pay-type-time.active').data('type') == 'asap') ? $('#modal-checkout-takeaway-time-types-park .button-pay-type-time.active').data('type')
                : $('#takeaway-type-later-datepicker-park').val();



        var order_type = 0;
        if (sessionStorage.getItem('order_type')) {
            order_type = sessionStorage.getItem('order_type');
        }

//        localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) + 1);
//          this
        var order_code = '';
        if (typeof Syncronisation == 'undefined' || typeof Syncronisation.order_code == 'undefined')
        {
            order_code = myCart.getOrderCode().order_code;
        } else {
            order_code = Syncronisation.order_code;
        }

        if (typeof Syncronisation == 'undefined' || Syncronisation.unique_id == 'undefined')
        {
            var Syncronisation = [];
            Syncronisation.order_code = order_code;
            Syncronisation.unique_id = getUniqueID();
        }


        if (typeof Syncronisation == 'undefined' || !Syncronisation.contents) {
            Syncronisation.contents = JSON.stringify(this.getItems())
        }

//        localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) );

        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                data = [
                    tableId,
                    type,
                    Syncronisation.contents,
                    this.getTotal(),
                    this.getActiveUser(),
                    note,
                    Syncronisation.userId || '',
                    order_type,
                    order_code,
                    datePicker,
                    Syncronisation.unique_id,
                    Syncronisation.address || ''
                ],
                thisClass = this;


        // table, status, content, total
        db.transaction(function (tx) {
            tx.executeSql('INSERT INTO "orders"("table","status","contents","total","userId","note","client","order_type","order_code","order_time", "unique_id","address" ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', data, function (tx, results) {
                if (type == 'park')
                {
                    var cols = ["table", "status", "contents", "total", "userId", "note", "client", "order_type", "order_code", "order_time", "unique_id"];
                    // var cols =["table","status","contents","total","userId","pay_value","pay_type","note", "order_code", "order_type", "date","order_time","address", "voided", "credit_card_fee","rounding", "order_status"];


                    data = array_combine(cols, data);
                    delete data.client;
                    var tmp = data.contents;
                    data['order_id'] = results.insertId;
                    data['date'] = Math.ceil(new Date().getTime() / 1000);
                    data['pay_value'] = 0
                    data['pay_type'] = 0;


                    if (typeof printParking != 'undefined' && typeof printParking.ddCopyPrinting != 'undefined') {
                        printParking.ddCopyPrinting['order_at'] = data['date'];
                    }

                    var objDisplayId = {
                        obj: thisClass,
                        order_code: data['order_code'],
                        printing: printParking

                    };


                    sy.pushData('pos_orders', data, 'insertProducts', tmp, objDisplayId, Syncronisation);



                }

                if (callback !== false) {
                    thisClass.clearCart();
                    updateCartElements();
                }
                if (disposeModal != undefined && disposeModal) {
                    $(disposeModal).modal('hide');
                }
                if (callback !== false && callback != undefined && typeof callback == 'function') {
                    callback();
                }






            }, function (a, b) {
                console.warn('We have an error in the saveOrder method from cart');
                console.warn(a);
                console.warn(b);
                alert('mysql error, check console');
            });
        });
    };

    this.incrementOrderCode = function () {
        localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) + 1);
    }



    this.getOrderCodeFromFieldOnPage = function ()
    {
        var order_code = $('#list-cart').attr('order_code');
        if (order_code != '')
        {
            return order_code;
        } else
        {
            return false;
        }
    }

    this.getOrderCode = function () {

        // order is taken from kitchen - no need to generate a new code
        if ($('#list-cart').is('[order_code]'))
        {
            var order_code = $('#list-cart').attr('order_code');
            return {'order_code': order_code, 'status': 'no need to increment order counter'};
        }


        var a = (new Date().getFullYear() + '').substr(2, 2);
        var b = new Date().dayofYear() + '';
        b = '0'.repeat(3 - b.length) + b;
        a += b;
        if (ch.getCookie('b_cookie_name') == undefined) {
            b = 'UD'; // UNKNOWN DEVICE
        } else {
            b = ch.getCookie('b_cookie_name').substr(0, 2).toUpperCase();
        }
        a += '-' + b;
        a += localStorage.getItem('user_initials');
        b = parseInt(document.pos_settings.start_number) + parseInt(localStorage.getItem('orderInc')) * parseInt(document.pos_settings.step_number);
        b = b.toString(10);
        a += '-' + b;


        return {'order_code': a.toUpperCase()};
    };

    this.setPrinted = function ()
    {
        for (var i = 0; i < this.cartItems.length; i++)
        {
            if (!this.cartItems[i].printed)
            {
                this.cartItems[i].printed = true;
            }

        }
    }



    function stripPriceinDollarsFromCacheField(text) {

        var cleanPart = text.split('-$');


        if (cleanPart.length >= 1) {
            text = cleanPart[0];
        }
        // else { otherwise let it just left as it was entered in the field}

        return text;
    }


    /**
     *
     * @param {type} higherTabName - 1 -dinein, 2 - delivery
     * @returns string - information about payment
     */
    function formateInformatinAboutPayment(higherTabName)
    {// upper field
        var separator = ' ';
        var answer = '';
        var additionalText = (higherTabName == '1') ? ' on Pickup' : ' on Delivery';


        var nameTabs = ['already_paid_tab_dinein', 'modal-checkout-type-pay-phone-button', 'modal-checkout-type-pay-payed-button'];
        var nameTabsDelivery = ['already_paid_tab_takeaway', 'delivery-nav-pay-pay-now', 'will_pay_on_delivery'];
        var desctiptionText = ['PAID - Online', 'PAID-', 'NOT PAID-'];

        if (higherTabName == 1) {

            // checking first subtab   - Dine-In / Takeaway
            for (var i = 0; i < nameTabs.length; i++)
            {
                var length = $('#' + nameTabs[i]).parent('li.active').length;
                if (length > 0)
                {
                    answer = answer + desctiptionText[i];
                }
            }
        }
        else {

            // checking second subtab   - Dine-In / Takeaway
            for (var i = 0; i < nameTabsDelivery.length; i++)
            {
                var length = $('#' + nameTabsDelivery[i]).parent('li.active').length;
                if (length > 0)
                {
                    answer = answer + desctiptionText[i];
                }
            }
        }



        // already paid pin  - it turned out, this was NOT NEEDED
        /*
         if ($('#already_paid_tab_dinein').parent('li.active').length )
         {
         if ($('#dinein-checkout-fee').val() == '')
         {
         answer = answer + ' ' + separator;
         } else
         {
         answer = answer + ' (+' + $('#dinein-checkout-fee').val() + '$)' + separator;
         }
         }
         */

        // dine-in
        if (higherTabName == 1) {

            // pay now pin
            if ($('#modal-checkout-type-pay-phone-button').parent('li.active').length)
            {
                var a = $('#pay_now_buttons').children('a.active').text();
                answer = answer + stripPriceinDollarsFromCacheField(a) + separator;
                // cash  -  not necessary
//            if ( $.trim( $('#pay_now_buttons').children('a.active').text()) == 'Cash')
//            {
//                answer = '(' + answer + $("#modal-checkout-dinein-money-input").val() + '$)';
//            }
            }
        } else { // on delivery
            // pay now pin
            if ($('#delivery-nav-pay-pay-now').parent('li.active').length)
            {
                var a = $('#modal-checkout-delivery-payment-types-b').children('a.active').text();
                answer = answer + stripPriceinDollarsFromCacheField(a) + separator;
                // cash  -  not necessary
//            if ( $.trim( $('#pay_now_buttons').children('a.active').text()) == 'Cash')
//            {
//                answer = '(' + answer + $("#modal-checkout-dinein-money-input").val() + '$)';
//            }
            }

        }

        //dine-in
        if (higherTabName == 1) {

            // will pay on pick up
            if ($('#modal-checkout-type-pay-payed-button').parent('li.active').length)
            {
                answer = answer + $.trim($('#will_pay_on_pickup').children('a.active').text()) + additionalText + separator;
            }
        } else { // on delivery

            // will pay on pick up
            if ($('#will_pay_on_delivery').parent('li.active').length)
            {
                answer = answer + $.trim($('#modal-checkout-delivery-payment-types-c').children('a.active').text()) + additionalText + separator;
            }
        }

        return answer;
    }

    /*
     *
     * @returns {string} or 0
     */
    function getCreditCardFeeInDollars(nameOfFieldForBasePrice) {


        // from credit card fee


        if (creditCardFeeStorage.feeWasAdded != 0) {

            var currentPriceOnCheckoutFinish = getWellFormedPriceFromTotalField(),
//                    previousPrice = myCart.getTotal();
                    previousPrice = creditCardFeeStorage.priceBeforeFee;

            // in the case for the first tab
            if (previousPrice == 0) {
                previousPrice = myCart.getTotal();
            }

            // fee for delivery in dollars is calculated separetaly, so we need to separate it from credit card fee
            // i.e. adds delivery fee from actual price IF it presents in the field address
//        previousPrice = unParseDeliveryFee(previousPrice);


            if (currentPriceOnCheckoutFinish != previousPrice) {
                previousPrice = previousPrice.replace(/[^0-9]/g, '');
                currentPriceOnCheckoutFinish = currentPriceOnCheckoutFinish.replace(/[^0-9]/g, '');

                var difference = currentPriceOnCheckoutFinish - previousPrice;
                if (difference <= 0) {
                    return  0;
                }

//                difference += basePrice;

                var lastTwoDigits = difference % 100,
                        firstDigits = difference / 100 >> 0;

                // e.g. $20.4 is not good, we need to do $20.40
                lastTwoDigits = lastTwoDigits.toString();
                if (lastTwoDigits.length == 1) {
                    lastTwoDigits = lastTwoDigits + '0';
                }

                difference = firstDigits + '.' + lastTwoDigits;
                return difference;
            }
        } else {

//            var basePrice = 0,
            var credit_card_fee_from_field = $(nameOfFieldForBasePrice).val();

            if (typeof credit_card_fee_from_field != undefined && !credit_card_fee_from_field.length) {
                return 0;
            }

            // no filtering for credit card fee - perhaps should it be

//        if ( credit_card_fee_from_field) {
//            basePrice = credit_card_fee_from_field;
//        }

            return credit_card_fee_from_field;
        }

        return 0;
    }




    /*
     * Rounds price according to requirements
     * @returns
     * [rounding] => -0.01 (Prices under 5 cents are rounded up or down to the nearest 5 cent - that is, 3 and 4 cent totals are rounded up to nearest 5 cent,
     while 1 and 2 cent totals are rounded down to nearest 5 cent denomination.?
     For example - 12 cents would be rounded down to 10 cents. 14 cents would be rounded up to 15 cents.)
     *  $11.24, .23, .26, .27, .25  -> $11.25
     *  $11.21  -> $11.20
     *  $11.20  -> $11.20
     *  $11.29, .28, .30   -> $11.30
     */
    this.calculateRounding = function () {


        var currentPriceOnCheckoutFinish = getWellFormedPriceFromTotalField(),
//                priceBeforeRounding = parseFloat(currentPriceOnCheckoutFinish),
                priceBeforeRounding = setPriceTotal.priceBeforeRounding,
                priceAfterRounding = parseFloat(currentPriceOnCheckoutFinish);

//        priceAfterRounding = (Math.round(priceAfterRounding * 20) / 20).toFixed(2);
        var difference = (priceAfterRounding - priceBeforeRounding).toFixed(2);

        return  {"rounded": priceAfterRounding, "difference": difference};
    }


    this.getInfoAboutOpenCashDrawer = function (drawerId) {
        //  [open_cash_drawer] =>[{"1":yes,"2":no}]
        var stateOfCashDrawers = [];
        var listOfDrawersIds = globalSettings.getlistOfDrawers();


        var jsonVar = {};
        for (var i = 0; i < listOfDrawersIds.length; i++) {
            // pushes states of printers to array
            var idOfPrinter = listOfDrawersIds[i];

            if (checkIfCashIsSelected()) {
                (drawerId == listOfDrawersIds[i]) ? jsonVar[idOfPrinter] = "yes" : jsonVar[idOfPrinter] = "no";
            } else {
                (drawerId == listOfDrawersIds[i]) ? jsonVar[idOfPrinter] = "no" : jsonVar[idOfPrinter] = "no";
            }


            stateOfCashDrawers.push(jsonVar);
            jsonVar = {};
        }

        //1 - first drawer, 4 - second drawer
//        (drawerId == 1) ? stateOfCashDrawers.push({"1": "yes"}) : stateOfCashDrawers.push({"1": "no"});
//        (drawerId == 4) ? stateOfCashDrawers.push({"2": "yes"}) : stateOfCashDrawers.push({"2": "no"});
        return JSON.stringify(stateOfCashDrawers);
    }

    this.updateDisplayID = function (order_code, unique_id, printInstance) {


        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'pos_update_display_ids', 'order_code': order_code, 'unique_id': unique_id, 'data': 1, 'token': getToken()},
            success: function (data) {

                saveToken(data._token);
                var sy = new syncHandler(),
                        db = sy.getDbInstance();

//                console.log("success");

                db.transaction(function (tx) {
                    tx.executeSql('UPDATE "orders" SET "display_id"=? WHERE "unique_id"=?', [data['display_id'], unique_id], function (tx, results) {
                        console.log('updated fine ' + unique_id);
                        console.log(data['display_id']);


                        if (typeof printInstance !== 'undefined')
                        {

                            printInstance.ddCopyPrinting['display_id'] = data['display_id'];
                            console.log(data['display_id']);


//                            console.log('going to print');
//                            console.log(printInstance);

//                            alert("print 2 - gmnffmnjk");
                            sy.print_invoice(printInstance.printPrinting, printInstance.printPrinting2, JSON.stringify(printInstance.ddCopyPrinting));
                        }

                        console.log('second updated');

                    });
                });

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("failed");
            }

        });

    }

    this.checkout = function (order_code, unique_id) {

        var rounding = this.calculateRounding();
        var credit_card_fee = getCreditCardFeeInDollars("#dinein-checkout-fee");
        var paymentStatus = formateInformatinAboutPayment(1);
        var order_status = paymentStatus;

        var changeBackWindow = false,
                changeBack = 0;



        var order_type = sessionStorage.getItem('order_type') || 0;
        var pay_type = $('.button-pay-type-dinein.active').data('type') || 2;



        if ($('#already_paid_tab_dinein').parent('li.active').length > 0)
        {
            pay_type = 0;
        }
        if ($('#modal-checkout-type-pay-phone-button').parent('li.active').length > 0 && pay_type == 1)
        {
            changeBackWindow = true;
            changeBack = parseFloat($('#modal-checkout-dinein-money-input').val()) - this.getTotal();
        }

        if (typeof order_code == "undefined")
        {
            order_code = this.getOrderCode();
            unique_id = getUniqueID();
        }

//        return true;
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                data = [
                    $('.modal-checkout-takeway-list-item.active').find('input').val(), //table
                    'checkout', // status
                    JSON.stringify(this.getItems()), //contents
//                    this.getTotal(), //total
                    rounding.rounded,
                    this.getActiveUser(), // userId
                    parseFloat($('#checkout-input-total').val() || 0), //pay_value
                    pay_type, //pay_type
                    $('#takeaway-note').val(), //note
                    new Date().getHours(), //hour
                    order_code.order_code, // order_code
                    order_type,
                    ($('#modal-checkout-takeaway-time-types .button-pay-type-time.active').data('type') == 'asap') ? $('#modal-checkout-takeaway-time-types .button-pay-type-time.active').data('type')
                            : $('#takeaway-type-later-datepicker').val().replace('at','').replace('on',''), //VV
                    credit_card_fee,
                    rounding.difference,
                    order_status,
                    unique_id
                ],
                dataLength = data.length,
                cols = ["table", "status", "contents", "total", "userId", "pay_value", "pay_type", "note", "hour", "order_code", "order_type", "order_time", "credit_card_fee", "rounding", "order_status", "unique_id"],
                tmp,
                thisClass = this,
                print = {}, print2 = {}, can_print = false;



        if (typeof order_code.status == 'undefined')
        {
            myCart.incrementOrderCode();
        }


//        $('.btn-printer-checkout').each(function () {
        $('.btn-printer-checkout_second').each(function () {
            if ($(this).data('count') > 0) {
                can_print = true;
                print2[$(this).data('id')] = $(this).data('count');
            }
        });

        $('.btn-printer-checkout').each(function () {
            if ($(this).data('count') > 0) {
                can_print = true;
                print[$(this).data('id')] = $(this).data('count');
            }
        });



        var dd = array_combine(cols, data);
        var Syncronisation = packObjectForSync(dd);
//        can_print = false;
        if (can_print)
        {

//            dd['order_status'] = paymentStatus;
            var ddCopy = dd;
            var drawerId = globalSettings.getDefaultDrawer();

            // 0 ,if no drawer was chosen
            (drawerId == 0) ? ddCopy["open_drawer"] = "no" : ddCopy["open_drawer"] = "yes";

            // this info need to be passed
            ddCopy['open_cash_drawer'] = this.getInfoAboutOpenCashDrawer(drawerId);

            var Printing = {
                printPrinting: print,
                printPrinting2: print2,
                ddCopyPrinting: ddCopy
            };
            thisClass.Printing = Printing;

        }

//        alert("vfn");
        var dataForUpdate = [],
                sqlData = [];
        for (var i = 0; i < dataLength; i++)
        {
            if (i == dataLength - 3)
            {
                continue;
            }
            dataForUpdate.push(data[i]);
        }
        var sqlCommand = '';

        if (localStorage.getItem('cartSession'))
        {
            sqlCommand = 'UPDATE "orders" SET "table"=?, "status"=?, "contents"=?, "total"=?, "userId"=?, "pay_value"=?, "pay_type"=?, "note"=?, "hour"=?, "order_type"=?, "order_time"=?, "credit_card_fee"=?, "rounding"=?, "order_status"=?, "unique_id"=? WHERE id=' + localStorage.getItem('cartSession');
            sqlData = dataForUpdate;
        } else
        {
            sqlCommand = 'INSERT INTO "orders"("table","status","contents","total","userId","pay_value","pay_type","note", "hour", "order_code", "order_type", "order_time", "credit_card_fee","rounding", "order_status", "unique_id") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            sqlData = data;
        }

        db.transaction(function (tx) {
            tx.executeSql(sqlCommand, sqlData, function (tx, results) {

                $('#modal-checkout-takeway').modal('hide');
                thisClass.clearCart();
                updateCartElements();
                var insertId = 0;

                tx.executeSql('SELECT order_code, id FROM "orders" WHERE "id"=?', [localStorage.getItem('cartSession') ? localStorage.getItem('cartSession') : 0], function (tx, res) {

                    if (localStorage.getItem('cartSession')) {
                        var orderId = res.rows.item(0).order_code,
                                insertId = res.rows.item(0).id;
                        for (var i = 0; i < dataLength; i++)
                        {
                            if (i == dataLength - 3)
                            {
                                data[i] = orderId;
                            }
                        }
                        localStorage.removeItem('cartSession');
                        //});
                    } else {
                        localStorage.removeItem('cartSession');
                        insertId = results.insertId;
                    }

                    // sync the order
                    data = array_combine(cols, data);

                    tmp = data.contents;
                    delete data.hour;

                    //data['order_id'] = results.insertId;
                    data['date'] = Math.ceil(new Date().getTime() / 1000);

                    if (typeof thisClass.Printing != 'undefined') {
                        thisClass.Printing.ddCopyPrinting['order_at'] = data['date'];
                    }


                    var objecForDisplayIDGeneration = {
                        obj: thisClass,
                        order_code: data['order_code'],
                        printing: thisClass.Printing

                    };

                    if (!can_print) {
                        objecForDisplayIDGeneration.printing = undefined;
                    }


                    console.log('before push data');
                    console.log(objecForDisplayIDGeneration);

//                    window.alert('gfmnfgjkffglkm');
                    sy.pushData('pos_orders', data, 'insertProducts', tmp, objecForDisplayIDGeneration, Syncronisation);
                    // sync the order

                    $('#modal-checkout-type').modal('hide');

//                    sessionStorage.removeItem('order_type');
                    sessionStorage.removeItem('client_caller_data');
                    $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function (a) {
                        return a.toUpperCase()
                    }) + ' Order');
                    $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
                    $('.order-type-action').removeClass('active');

//                    localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) + 1);
                    $('#global-note-holder').val('');
                    if (changeBackWindow && changeBack > 0)
                    {
                        changeBack = changeBack.toFixed(2);
                        $('#modal-change-back').modal('show');
                        $('#modal-change-back-count').text(changeBack);
                        showDisplay("Change Back:", changeBack, "changeback");

                    } else {
                        showDisplay("", "", "clear");
                    }

                    // setting walk-in active
                    $('#accordeon-order-types-list').children("[data-id='2']").addClass('active');
                    sessionStorage.setItem('order_type', 2);
                    sessionStorage.setItem('order_type_action', 'takeaway');

                    $('#modal-checkout-takeaway-time-types').children().removeClass('active');
                    $('#modal-checkout-takeaway-time-types').children("[data-type='asap']").addClass('active');

//
//                    var a = thisClass.Printing;
//                    thisClass.updateDisplayID(data['order_code'], a);
                });

            }, function (a, b) {
                console.warn(a);
                console.warn(b);
            });
        });



        var priceToSet = getWellFormedPriceFromTotalField();
        myCart.setTotal(priceToSet);

    };



    this.checkoutDelivery = function (order_code, unique_id) {

        var rounding = this.calculateRounding();
        var credit_card_fee = getCreditCardFeeInDollars("#delivery-checkout-fee");

//        var paymentStatus = formInformatinAboutPayment('Delivery');
        var paymentStatus = formateInformatinAboutPayment(0);
        var order_status = paymentStatus;
//        var paymentStatus = 'On Delivery/Pickup';


        var changeBackWindow = false,
                changeBack = 0;

        if (sessionStorage.getItem('order_type')) {
            var order_type = sessionStorage.getItem('order_type');
        } else {
            var order_type = 0;
        }
        if ($('.button-pay-type-takeout.active').data('type') == undefined) {
            var pay_type = 2;
        } else {
            var pay_type = $('.button-pay-type-takeout.active').data('type');
        }
        if ($('#delivery-nav-pay-pay-now').parent('li.active').length > 0 && pay_type == 1)
        {
            changeBackWindow = true;
            changeBack = parseFloat($('#modal-checkout-dinein-money-input').val()) - this.getTotal();
        }


//        var order_code = this.getOrderCode(),
//                unique_id = getUniqueID();


        if (typeof order_code == "undefined")
        {
            order_code = this.getOrderCode();
            unique_id = getUniqueID();
        }

        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                data = [
                    'checkout', // status
                    JSON.stringify(this.getItems()), //contents
//                    this.getTotal(), //total
                    rounding.rounded,
                    this.getActiveUser(), // userId
                    pay_type, //pay_type

                    $('#modal-checkout-delivery-name').val() + ' ' +
                            $('#modal-checkout-delivery-company').val() + ' ' +
                            $('#modal-checkout-delivery-address').val() + ' ' +
                            trim_spaces_inside($('#modal-checkout-delivery-phone').val()), //address

                    $('#delivery-note').val(), // note
                    new Date().getHours(), //hour
                    order_code.order_code, // order_code
                    order_type,
                    ($('#modal-checkout-delivery-time-types .button-pay-type-time.active').data('type') == 'asap') ? $('#modal-checkout-takeaway-time-types .button-pay-type-time.active').data('type')
                            : $('#delivery-type-later-datepicker').val().replace('at','').replace('on',''), //VV
                    credit_card_fee,
                    rounding.difference,
                    order_status,
                    unique_id
                ],
                dataLength = data.length,
                thisClass = this,
                cols = ["status", "contents", "total", "userId", "pay_type", "address", "note", "hour", "order_code", "order_type", "order_time", "credit_card_fee", "rounding", "order_status", "unique_id"],
                tmp,
                can_print,
                print = {}, print2 = {};



//        btn-printer-delivery_second
        $('.btn-printer-delivery_second').each(function () {
            if ($(this).data('count') > 0) {
                can_print = true;
                print2[$(this).data('id')] = $(this).data('count');
            }
        });

        $('.btn-printer-delivery').each(function () {
            if ($(this).data('count') > 0) {
                can_print = true;
                print[$(this).data('id')] = $(this).data('count');
            }
        });



        if (typeof order_code.status == 'undefined')
        {
            myCart.incrementOrderCode();
        }

        var dd = array_combine(cols, data);
        var Syncronisation = packObjectForSync(dd);
        if (can_print) {

            var ddCopy = dd;

            var drawerId = globalSettings.getDefaultDrawer();

            // 0 ,if no drawer was chosen
            (drawerId == 0) ? ddCopy["open_drawer"] = "no" : ddCopy["open_drawer"] = "yes";

            ddCopy['open_cash_drawer'] = this.getInfoAboutOpenCashDrawer(drawerId);


            var Printing = {
                printPrinting: print,
                printPrinting2: print2,
                ddCopyPrinting: ddCopy
            };
            thisClass.Printing = Printing;

        }

        var dataForUpdate = [],
                sqlData = [];
        for (var i = 0; i < dataLength; i++)
        {
            if (i == dataLength - 3)
            {
                continue;
            }
            dataForUpdate.push(data[i]);
        }
        var sqlCommand = '';
        //("status","contents","total","userId","pay_type","address","note","hour","order_code","order_type")
        if (localStorage.getItem('cartSession'))
        {

            sqlCommand = 'UPDATE "orders" SET  "status"=?, "contents"=?, "total"=?, "userId"=?, "pay_type"=?, "address"=?, "note"=?, "hour"=?, "order_type"=?, "order_time"=?, "credit_card_fee"=?, "rounding"=?, "order_status"=?, "unique_id"=?  WHERE id=' + localStorage.getItem('cartSession');
            sqlData = dataForUpdate;
        } else
        {
            sqlCommand = 'INSERT INTO "orders"("status","contents","total","userId","pay_type","address","note","hour","order_code","order_type","order_time","credit_card_fee", "rounding", "order_status", "unique_id") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            sqlData = data;
        }

        db.transaction(function (tx) {
            tx.executeSql(sqlCommand, sqlData, function (tx, results) {
                $('#modal-checkout-takeway').modal('hide');
                thisClass.clearCart();
                updateCartElements();
                var insertId = 0;
                tx.executeSql('SELECT order_code, id FROM "orders" WHERE "id"=?', [localStorage.getItem('cartSession') ? localStorage.getItem('cartSession') : 0], function (tx, res) {
                    if (localStorage.getItem('cartSession')) {
                        var orderId = res.rows.item(0).order_code,
                                insertId = res.rows.item(0).id;
                        for (var i = 0; i < dataLength; i++)
                        {
                            if (i == dataLength - 3)
                            {
                                data[i] = orderId;
                            }
                        }
                        localStorage.removeItem('cartSession');
                        //});
                    } else {
                        localStorage.removeItem('cartSession');
                        insertId = results.insertId;
                    }

                    // sync the order
                    data = array_combine(cols, data);

                    tmp = data.contents;
                    delete data.hour;

                    //data['order_id'] = results.insertId;
                    data['date'] = Math.ceil(new Date().getTime() / 1000);

                    if (typeof thisClass.Printing != 'undefined') {
                        thisClass.Printing.ddCopyPrinting['order_at'] = data['date'];
                    }
//                    var order_code = data['order_code'];
//                    var a = thisClass.Printing;
//                    thisClass.updateDisplayID(data['order_code'], a);

                    var objecForDisplayIDGeneration = {
                        obj: thisClass,
                        order_code: data['order_code'],
                        printing: thisClass.Printing

                    };


                    sy.pushData('pos_orders', data, 'insertProducts', tmp, objecForDisplayIDGeneration, Syncronisation);
                    // sync the order
                    $('#modal-checkout-type').modal('hide');

//                    sessionStorage.removeItem('order_type');
                    sessionStorage.removeItem('client_caller_data');
                    $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function (a) {
                        return a.toUpperCase()
                    }) + ' Order');
                    $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
                    $('.order-type-action').removeClass('active');

//                    localStorage.setItem('orderInc', parseInt(localStorage.getItem('orderInc')) + 1);
                    $('#global-note-holder').val('');
                    if (changeBackWindow && changeBack > 0)
                    {
                        $('#modal-change-back').modal('show');
                        $('#modal-change-back-count').text(changeBack);
                        showDisplay("Change Back:", changeBack, "changeback");
                    }

                // setting walk-in active
                $('#accordeon-order-types-list').children("[data-id='2']").addClass('active');
                sessionStorage.setItem('order_type', 2);
                sessionStorage.setItem('order_type_action', 'takeaway');

                $('#modal-checkout-delivery-time-types').children().removeClass('active');
                $('#modal-checkout-delivery-time-types').children("[data-type='asap']").addClass('active');

                });
            }, function (a, b) {
                console.warn(a);
                console.warn(b);
            });

        });

        var priceToSet = getWellFormedPriceFromTotalField();
        myCart.setTotal(priceToSet);
    };

    this.removeOrder = function (id) {
        var sy = new syncHandler(),
                db = sy.getDbInstance();

        db.transaction(function (tx) {
            tx.executeSql('SELECT order_code FROM "orders" WHERE "id"=?', data, function (tx, results) {
                var orderCode = results.rows.item(0).order_code;
                tx.executeSql('DELETE FROM "orders" WHERE "id"=?', [id], function (tx, results) {
                    sy.delData('pos_orders', {'order_code': orderCode});
                    alert('3 reload');
                    window.location.reload();
                });
            });
        });
    };

    this.removeOrderByOrderCode = function (order_code) {

        var sy = new syncHandler(),
                db = sy.getDbInstance();

        db.transaction(function (tx) {
            tx.executeSql('DELETE FROM "orders" WHERE "order_code"=?', [order_code], function (tx, results) {
                console.log("fine cleaned")
            });
        }, function (a, b) {
            console.log(a);
            console.log(b);
        });
    }



    this.clearCurrentSession = function () {
        $('#global-note-holder').val('');
        sessionStorage.removeItem('client_caller_data');
        $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function (a) {
            return a.toUpperCase()
        }) + ' Order');
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
        if (localStorage.getItem('cartSession')) {
            var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    data = [localStorage.getItem('cartSession')],
                    thisClass = this;

            db.transaction(function (tx) {
                tx.executeSql('SELECT order_code FROM "orders" WHERE "id"=?', data, function (tx, results) {
                    var orderCode = results.rows.item(0).order_code;
                    tx.executeSql('DELETE FROM "orders" WHERE "id"=?', data, function () {
                        thisClass.clearCart();
                        updateCartElements();
                        sy.delData('pos_orders', {'order_code': orderCode});
                        localStorage.removeItem('cartSession');
                    }, function (a, b) {
                        console.warn('We have an error in the clearCurrentSession method from cart');
                        console.warn(a);
                        console.warn(b);
                        alert('mysql error, check console');
                    });
                });

            });
        } else {
            this.clearCart();
            updateCartElements();
        }
    };

    /**
     * set active user
     * @param id
     */
    this.setActiveUser = function (id) {
        localStorage.setItem('currentUser', id);
    };

    /**
     * get active user
     * @returns {*}
     */
    this.getActiveUser = function () {
        return localStorage.getItem('currentUser');
    };

    /**
     * Format cart content to show in order sidr
     * @param item
     * @returns {string}
     */
    this.formatCartContent = function (item) {

        var compose = '';
        item = JSON.parse(item);
        for (var i in item) {
            if (item.hasOwnProperty(i)) {
                compose += item[i].qty + ' x ' + item[i].name + ' <br/>';
            }
        }


        if (compose == '') {
            return '<em>no items</em>';
        }
        return compose.slice(0, -6);
    };

    /**
     * return human format of tables
     * @param type
     * @returns {string}
     */
    this.getTableType = function (type) {
        var str = '';
        var defaultNameIfTypeIsUnset = 'Delivery';


        if (type == null) {
            str = 'Delivery';
        } else {
            switch (type) {
                case 'T':
                    str = 'Takeaway';
                    break;
                case 'D':
                    str = 'Delivery';
                    break;
                default:


                    var parsedValue = parseInt(type);

                    if (!isNaN(parsedValue)) {
                        str = 'Table no. ' + parsedValue;
                    } else {
                        str = defaultNameIfTypeIsUnset;
                    }
                    break;
            }
        }

        return str;
    };

    this.updateOptionSliderForProduct = function (itemData, stopPropagation) {
      // Change the text to update and setup for update
      $('#trigger-cartadd').addClass('must_update').attr('data-cart-id', itemData.cartId);
      $('#trigger-cartadd .btn-text').text('Update');

      $('#p-quantity').val(itemData.qty);

      var el = $('#product-extra-options_special_item,#product-extra-options');
      var formEls = el.find('input[type="hidden"], input[type="text"], input[type="password"], input[type="checkbox"], input[type="radio"], option, textarea');

      // We put the id-cart in an hidden input, it will be used when we submit the new product
      $('#p-id').val(itemData.cartId);
      // Update product note

      $('#product-note-textarea').val(itemData.productNote);
      // Just need to set the price inside the object and in the update button
      el.find('.btn-price').text(($('#p-productPrice').val()*itemData.qty).toFixed(2));



      // We loop on each product
      // If there is products list it is a "special one" , else it's a simple
      if(itemData.products && itemData.products.length){
        $.each(itemData.products,function(index,product){
          // We use the id to find the right element and set it to the good value
          var sel = formEls.filter('[value='+product.id+']');
          // We set value specific of the type of data
          if(sel.first().prop('type') == 'radio'){
            // A bit hacky but it works, we trigger click, to emulate all the events linked...
            sel.first().prop('checked',true);
            sel.first().trigger('click');
            sel.parent().siblings().removeClass('active');
            sel.parent().addClass('active');
          }
          else {
            sel.first().prop('selected',true).parent().trigger('change');
          }

          //if the element has halfs
          if(product.half != undefined){
            // Put a timeout to do this after the dom refresh
            setTimeout(function(){
              var selHalf = el.find('select').filter('[data-variation_id='+product.id+']').find('option').filter('[value='+product.half.id+']').first()
              selHalf.prop('selected',true).parent().trigger('change');
            }, 0);

          }

        });

        // We loop on each ingredients
        $.each(itemData.parts,function(index,ingredients){
          // Put a timeout to do this after the dom refresh
          setTimeout(function(){
            var ingBox = el.find('.ingredients-selector > div').filter('[data-variation='+index+']');

            $.each(ingredients.included,function(index,element){
              ingBox.find('.included input[value='+element.id+']').prop('checked',false);
            });

          }, 0);
          setTimeout(function(){
            var extraBox = $('input.extra-ingredients[data-variation='+index+']');
            extraBox.select2('data',ingredients.extra);
          },300);

        });
      }

    };

    this.calculateIngredientsTotal = function(extra,productId){
      var total = 0;

      if(extra.parts && extra.parts[productId] && extra.parts[productId].extra){
        var ing = extra.parts[productId].extra;
        $.each(ing,function(index,ingredient){
          total += parseFloat(ingredient.price);
        });
      }
      return total;
    }

    /*this.calculateProductPrice = function (context,product_price) {
        context = $(context).parents('form');
        var self = this;
        var total = parseFloat(product_price);
        var extra = $(context).serializeCartObject();
        $.each(extra.products,function(index,product){
          // All the price are divided by two if there is an half
          if(product.half){
            total += parseFloat(product.price)/2;
            total += parseFloat(product.half.price)/2;
            total += parseFloat(product.halfFee);
            total += self.calculateIngredientsTotal(extra,product.id)/2;
            total += self.calculateIngredientsTotal(extra,product.half.id)/2;
          }
          else {
            total += parseFloat(product.price);
            total += self.calculateIngredientsTotal(extra,product.id);
          }
        });
        total = total * parseInt($('#p-quantity').val());

        return parseFloat(total);
    };


    this.getTotalPrice = function (context) {
        return (this.calculateProductPrice(context,$('#p-productPrice').val())).toFixed(2);
    }

    this.showTotalPrice = function (context) {

        $('#trigger-cartadd').find('span.btn-price').html(this.getTotalPrice(context));
    };*/

    this.updateProduct = function (cartId,price) {
        var thisClass = this,
                numberOfItems = 0,
                total = 0;

        $.each(this.cartItems, function (index, item) {

            if (item.cart_id == cartId) {

                item.extra = thisClass.fetchProductExtra();
                item.cart_id = md5(item.id + item.extra);
                // Remove the selector
                console.log(price);
                item.price = parseFloat(price);
                item.qty = parseInt($('#p-quantity').val());
            }

            numberOfItems += item.qty;
            total += item.qty * item.price;
        });



        this.numberOfItems = numberOfItems;
        this.total = total;
        this.saveData();
    };



    this.fetchProductExtra = function () {
        if($('#product-extra-options_special_item').length){
          var itemData = $('#product-extra-options_special_item').serializeCartObject();
        }
        else {
          var itemData = $('#product-extra-options').serializeCartObject();
        }
        return JSON.stringify(itemData);
    };
    /**
     * Retrives the included ingredients
     * @returns {String}
     */

    this.formatCartExtra = function (extra, srcName) {
        Formatter.call(this);

        if (extra == '' || extra == undefined) {
            return '';
        }

        srcName = srcName || '';
        extra = JSON.parse(extra);
        var out = '';



        // Need to be rewritted to use only one mustach template
        if (extra.products.length == 1 && extra.products[0].half != undefined) {
            out = this.formatTwoHalfsProduct(extra, srcName);
        }
        else if (extra.products.length > 1)
        {
            // special item means an item which has more  than variation
            out = this.formatSpecialItem(extra);
        }
        else {
            out = this.formatUnspecialItem(extra, srcName);// + "<br/>";
        }

        if (extra['productNote'] != undefined && extra['productNote'] != '') {
            out += 'Note: ' + '<b>' + extra['productNote'] + '</b>';
        }


        return out;

    };

    /**
     * Strips unnecessary symbols from string
     * @param {string} to_format
     * @returns {string}
     */
    this.prettify = function (to_format) {
        var formatted = to_format.replace(/;/g, ' ');
        return formatted;
    }

    /**
     *  Extracts main (already  included) ingredients according to rules
     * @param {String} out
     * @returns {Array.<String>} out  - reformatted string
     */
    this.sortingItems = function (out) {
        var splitted = out.split(';');
        return [splitted[0], splitted[1]];
    }



    this.saveBalances = function () {
        globalSettings.setTiltOpened(true);
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                d = new Date(),
                m = (parseInt(d.getMonth()) + 1 < 10) ? '0' + (parseInt(d.getMonth()) + 1) : parseInt(d.getMonth()) + 1,
                day = (d.getDate() < 10) ? '0' + d.getDate() : d.getDate(),
                ddate = d.getFullYear() + '-' + m + '-' + day;



        db.transaction(function (tx) {
            tx.executeSql('DELETE FROM "balances" WHERE "date"=?', [ddate], function (tx, results) {
                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {'request': 'getServerTime', 'token': getToken()},
                    success: function (res) {


                        saveToken(res._token);
                        var timestamp = res.time,
                                data = [
                                    ['open_tilt', timestamp],
                                    ['money_in', $('#ui-settings-modal-money-in').val()],
                                    ['cc_in', $('#ui-settings-modal-cc-in').length > 0 ? $('#ui-settings-modal-cc-in').val() : '']

                                ];
                        sy.lazyQuery({
                            'sql': 'INSERT INTO "balances"("type","value") VALUES(?,?)',
                            'data': data
                        }, 0);
                        var data_sy = [
                            {
                                'type': 'open_tilt',
                                'value': timestamp,
                                'date': ddate
                            },
                            {
                                'type': 'money_in',
                                'value': $('#ui-settings-modal-money-in').val(),
                                'date': ddate
                            },
                            {
                                'type': 'cc_in',
                                'value': $('#ui-settings-modal-cc-in').length > 0 ? $('#ui-settings-modal-cc-in').val() : '',
                                'date': ddate
                            }
                        ];

                        sy.pushData('pos_balances', data_sy);
                        $('#ui-settings-modal').modal('hide');
                    }
                });

            });
        });
    };
    this.closeTiltStep1 = function () {

        console.log("yes");
        var sy = new syncHandler(),
                db = sy.getDbInstance();
        db.transaction(function (tx) {
            tx.executeSql('SELECT value FROM balances WHERE type IN ("open_tilt") ORDER by value DESC LIMIT 1', [], function (tx, results) {
                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'getOrderListForCloseTilt',
                        'dateOpen': results.rows.item(0).value,
                        'token': getToken()
                    },
                    success: function (data) {
                        saveToken(data._token);
                        var values = {};

                        values['money_in'] = 0;
                        values['creditcard'] = 0;
                        values['cash'] = 0;
                        values['paid'] = 0;
                        for (var i in data.orders)
                        {
                            values[data.orders[i].type] = data.orders[i].total;
                        }

                        if (values['creditcard'] == 0)
                        {
                            values['creditcard'] = JSON.stringify(values['creditcard']);
                        }

                        if (values['paid'] == null) {
                            values['paid'] = '0';
                        }
                        var newDate = new Date();
                        newDate.setTime(results.rows.item(0).value * 1000);
                        dateString = newDate.toLocaleString();

                        $('#ui-close-tilt-modal-date').html(dateString);
                        $('#ui-close-tilt-modal-open-balance').html(parseFloat(values['money_in']).toFixed(2));
                        $('#ui-close-tilt-modal-money-in').html(parseFloat(values['cash']).toFixed(2));
                        $('#ui-close-tilt-modal-cc-in').html(parseFloat(values['creditcard']).toFixed(2));
                        $('#ui-close-tilt-modal-cash-in-drawer').html((parseFloat(values['cash']) + parseFloat(values['money_in'])).toFixed(2));
                        $('#ui-close-tilt-modal-paid').html(parseFloat(values['paid']).toFixed(2));
                        $('#ui-close-tilt-modal-grant').html((parseFloat(values['cash']) + parseFloat(values['creditcard']) + parseFloat(values['paid'])).toFixed(2));
                        //$('#ui-close-tilt-modal-grant').html((parseFloat(values['cash']) + parseFloat(values['money_in'])).toFixed(2));

                        $('#ui-settings-modal').modal('hide');
                        $('#ui-close-tilt').modal('show');


                        $("[name='checkbox_hide_closetilt_printers']").bootstrapSwitch('state', true);
//                        var default_printer = globalSettings.getDefaultPrinter() || 1;

                        var default_printer = Number(globalSettings.getDefaultPrinter()) || globalSettings.getlistOfDrawers()[0];

                        if (default_printer) {
                            $(this).find('.btn-printer').removeClass('active').children('span').text('');

                            var $active_printer = $(this).find('.btn-printer').filter('[data-id="' + default_printer + '"]');
                            $($active_printer).addClass('active');
                            $($active_printer).children('span').text(' 1x ');
                            $($active_printer).attr('data-count', 1);
//                            $('#ui-settings-printers').find('.btn-printer span').text('');
                        }

                        $("[name='checkbox_hide_closetilt_printers']").bootstrapSwitch('onSwitchChange', function (event, state) {
                            var default_printer = globalSettings.getDefaultPrinter();
                            var $buttons = $('#ui-close-tilt').find('.btn-printer');

                            if (!state) {
                                //resetting
                                $($buttons).removeClass('active').removeClass('blue_again');
                                $($buttons).attr('data-count', 0);
                                $($buttons).parent().hide();
                                $($buttons).children('span').text('');
                                $('#ui-close-tilt').find('.state_closetilt_printers').children('span').hide();
                            } else {
                                $($buttons).parent().show();
                                var $active_printer = $($buttons).filter('[data-id="' + default_printer + '"]');
                                $($active_printer).children('span').text(' 1x ');
                                $($active_printer).attr('data-count', 1);
                                $($active_printer).addClass('active').removeClass('blue_again');
                                $('#ui-close-tilt').find('.state_closetilt_printers').children('span').show();
                            }
                        });

                    }
                });
            });
        });
    };



    this.closeTiltStep2 = function () {
        globalSettings.setTiltOpened(false);
        var sy = new syncHandler(),
                db = sy.getDbInstance(),
                data_sy = [],
                data = [],
                d = new Date(),
                /*m = (parseInt(d.getMonth()) + 1 < 10) ? '0' + (parseInt(d.getMonth()) + 1) : parseInt(d.getMonth()) + 1,
                 day = (d.getDate() < 10) ? '0' + d.getDate() : d.getDate(),
                 ddate = d.getFullYear() + '-' + m + '-' + day,
                 */
                ddate = new Date();
        ddate = ddate.getUTCFullYear() + '-' +
                ('00' + (ddate.getUTCMonth() + 1)).slice(-2) + '-' +
                ('00' + ddate.getUTCDate()).slice(-2) + ' ' +
                ('00' + ddate.getUTCHours()).slice(-2) + ':' +
                ('00' + ddate.getUTCMinutes()).slice(-2) + ':' +
                ('00' + ddate.getUTCSeconds()).slice(-2);
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'getServerTime', 'token': getToken()},
            success: function (res) {
                saveToken(res._token);
                var timestamp = res.time;
                db.transaction(function (tx) {
                    tx.executeSql('DELETE FROM "balances" WHERE "date"=?', [ddate], function (tx, results) {
                        tx.executeSql('SELECT SUM("total") AS "total", "taxes"."type" FROM "orders" JOIN "taxes" ON "taxes"."id" = "orders"."pay_type" WHERE date > strftime("%Y-%m-%d","now") GROUP BY "taxes"."type"', [], function (tx, results) {
                            data.push(['eod', 'yes']);
                            for (var i = 0; i < results.rows.length; i++) {
                                data.push([results.rows.item(i).type, results.rows.item(i).total]);
                            }
                            data.push(['close_tilt', timestamp]);
                            sy.lazyQuery({
                                'sql': 'INSERT INTO "balances"("type","value") VALUES(?,?)',
                                'data': data
                            }, 0);

                            for (var i = 0; i < data.length; i++) {
                                data_sy.push({
                                    'type': data[i][0],
                                    'value': data[i][1],
                                    'date': ddate
                                });
                            }


                            sy.pushData('pos_balances', data_sy);

                            localStorage.setItem('orderInc', 1);
                            tx.executeSql('SELECT value FROM balances WHERE type IN ("open_tilt") ORDER by value DESC LIMIT 1', [], function (tx, results) {
                                tx.executeSql('DELETE FROM "orders"', [], function (tx, results) {
                                    tx.executeSql('DELETE FROM "order_items"', [], function (tx, results) {
                                    });
                                });
                            });
                            myCart.printBalance();
                        });
                    });
                });
            }
        });


    };

    this.printBalance = function () {
        //console.log($('#ui-setting-default-printer').val());
        var print = {};
        $('.ui-settings-printers-item').each(function () {
            var $p = $(this);
            if ($p.data('count') > 0) {
                print[$p.data('id')] = $p.data('count');
            }
        });
        var data = {};
        data['openBalance'] = $('#ui-close-tilt-modal-open-balance').text();
        data['cash'] = $('#ui-close-tilt-modal-money-in').text();
        data['creditcard'] = $('#ui-close-tilt-modal-cc-in').text();
        data['online_paid_sales'] = $('#ui-close-tilt-modal-paid').text();
        data['total_sales'] = $('#ui-close-tilt-modal-grant').text();
        //data['subtotal'] = $('#ui-close-tilt-modal-subtotal').text();
        data['cash-in-drawer'] = $('#ui-close-tilt-modal-cash-in-drawer').text();
        data['date'] = $('#ui-close-tilt-modal-date').text();

        //data['grant'] = $('#ui-close-tilt-modal-grant').text();
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'printInvoice', 'print': print, 'data': data, 'token': getToken(), 'managerPrinter': getManagerPrinterId()},
            success: function (data) {
                saveToken(data._token);
            }
        });
    };

    this.storeCliend = function (data) {
        var item = [];
        if (sessionStorage.getItem('tmp_client')) {
            var d = sessionStorage.getItem('tmp_client');
            item = JSON.parse(d);
        }
        item.push(data);
        sessionStorage.setItem('tmp_client', JSON.stringify(item));
    };

    this.keepClient = function () {
        var sy = new syncHandler();
        localStorage.setItem('use_call_client', '1');
        var tmp = localStorage.getItem('call_client_old');
        localStorage.removeItem('call_client_old');

        if (myCart.getItemsNo() > 0) {
            sessionStorage.setItem('order_type', 1);
            $('.order-type-action').removeClass('active');
            $('.order-type-action[data-id="1"]').addClass('active');
            myCart.saveOrder(-1, 'unsaved', false, '', false);
            myCart.clearCart();
            localStorage.removeItem('cartSession');
            updateCartElements();
        }

        $('#global-note-holder').val('');

        sy.dismissCall();
        localStorage.setItem('call_client', tmp);
        localStorage.setItem('use_call_client', '1');

        var to_c = '';
        if (localStorage.getItem('call_client')) {
            var _t_call_client = JSON.parse(localStorage.getItem('call_client'));
            if (_t_call_client.name != undefined && _t_call_client.name != '') {
                to_c = ' for ' + _t_call_client.name;
            } else {
                to_c = ' for ' + _t_call_client.number;
            }
        }
        $('#client-details-container').html(($('#accordeon-order-types-list').find('a.active').html() + '').replace(/\b([a-z])/g, function (a) {
            return a.toUpperCase()
        }) + ' Order' + to_c);
        $('#client-details-container').html($('#client-details-container').html() + ' - ' + $('.price-type-action.active').text() + ' Prices');
    };

    this.has_coupon = function () {
        var has = true,
                c = this.cartItems;
        for (var i in c) {
            if (c.hasOwnProperty(i)) {
                if (c[i].has_coupon == 0 || c[i].has_coupon == '0') {
                    has = false;
                    break;
                }
            }
        }

        return has;
    }
};

// Serialize all the elements of the right panel

$.fn.serializeCartObject = function () {
    var o = {};
    // Used to track time
    var time = new Date().getTime();

    var formData = $(this).find('input[type="hidden"], input[type="text"], input[type="password"], input[type="checkbox"]:checked, input[type="radio"]:checked, select, textarea');
    o.products = [];
    // Add basic information about the product
    o.productId = $('#p-productId').val();
    o.productName = $('#p-productName').val();
    o.productPrice = $('#p-productPrice').val();
    o.has_coupon = $('#p-has_coupon').val();
    o.productNote = $('#product-note-textarea').val();

    // Create the parts (ingredients) array
    // Todo Move it inside the products for faster rendering
    var ingBox = $(this).find('.ingredients-selector > div:visible');

    var parts = [];
    o.isSpecialItem = ingBox.length != 1 ? true : false;
    o.parts = {};

    var extraIngredientsInput = formData.filter('.extra-ingredients');
    // Loop on extra ingredients input
    extraIngredientsInput.each(function(index,item){
      var variation_id = $(item).data('variation');
      var extra = [];
      if($(item).val() != ""){
        item = JSON.parse($(item).val());
        $.each(item,function(index,obj){
          extra.push({id : obj.id,name: obj.ingredient_name,text: obj.text,price:obj.price});
        });
      }


      o.parts[variation_id] = o.parts[variation_id] || {};
      o.parts[variation_id] = {extra : extra};
    });

    // Loop on the ckeck box
    ingBox.each(function(index,item){
      var variation_id = $(item).data('variation');
      var included = [];


      // Loop for included ingredients
      $(item).find('.included input:not(:checked)').each(function(index,ingredients){
        var ing = $(ingredients);
        included.push({id : ing.val(),name: ing.data('label')});
      });

      o.parts[variation_id].included = included;
    });

    // Loop and create the products array and the half are embeded inside the parent product
    formData.filter("[data-type='product']").each(function(){
      var product = {};
      product.id = $(this).val();
      product.kind = $(this).attr('name');
      product.halfFee = $(this).data('halffee') != undefined ? $(this).data('halffee') : 0;
      // Specific to Select , else all the other type of input
      if (this.tagName == 'SELECT') {
        product.name = $(this).find('option:selected').data('name');
        product.price = $(this).find('option:selected').data('price');
        product.halfFee = $(this).find('option:selected').data('halffee');
      }
      else {
        product.name = $(this).data('name');
        product.price = $(this).data('price');
      }


      // Get the half (if he exist)and put all the information inside the product object
      var half = formData.filter("[data-type='half']").filter('[data-variation_id="'+product.id+'"]');
      if(half.length){
        var selected = half.find('option:selected');
        if(selected.val() != ''){
          product.half = {};
          product.half.name = selected.data('name');
          product.half.id = selected.val();
          product.half.price = selected.data('price');
        }
      }
      o.products.push(product);
    });
    return o;
  };



function insertProducts(a, b) {

    var sy = new syncHandler(),
            data = [], data_array = [],
            tmp, variation, options;

    for (var i in b) {
        if (b.hasOwnProperty(i)) {
            try {
                tmp = JSON.parse(b[i].extra);
                variation = tmp.half.id;
                options = b[i].extra;
            } catch (err) {
                variation = 0;
                options = '';
            }

            data.push({
                'order_id': a.inserted_id,
                'product_id': b[i].id,
                'variation_id': variation,
                'quantity': b[i].qty,
                'notes': b[i].note,
                'options': options
            });
            data_array.push([
                a.inserted_id,
                b[i].id,
                variation,
                b[i].qty,
                b[i].note,
                options
            ]);
        }
    }

//alert("bvd");

    sy.pushData('pos_orderitems', data);

    sy.lazyQuery({
        'sql': 'INSERT INTO "order_items"("order_id","product_id","variation_id","quantity","notes","options") VALUES(?,?,?,?,?,?)',
        'data': data_array
    }, 0);
}


