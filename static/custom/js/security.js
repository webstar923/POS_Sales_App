/**
 * Created by gabi on 4/2/14.
 */

function CookieHelper() {
    this.setCookie = function (c_name, value, exdays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value = decodeURI(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
        document.cookie = c_name + "=" + c_value;
    };

    this.getCookie = function (c_name) {

        var i, x, y, ARRcookies = document.cookie.split(";");
        for (i = 0; i < ARRcookies.length; i++) {
            x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
            y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == c_name) {
                return decodeURI(y);
            }
        }

    };
}


function checkWhetherUpdateUniqueID()
{
    var objCookies = new CookieHelper();
    var cookies_from_cache = objCookies.getCookie('b_cookie_id');
    var value = '';
    if (typeof cookies_from_cache == 'undefined' || cookies_from_cache == 'undefined')
    {
        value = new Fingerprint().get();
        objCookies.setCookie('b_cookie_id', value, 366);
    } else {
        value = objCookies.getCookie('b_cookie_id');
    }
    return value;
}


var $pass_inp = $('#input-password'),
        ch = new CookieHelper(),
        us = new UserSecurity(),
        cr = new SCrypt(),
        fp = checkWhetherUpdateUniqueID();





$(function () {



    FastClick.attach(document.body);

    setTimeout(function () {
        $('#delayOverflow').addClass('hide');
    }, 1000);

    if (window.location.href.toString().indexOf('login') != -1 && us.isLogged()) {
        window.location.href = '/';
//        console.log('redirect');
    }

    $(document).on('click', '#login-user-trigger', function () {
        if (!us.isError()) {
            var u = null,
                    p = $pass_inp.val(),
                    e = false;

            if (p == '' || p.length == 0) {
                $('#input-password').parent().addClass('has-error');
                e = true;
            }

            $pass_inp.val('');

            if (!e) {
                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'loginUser',
                        'password': md5(p),
                        'fp': fp
                    }
                }).done(function (data) {
                    saveToken(data._token);
                    if (data.success && data.id != undefined) {

                        if (data.ds) {
                            $('#fullScreenLoader').removeClass('hide').css('height', ($(window).height() + 100) + 'px');
                            localStorage.setItem('currentUser', data.id);
                            ch.setCookie('currentUser', data.id, 366);
                            var syncEr = new syncHandler();
                            syncEr.doCompleteSync();
                            $.ajax({
                                url: "/data",
                                type: "POST",
                                context: document.body,
                                data: {
                                    'request': 'checkTiltOpened',
                                    'token': getToken(),
                                }
                            }).success(function (data) {
                                saveToken(data._token);
                                localStorage.setItem('tiltOpened', data.tiltOpened);
                            });
                        } else {

                            if (data.isadmin === "1") {
                                us.issueCode(data.id);
                            } else {
                                us.triggerNotAdmin();
                            }
                        }

                    } else {
                        $('#input-password').val('');

                        us.setError();
                        if (us.isWarning()) {
                            $('#warn-user-modal').modal('show');
                        }
                    }
                });
            }
        } else {
            alert('Browser locked');
        }
    });


    $(document).on('click', '.user-login-helper', function () {
        var i = $(this).data('val');
        $pass_inp.parent().removeClass('has-error');
        if (i == 'del') {
            $pass_inp.val($pass_inp.val().slice(0, -1));
        } else {
            $pass_inp.val($pass_inp.val() + '' + i);
        }
    });

});

function UserSecurity() {
    var set_name = 'fail_count';
    var browser_save = 'b_cookie';
    var level = {
        'warn': 3,
        'error': 4
    };

    this.setError = function () {
        var i = localStorage.getItem(set_name);
        if (i) {
            localStorage.setItem(set_name, parseInt(i) + 1);
        } else {
            localStorage.setItem(set_name, '1');
        }
    };

    this.isWarning = function () {
        return (localStorage.getItem(set_name) && localStorage.getItem(set_name) == level.warn);
    };

    this.isError = function () {
        return (localStorage.getItem(set_name) && localStorage.getItem(set_name) == level.error);
    };

    this.isTrusted = function () {
        return (ch.getCookie(browser_save));
    };

    this.saveBrowser = function (name) {
        ch.setCookie(browser_save, cr.crypt(fp), 366);
        ch.setCookie(browser_save + '_name', name, 366);
    };

    this.issueCode = function (id) {

        toastr.options = {
            "closeButton": false,
            "debug": false,
            "positionClass": "toast-bottom-full-width",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "10000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        toastr.warning('Please allow a few minutes to arrive', 'SMS code was sent.');


        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {
                'request': 'issueCode',
                'user_id': id,
                'token': getToken()
            }
        }).done(function (data) {
            saveToken(data._token);
            if (data.success == true) {

                $('#twofa-user-modal').modal('show').find('#security-code').off('click').on('click', function (e) {
                    e.preventDefault();

                    var $code = $('#twofa-sms-code'),
                            $name = $('#twofa-device-name'),
                            e = false;

                    if ($code.val() == '') {
                        $code.parent().addClass('has-error');
                        e = true;
                    } else {
                        $code.parent().removeClass('has-error');
                    }

                    if ($name.val() == '') {
                        $name.parent().addClass('has-error');
                        e = true;
                    } else {
                        $name.parent().removeClass('has-error');
                    }

                    if (!e) {
                        us.checkCode($code.val(), $name.val(), id);
                    }

                    return false;
                });
            } else {
                new UserSecurity().triggerNotAdmin();
            }

        });

    };

    this.triggerNotAdmin = function () {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "positionClass": "toast-bottom-full-width",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "10000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        toastr.error('Sorry, this device needs to be authorise by administrator first!', 'Not Authorized');
    }

    this.checkCode = function (code, name, user_id) {
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {
                'request': 'checkCode',
                'code': code,
                'user_id': user_id,
                'device_name': name,
                'fp': fp,
                'token': getToken()
            }
        }).done(function (data) {
            saveToken(data._token);
            if (data.status) {
                $('#twofa-user-modal').modal('hide');
                us.saveBrowser(data.name);

                $('#fullScreenLoader').removeClass('hide').css('height', ($(window).height() + 100) + 'px');
                localStorage.setItem('currentUser', data.id);
                ch.setCookie('currentUser', data.id, 366);
                var syncEr = new syncHandler();
                syncEr.doCompleteSync();
                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'checkTiltOpened',
                        'token': getToken(),
                    }
                }).success(function (data) {
                    saveToken(data._token);
                    localStorage.setItem('tiltOpened', data.tiltOpened);
                });
            } else {
                alert('Incorrect code.');
            }
        });
    };

    this.isLogged = function () {
        if (localStorage.getItem('currentUser') && localStorage.getItem('mustLogOut') != 'ok') {
//            console.log('da');
            return true;
        } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('mustLogOut');
//            console.log('nu');
            return false;
        }
    }
}

function SCrypt() {
    this.crypt = function (string, salt) {
        string += '';
        if (salt == undefined)
            salt = 76;

        if (typeof salt == 'string') {
            var t_salt = 0;
            for (var i = 0; i < salt.length; i++) {
                t_salt += salt.charCodeAt(i);
            }
            salt = t_salt;
        }

        var c = '';
        for (var i = 0; i < string.length; i++) {
            c += String.fromCharCode((string.charCodeAt(i) ^ salt));
        }

        return c;
    };
}



