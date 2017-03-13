<?php

$texttoprint = "\033P TEXT \n \033M NEXT LINE \n \033GMORE STUFF";
$texttoprint = stripslashes($texttoprint);

//$fp = fsockopen("192.168.1.87", 9100, $errno, $errstr, 10);
$fp = fsockopen("220.233.160.54",9100, $errno, $errstr, 10);
if (!$fp) {
    echo "$errstr ($errno)<br />\n";die;
} else {
    echo"socket open OK ";

    fwrite($fp, "\033\100");
    $out = $texttoprint . "\r\n";
    fwrite($fp, $out);
    fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
    fclose($fp);
}
echo"THE END";
?>