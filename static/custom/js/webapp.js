$(function () {
    if (window.navigator.standalone && sessionStorage.getItem('redirected') == undefined) {
        sessionStorage.setItem('redirected', '1');
        //window.location.href = '/';
    }
});