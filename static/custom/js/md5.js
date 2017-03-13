/**
 * Store the browser/device fingerprint for later use
 * @type String
 */


//var fingerPrint = new Fingerprint().get(); 
var fingerPrint = checkWhetherUpdateUniqueID();  
 
    
/**
 * Md5 for javascript (utf8_encode dependency)
 * Source: http://phpjs.org
 */
function utf8_encode(a){if(a===null||typeof a==="undefined"){return""}var i=(a+"");var j="",b,e,c=0;b=e=0;c=i.length;for(var d=0;d<c;d++){var h=i.charCodeAt(d);var g=null;if(h<128){e++}else{if(h>127&&h<2048){g=String.fromCharCode((h>>6)|192,(h&63)|128)}else{if(h&63488!=55296){g=String.fromCharCode((h>>12)|224,((h>>6)&63)|128,(h&63)|128)}else{if(h&64512!=55296){throw new RangeError("Unmatched trail surrogate at "+d)}var f=i.charCodeAt(++d);if(f&64512!=56320){throw new RangeError("Unmatched lead surrogate at "+(d-1))}h=((h&1023)<<10)+(f&1023)+65536;g=String.fromCharCode((h>>18)|240,((h>>12)&63)|128,((h>>6)&63)|128,(h&63)|128)}}}if(g!==null){if(e>b){j+=i.slice(b,e)}j+=g;b=e=d+1}}if(e>b){j+=i.slice(b,c)}return j}function md5(C){var D;var w=function(b,a){return(b<<a)|(b>>>(32-a))};var H=function(k,b){var V,a,d,x,c;d=(k&2147483648);x=(b&2147483648);V=(k&1073741824);a=(b&1073741824);c=(k&1073741823)+(b&1073741823);if(V&a){return(c^2147483648^d^x)}if(V|a){if(c&1073741824){return(c^3221225472^d^x)}else{return(c^1073741824^d^x)}}else{return(c^d^x)}};var r=function(a,c,b){return(a&c)|((~a)&b)};var q=function(a,c,b){return(a&b)|(c&(~b))};var p=function(a,c,b){return(a^c^b)};var n=function(a,c,b){return(c^(a|(~b)))};var u=function(W,V,aa,Z,k,X,Y){W=H(W,H(H(r(V,aa,Z),k),Y));return H(w(W,X),V)};var f=function(W,V,aa,Z,k,X,Y){W=H(W,H(H(q(V,aa,Z),k),Y));return H(w(W,X),V)};var F=function(W,V,aa,Z,k,X,Y){W=H(W,H(H(p(V,aa,Z),k),Y));return H(w(W,X),V)};var t=function(W,V,aa,Z,k,X,Y){W=H(W,H(H(n(V,aa,Z),k),Y));return H(w(W,X),V)};var e=function(V){var W;var d=V.length;var c=d+8;var b=(c-(c%64))/64;var x=(b+1)*16;var X=new Array(x-1);var a=0;var k=0;while(k<d){W=(k-(k%4))/4;a=(k%4)*8;X[W]=(X[W]|(V.charCodeAt(k)<<a));k++}W=(k-(k%4))/4;a=(k%4)*8;X[W]=X[W]|(128<<a);X[x-2]=d<<3;X[x-1]=d>>>29;return X};var s=function(d){var a="",b="",k,c;for(c=0;c<=3;c++){k=(d>>>(c*8))&255;b="0"+k.toString(16);a=a+b.substr(b.length-2,2)}return a};var E=[],L,h,G,v,g,U,T,S,R,O=7,M=12,J=17,I=22,B=5,A=9,z=14,y=20,o=4,m=11,l=16,j=23,Q=6,P=10,N=15,K=21;C=this.utf8_encode(C);E=e(C);U=1732584193;T=4023233417;S=2562383102;R=271733878;D=E.length;for(L=0;L<D;L+=16){h=U;G=T;v=S;g=R;U=u(U,T,S,R,E[L+0],O,3614090360);R=u(R,U,T,S,E[L+1],M,3905402710);S=u(S,R,U,T,E[L+2],J,606105819);T=u(T,S,R,U,E[L+3],I,3250441966);U=u(U,T,S,R,E[L+4],O,4118548399);R=u(R,U,T,S,E[L+5],M,1200080426);S=u(S,R,U,T,E[L+6],J,2821735955);T=u(T,S,R,U,E[L+7],I,4249261313);U=u(U,T,S,R,E[L+8],O,1770035416);R=u(R,U,T,S,E[L+9],M,2336552879);S=u(S,R,U,T,E[L+10],J,4294925233);T=u(T,S,R,U,E[L+11],I,2304563134);U=u(U,T,S,R,E[L+12],O,1804603682);R=u(R,U,T,S,E[L+13],M,4254626195);S=u(S,R,U,T,E[L+14],J,2792965006);T=u(T,S,R,U,E[L+15],I,1236535329);U=f(U,T,S,R,E[L+1],B,4129170786);R=f(R,U,T,S,E[L+6],A,3225465664);S=f(S,R,U,T,E[L+11],z,643717713);T=f(T,S,R,U,E[L+0],y,3921069994);U=f(U,T,S,R,E[L+5],B,3593408605);R=f(R,U,T,S,E[L+10],A,38016083);S=f(S,R,U,T,E[L+15],z,3634488961);T=f(T,S,R,U,E[L+4],y,3889429448);U=f(U,T,S,R,E[L+9],B,568446438);R=f(R,U,T,S,E[L+14],A,3275163606);S=f(S,R,U,T,E[L+3],z,4107603335);T=f(T,S,R,U,E[L+8],y,1163531501);U=f(U,T,S,R,E[L+13],B,2850285829);R=f(R,U,T,S,E[L+2],A,4243563512);S=f(S,R,U,T,E[L+7],z,1735328473);T=f(T,S,R,U,E[L+12],y,2368359562);U=F(U,T,S,R,E[L+5],o,4294588738);R=F(R,U,T,S,E[L+8],m,2272392833);S=F(S,R,U,T,E[L+11],l,1839030562);T=F(T,S,R,U,E[L+14],j,4259657740);U=F(U,T,S,R,E[L+1],o,2763975236);R=F(R,U,T,S,E[L+4],m,1272893353);S=F(S,R,U,T,E[L+7],l,4139469664);T=F(T,S,R,U,E[L+10],j,3200236656);U=F(U,T,S,R,E[L+13],o,681279174);R=F(R,U,T,S,E[L+0],m,3936430074);S=F(S,R,U,T,E[L+3],l,3572445317);T=F(T,S,R,U,E[L+6],j,76029189);U=F(U,T,S,R,E[L+9],o,3654602809);R=F(R,U,T,S,E[L+12],m,3873151461);S=F(S,R,U,T,E[L+15],l,530742520);T=F(T,S,R,U,E[L+2],j,3299628645);U=t(U,T,S,R,E[L+0],Q,4096336452);R=t(R,U,T,S,E[L+7],P,1126891415);S=t(S,R,U,T,E[L+14],N,2878612391);T=t(T,S,R,U,E[L+5],K,4237533241);U=t(U,T,S,R,E[L+12],Q,1700485571);R=t(R,U,T,S,E[L+3],P,2399980690);S=t(S,R,U,T,E[L+10],N,4293915773);T=t(T,S,R,U,E[L+1],K,2240044497);U=t(U,T,S,R,E[L+8],Q,1873313359);R=t(R,U,T,S,E[L+15],P,4264355552);S=t(S,R,U,T,E[L+6],N,2734768916);T=t(T,S,R,U,E[L+13],K,1309151649);U=t(U,T,S,R,E[L+4],Q,4149444226);R=t(R,U,T,S,E[L+11],P,3174756917);S=t(S,R,U,T,E[L+2],N,718787259);T=t(T,S,R,U,E[L+9],K,3951481745);U=H(U,h);T=H(T,G);S=H(S,v);R=H(R,g)}var i=s(U)+s(T)+s(S)+s(R);return i.toLowerCase()};
/**
 * array_combine for javascript
 * Source: http://phpjs.org
 */
function array_combine(d,b){var e={},a=d&&d.length,c=0;if(typeof d!=="object"||typeof b!=="object"||typeof a!=="number"||typeof b.length!=="number"||!a){return false}if(a!=b.length){return false}for(c=0;c<a;c++){e[d[c]]=b[c]}return e};
/**
 * strip_tags for javascript
 * Source: http://phpjs.org
 */
function strip_tags(a,c){c=(((c||"")+"").toLowerCase().match(/<[a-z][a-z0-9]*>/g)||[]).join("");var b=/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,d=/<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;return a.replace(d,"").replace(b,function(f,e){return c.indexOf("<"+e.toLowerCase()+">")>-1?f:""})};
/**
 * is_numeric for javascript
 * Source: http://phpjs.org
 */
function is_numeric(b){var a=" \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";return(typeof b==="number"||(typeof b==="string"&&a.indexOf(b.slice(-1))===-1))&&b!==""&&!isNaN(b)};
/**
 * base64_encode/decode for javascript
 * Source: http://phpjs.org
 */
function base64_encode(j){var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var d,c,b,n,m,l,k,o,h=0,p=0,g="",f=[];if(!j){return j}j=unescape(encodeURIComponent(j));do{d=j.charCodeAt(h++);c=j.charCodeAt(h++);b=j.charCodeAt(h++);o=d<<16|c<<8|b;n=o>>18&63;m=o>>12&63;l=o>>6&63;k=o&63;f[p++]=e.charAt(n)+e.charAt(m)+e.charAt(l)+e.charAt(k)}while(h<j.length);g=f.join("");var a=j.length%3;return(a?g.slice(0,a-3):g)+"===".slice(a||3)}function base64_decode(h){var d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var c,b,a,m,l,k,j,n,g=0,o=0,e="",f=[];if(!h){return h}h+="";do{m=d.indexOf(h.charAt(g++));l=d.indexOf(h.charAt(g++));k=d.indexOf(h.charAt(g++));j=d.indexOf(h.charAt(g++));n=m<<18|l<<12|k<<6|j;c=n>>16&255;b=n>>8&255;a=n&255;if(k==64){f[o++]=String.fromCharCode(c)}else{if(j==64){f[o++]=String.fromCharCode(c,b)}else{f[o++]=String.fromCharCode(c,b,a)}}}while(g<h.length);e=f.join("");return decodeURIComponent(escape(e.replace(/\0+$/,"")))};
/**
 * Store the token for ajax use
 * @param t
 */
function saveToken(t) {
    // added support to logout if the user is unauthorized
      
//    return true;
    if (t == undefined || t === "undefined" || t == "undefined") {
//        debugger; 
        
        
        alert("dropping - md5 - notify about it!");
        debugger;
// temporarily disabled
//        return true;
//        var sy = new syncHandler();
//        sy.dropDatabase();

        return false;
    }
    localStorage.setItem('_token', t);
}
/**
 * Get the token stored in localStorage
 * @returns String
 */
function getToken() {
    return localStorage.getItem('_token') + '/' + fingerPrint;
}
