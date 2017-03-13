<?php

/*
 * Created on: 17.02.2015   16:42:01
 * 2015, Alex Shulzhenko,  contact@alexshulzhenko.ru
 */

if (!function_exists('prepareStringForPrinter'))
{/**
 * Line was formatted in advance in JS. Some additional nicing is still needed for printer
 *
 * @param string $line   vsriation + ingredients
 * @return string
 */

    // TODO All this function is too much complicated for a really simple task, need to be cleaned.
    // Garbage In Garbage Out : Remove and Clean the most before this function,
    // For exemple build the output from the JSON array and not the HTML
    function prepareStringForPrinter($line)
    {
        echo "line is $line";//die;
        //$line = '</b>' .     $line;
        //$removeAtEnd = array("<printer-indentation>", "</printer-indentation>", '<printer-space />');

        $replaced_spaces = preg_replace('/[[:space:]]+/', ' ', $line);
        $no_breaks = preg_replace('#<br\s*/?>#i', "", $replaced_spaces);
        $to_remove = array("<div>", "</div>", '<div class="indent">');
        $cleaned_string = str_replace($to_remove, "", $no_breaks);
        $exploded_line =   explode('</b>', $cleaned_string );
        $split = array_filter($exploded_line, function($elem)
        {
            //$elem=trim($elem);
            //if($elem !== "<b>" && $elem !== "<printer-space /><b> <printer-indentation>") {
            if(trim(strip_tags($elem)) !== "") {
                return strlen($elem);
            }
        });
        $split = array_values($split); //reindex array
        print_r($split);
        $final_line = '';
        for($x = 0; $x < count($split); $x++) {
            $subline_split = explode('<b>',$split[$x]);
            if ( strpos($subline_split[1],'<printer-indentation>') !== false) {
                $is_greater_than = ' >';
            } else {
                $is_greater_than = '>';
            }
            if(strpos($subline_split[0],'<printer-space />')){
                $is_greater_than = ' '.$is_greater_than;
            }

            $subline_split[0] = trim(strip_tags($subline_split[0])); //removing custom html tags, & trimming
            $subline_split[1] = trim(rtrim(strip_tags($subline_split[1]), ' ,')); //removing custom html tags, last comma & trimming

            $final_line .= ' ' . $is_greater_than . $subline_split[0] . ' ' . $subline_split[1] . "\n";
            $final_line = html_entity_decode($final_line);
            //$final_line = str_replace($removeAtEnd,"","$final_line");
        }
        //echo "final line is \n$final_line"; die; //TO BE REMOVED
        return $final_line;


        /*
        for($x = 0; $x < $arrlength; $x++) {
            $subline_split = explode('<b>',$split[$x]);

            if ( (strpos($subline_split[0],'NO:') !== false || strpos($subline_split[0],'EXTRA:') !== false) && ($is_greater_than == ' >') ) {
                $is_greater_than = ' >';
            }else{
                $is_greater_than = '>';
            }

            $final_line .= ' ' . $is_greater_than . trim($subline_split[0]) . ' ' . trim($subline_split[1]) . "\n";

            if ( strpos($subline_split[0],'1st HALF') !== false || strpos($subline_split[0],'2nd HALF') !== false ) {
               $is_greater_than = ' >'; //next line could be 'NO' or 'EXTRA' on a half pizza  - let's make it indented
            }

        }
        return $final_line;
        /*
        $line_finish ='';
        foreach ($split as  $ind => $elem)
        {
            $subline_split = explode('<b>',$split[$x]);

            $line_finish .= '  >' . strtoupper(  isset($subline_split[0]) ? trim( $subline_split[0]):'' ) . ' ' . (isset( $subline_split[1]) ? trim($subline_split[1]):'') .  "\n";
        }
        return $line_finish;
        */
    }
 }


if (!function_exists('fetchExtraItems'))
{
    /**
     * Formats line for separated extra of items divided between printers
     * @param type $items all data to be sent to printer
     * @return type
     */
    function fetchExtraItems($items)
    {
        $collection =json_decode($items->contents);
        $extra_cart = array();

        foreach ($collection as $ind => $elem)
        {
            $extra_cart[] = prepareStringForPrinter($elem->extra_cart);
        }

        return $extra_cart;
    }
}


if (!function_exists('showInfoAbotErrorAndDie'))
{

    function showInfoAbotErrorAndDie($file, $line, $info)
    {
        echo "im_____";
        echo `whoami`;
        echo "php says: ";
        print_r(error_get_last());
        echo '\ncritical error happened' . $file . '  ' . $line . ' ' . $info;
       //VV die;
    }
}

if (!function_exists('selectPrinterCommandSet'))
{
    function selectPrinterCommandSet($printer)
    {
        if ($printer == "thermal_1")
        {
            $POSCommand['testvar'] = "TEST1";
            //for full list of ESC commands see https://drive.google.com/file/d/0B_DC36ENkLf8NHg3dzdsNl91MXc/edit?usp=sharing
            $POSCommand['TXT_DOUBLE_SIZE'] = "\x1d\x21\x22"; //see page 31 bottom
            $POSCommand['TXT_DOUBLE2_SIZE'] = "\x1d\x21\x11";
            $POSCommand['TXT_DOUBLE_WIDTH'] = "\x1d\x21\x10";
            $POSCommand['TXT_DOUBLE_HEIGHT'] = "\x1d\x21\x01";
            $POSCommand['TXT_NORMAL_SIZE'] = "\x1d\x21\x00";
            $POSCommand['TXT_CENTER_JUSTIFICATION'] = "\x1b\x61\x01";
            $POSCommand['TXT_LEFT_JUSTIFICATION'] = "\x1b\x61\x00";
            $POSCommand['TXT_RIGHT_JUSTIFICATION'] = "\x1b\x61\x02"; # Right justification
            //$POSCommand['LINE_SPACING_DEFAULT'] = "\x1b\x33\x20";
            $POSCommand['LINE_SPACING_SMALLER'] = "\x1b\x33\x50";// line spacing for Xprinter is +20 from Rongta
            $POSCommand['LINE_SPACING_DEFAULT'] = "\x1b\x33\x40";// line spacing for Xprinter is +20 from Rongta
            $POSCommand['LINE_SPACING_1'] = "\x1b\x33\x55";  //line spacing for Xprinter is +20 from Rongta
            $POSCommand['LINE_SPACING_2'] = "\x1b\x33\x60"; //page 18  line spacing for Xprinter is +20 from Rongta
            $POSCommand['TXT_NORMAL'] = "\x1b\x21\x00"; # Normal text
            $POSCommand['TXT_UNDERL_OFF'] = "\x1b\x2d\x00"; # Underline font OFF
            $POSCommand['TXT_UNDERL_ON'] = "\x1b\x2d\x01"; # Underline font 1-dot ON
            $POSCommand['TXT_UNDERL2_ON'] = "\x1b\x2d\x02"; # Underline font 2-dot ON
            $POSCommand['TXT_BOLD_OFF'] = "\x1b\x45\x00"; # Bold font OFF
            $POSCommand['TXT_BOLD_ON'] = "\x1b\x45\x01"; # Bold font ON
            



            $POSCommand['TXT_FONT_A'] = "\x1b\x4d\x00"; # Font type A
            $POSCommand['TXT_FONT_B'] = "\x1b\x4d\x01"; # Font type B
                
            
            

            $POSCommand['TXT_FONT_OPEN'] = "\x1f\x1b\x1f\x2f\x01"; # Font opening tag - for some printer this needs to be used in order to be able to change font
            $POSCommand['TXT_FONT_CLOSE'] = "\x0A"; # Font closing tag - for some printer this needs to be used in order to be able to change font

            $POSCommand['TXT_CHAR_SET_FR'] = "\x1b\x52\x01"; // select international set to 01 (France) - otherwise Y (yen) is printed instead of $ for FONT B (THIS IS PROBABLY A BUG IN THE PRITNER'S FIRMWARE: 00 = JAPANESE AND 01 = USA)
            $POSCommand['TXT_CHAR_SET_US'] = "\x1b\x52\x00";
            $POSCommand['TXT_FONT_A'] = $POSCommand['TXT_FONT_OPEN'] . $POSCommand['TXT_FONT_A'] . $POSCommand['TXT_CHAR_SET_US'] . $POSCommand['TXT_FONT_CLOSE']; 
            $POSCommand['TXT_FONT_B'] = $POSCommand['TXT_FONT_OPEN'] . $POSCommand['TXT_FONT_B'] . $POSCommand['TXT_CHAR_SET_FR'] . $POSCommand['TXT_FONT_CLOSE'];    

            $POSCommand['OPEN_DRAWER'] = "\x1b\x70\x00\xff\x50"; #open cash drawer
            $POSCommand['BEEP_PRINTER'] = "\x1b\x42\x09\x03"; #printer's sound alarm - 09 is number of beeps. 05 is duration of a beep
            $POSCommand['PRINT_LOGO'] = "\x1c\x70\x01\x00"; //print logo
            $POSCommand['CUT_PAPER'] = "\n" . "\n" . "\n" . "\n" ."\x1d\x56\x31\x01"; //cut paper
            $POSCommand['BEEP_PRINTER'] = "\x1b\x42\x09\x09"; # Font type B
           //  $POSCommand['CUT_PAPER'] = "\x1d\x56\x42\x50"; // feed & cut paper - the feed is still the same for some reason -> using \n and immedieate cut above instead
           // $POSCommand['RESET_PRINTER'] = "\x1b\x40";

            $POSCommand['LINE_LENGHT'] = 48;
            $POSCommand['HEADER_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'];
            $POSCommand['DELIVERY_OR_TABLE'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'];
            $POSCommand['TIME_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE2_SIZE'];
            $POSCommand['CART_CONTENT_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_FONT_B'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_BOLD_ON'];
            $POSCommand['CART_CONTENT_VARIATION_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_FONT_B'] . $POSCommand['TXT_DOUBLE2_SIZE'];

            //$POSCommand['LINE_
            $POSCommand['DISCOUNT_IDENTIFICATOR'] = 'discount';
            $POSCommand['DISCOUNT_MISCELLANEOUS'] = 'misc-disc';
            $POSCommand['DISCOUNT_EXTRA_CHARGE'] = 'extraCharge';
        }

        if ($printer == "matrix_1")
        {
            $POSCommand['testvar'] = "TEST2";
            //for full list of ESC commands see https://drive.google.com/file/d/0B_DC36ENkLf8NHg3dzdsNl91MXc/edit?usp=sharing
            // $POSCommand['TXT_DOUBLE_SIZE'] = "\x1d\x21\x22"; //see page 31 bottom
            // $POSCommand['TXT_DOUBLE2_SIZE'] = "\x1d\x21\x11";
            $POSCommand['TXT_FONT_B'] = "\x1b\x21\x01"; # Font type B  TEST 9X9
            $POSCommand['TXT_FONT_A'] = "\x1b\x21\x00"; # Font type A  TEST  11X9
            $POSCommand['TXT_DOUBLE_WIDTH'] = "\x1b\x21\x20";  //OK?
            $POSCommand['TXT_TRIPLE_SIZE'] = "\x1b\x21\x30";  //largest size afer firmaware update
            //$POSCommand['TXT_DOUBLE_WIDTH'] = "\x1d\x21\x10";
            $POSCommand['TXT_DOUBLE_HEIGHT'] = "\x1d\x21\x10";  //OK?
            $POSCommand['TXT_EMPHASIZED'] = "\x1d\x21\x08";  //OK?
            $POSCommand['TXT_DOUBLE2_SIZE'] = $POSCommand['TXT_DOUBLE_HEIGHT'];
            $POSCommand['TXT_DOUBLE_SIZE'] = $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_EMPHASIZED'];

            $POSCommand['TXT_NORMAL_SIZE'] = "\x1b\x21\x00";  //OK?
            $POSCommand['TXT_CENTER_JUSTIFICATION'] = "\x1b\x61\x01"; //OK
            $POSCommand['TXT_LEFT_JUSTIFICATION'] = "\x1b\x61\x00"; //OK
            $POSCommand['TXT_RIGHT_JUSTIFICATION'] = "\x1b\x61\x02"; # Right justification OK
            $POSCommand['LINE_SPACING_DEFAULT'] = "\x1b\x33\x10";  //TEST
            $POSCommand['LINE_SPACING_1'] = "\x1b\x32\x15";  //TEST?!!
            $POSCommand['LINE_SPACING_2'] = "\x1b\x33\x35"; //page 18
            $POSCommand['TXT_NORMAL'] = "\x1b\x21\x00"; # Normal text
            //$POSCommand['TXT_UNDERL_OFF'] = "\x1b\x2d\x00"; # Underline font OFF
            $POSCommand['TXT_UNDERL_OFF'] = "\x1b\x21\x00"; # Underline font OFF   TEST
            //$POSCommand['TXT_UNDERL_ON'] = "\x1b\x2d\x01"; # Underline font 1-dot ON
            $POSCommand['TXT_UNDERL_ON'] = "\x1b\x21\x80"; # Underline font 1-dot ON TEST
            $POSCommand['TXT_UNDERL2_ON'] = "\x1b\x2d\x02"; # Underline font 2-dot ON
            $POSCommand['TXT_BOLD_OFF'] = "\x1b\x45\x00"; # Bold font OFF //OK
            $POSCommand['TXT_BOLD_ON'] = "\x1b\x45\x01"; # Bold font ON   //OK
            //$POSCommand['TXT_FONT_A'] = "\x1b\x4d\x00"; # Font type A
            //$POSCommand['TXT_FONT_B'] = "\x1b\x4d\x01"; # Font type B

            $POSCommand['OPEN_DRAWER'] = "\x1b\x70\x00\xff\x50"; #open cash drawer
            $POSCommand['BEEP_PRINTER'] = "\x1b\x42\x09\x03"; #printer's sound alarm - 09 is number of beeps. 05 is duration of a beep NOT OK
            $POSCommand['PRINT_LOGO'] = "\x1c\x70\x01\x00"; //print logo
            $POSCommand['CUT_PAPER'] = "\n" . "\n" . "\n" . "\n" . "\n" . "\n" . "\x1d\x56\x49\x00"; //cut paper OK
            $POSCommand['LINE_LENGHT'] = 38;
            $POSCommand['PRINT_RED'] = "\x1b\x72\x01";
            $POSCommand['PRINT_BLACK'] = "\x1b\x72\x00";
            $POSCommand['HEADER_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'];
            //$POSCommand['DELIVERY_OR_TABLE'] = $POSCommand['TXT_NORMAL'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'];
            $POSCommand['DELIVERY_OR_TABLE'] = $POSCommand['TXT_NORMAL'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_TRIPLE_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'];

            $POSCommand['TIME_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'];
            $POSCommand['CART_CONTENT_FORMAT'] = $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_FONT_A'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_BOLD_ON'];
            $POSCommand['CART_CONTENT_VARIATION_FORMAT'] = $POSCommand['TXT_NORMAL'] . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['LINE_SPACING_1'] . $POSCommand['TXT_FONT_A'] . $POSCommand['TXT_DOUBLE2_SIZE'];

            //$POSCommand['LINE_
            $POSCommand['DISCOUNT_IDENTIFICATOR'] = 'discount';
            $POSCommand['DISCOUNT_MISCELLANEOUS'] = 'misc-disc';
            $POSCommand['DISCOUNT_EXTRA_CHARGE'] = 'extraCharge';
        }
        return $POSCommand;
    }

}