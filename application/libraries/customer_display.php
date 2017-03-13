<?php


Class Customer_display extends CI_Controller {

public function __construct() {
        $this->CI =& get_instance();
}

public function showSimpleDisplay($first_line, $second_line, $type, $ip) {
        //$ip             = "192.168.99.100:5555";                      
        $ip2 = explode(":", $ip);
        $ip  = $ip2[0];                      
        $port= $ip2[1];
        if (filter_var($ip, FILTER_VALIDATE_IP)) {                
            if ($type == "product" OR $type == "changeback") {
                $second_line    = number_format($second_line,2);        
                $second_line    = "$" . $second_line;                
            }

            if ($type == "total") {
                $second_line    = number_format($second_line,2);
                $second_line    = ">>> $" . $second_line . " <<<";
            }   
                
            $first_line     = substr($first_line,0,20); //cut to max 20 characters
            $second_line    = substr($second_line,0,20);
            $first_line     = str_pad($first_line,20," ",STR_PAD_BOTH);  //center text
            $second_line    = str_pad($second_line,20," ",STR_PAD_BOTH); //center text

            include FCPATH . 'static/library/PhpSerial/PhpSerial.php';
            $serial = new PhpSerial;
            $serial->deviceOpen($ip, $port);
            $serial->sendMessage("\x1b\x40"); //first let's reset display
            $serial->sendMessage("$first_line");
            $serial->sendMessage("$second_line");
            $serial->deviceClose();
        //    echo "OK OK OK";
        }        
} //function showSimpleDisplay



} //class

?>