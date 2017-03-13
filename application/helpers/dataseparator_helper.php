<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');


if (!function_exists('attachDataToPrinter'))
{

    /** 
     * Connects printers with corresponding items which should be printed only on them
     * 
     * @param array $id_printers - real printers ids, we bind data to each printer by its id which it should print
     * @param array $resCorrespondingPrintersToItems -  ids of printers on which each item should be printed
     * @param array $arrContentOfItem  - array of items
     * @return arrray - concatenated array with ids of printers and data
     */
    function attachDataToPrinter($id_printers, $resCorrespondingPrintersToItems,
                                 $arrContentOfItem)
    {
//    echo "bound together";
        for ($i = 0; $i < count($resCorrespondingPrintersToItems); $i++)
        {
            $itemShouldBePrintedOnPrinterWithId = $resCorrespondingPrintersToItems[$i]["idPrinter"];
            for ($i2 = 0; $i2 < count($id_printers); $i2++)
            {
                if ($itemShouldBePrintedOnPrinterWithId == $id_printers[$i2]['id'])
                {
                    if (strlen($id_printers[$i2]['item']) != 0)
                    {
                        $id_printers[$i2]['item'] .= ', ';
                    }
                    $id_printers[$i2]['item'] .= json_encode(array($arrContentOfItem[$i]));
                    break;
                }
            }
        }

//    echo "glued";
        return $id_printers;
    }

}


if (!function_exists('getPrintersIds'))
{

    /* *  
     * Retrieves ids of printers from db for later attaching data to them
    * @return type - printer's id
    */

    function getPrintersIds()
    {
        $CI = &get_instance();
        $result = $CI->db->select('id')
                    ->get('pos_printers')->result_array();
        return $result;
    }

}

if (!function_exists('replaceContentInData'))
{

    /**
     * Data destinated for a printer should only contain items which are for it. Itially 
     *  it contains all data. Replacing only with necessary
     * 
     * @param type $data
     * @param type $newContent
     * @return type - 
     */
    function replaceContentInData($data, $newContent)
    {
        $data = json_decode($data);
        $newContent = '[' . $newContent . ']';
        $uncoded = json_decode($newContent, true);

//        echo "uncoded before";
//        var_dump($uncoded);

        $line = '';
        for ($i = 0; $i < count($uncoded); $i++)
        {
            if ($uncoded[$i][0]["printed"])
            {
                array_splice($uncoded, $i, 1);
                $i--;
            }
            else
            {
                if ($i != 0)
                {
                    $line .= ',';
                }

                $line .= json_encode($uncoded[$i][0]);
            }
        }

//        echo "only not printed elements";
//        var_dump($uncoded); 
//        $data->contents = $newContent;

        if (count($uncoded) == 0)
        {
            return false; // nothing to print, because all items were printed
        }


//        $data->contents = substr(json_encode(array($uncoded)), 1, -1); 
        $data->contents = '[' . $line . ']';

        return $data;
    }

}

if (!function_exists('reproduceCopies'))
{

    function reproduceCopies($arrIdsOfItems, $resCorrespondingPrintersToItems)
    {
//        echo "number of copies";
//        var_dump(array_count_values($arrIdsOfItems));

        $numberOfCopies = array_count_values($arrIdsOfItems);

        foreach ($numberOfCopies as $index => $elem)
        {
            if ($elem != 1)
            {
                for ($i = 0; $i < count($resCorrespondingPrintersToItems); $i++)
                {
                    if ($resCorrespondingPrintersToItems[$i]["product_id"] == $index)
                    {
                        // starting from  1 index, because we already have one item in the array    
                        for ($k = 1; $k < $elem; $k++)
                        {
                            if (!empty($resCorrespondingPrintersToItems[$i]))
                            {
                                $resCorrespondingPrintersToItems[] = $resCorrespondingPrintersToItems[$i];
                            }
                        }

                        break;
                    }
                }
            }
        }

//        echo "ids of items";
//        var_dump($arrIdsOfItems);
        usort($resCorrespondingPrintersToItems,
              function($a, $b)
        {
            return $a['product_id'] - $b['product_id'];
        });

//        echo "corresponding resulsts - modified";
//        var_dump($resCorrespondingPrintersToItems);

        return $resCorrespondingPrintersToItems;
    }

}


define('CUSTOM_ITEM_ID', -1);

if (!function_exists('replaceIdsForItemsWithNonRealIDs'))
{
/**
 * Almost all items have ids. But some kind of items like discounts or additional fees don't have 
 * id in DB.  On the stage of data separation between printers we need to now to which printer belong data.
 * We can't know for above mentioned kind of items so assigning them to non-existent printer with id equal to -1
 * 
 * @param type $listOfItems
 * @return type
 */
    function replaceIdsForItemsWithNonRealIDs($listOfItems)
    {

        $result = array();
        foreach ($listOfItems as $ind => $elem)
        {
            if (is_numeric($elem))
            {
                $result [] = $elem;
            }
            else
            {
                $result [] = CUSTOM_ITEM_ID;
            }
        }

        return $result;
    }

}


if (!function_exists('checkIfAnyPrinterWasSelected'))
{

    function checkIfAnyPrinterWasSelected($arrPrinters)
    {
//    var_dump($arrPrinters);
// echo "gfnfjk";    
        foreach ($arrPrinters as $elem)
        {
            $elem = json_decode($elem);

            if ($elem->copies != 0)
            {
//            echo "found";
                return true;
            }
        }

//    echo "not found";
        return false;
    }

}
if (!function_exists('cleanUpFromCustomItems'))
{

    function cleanUpFromCustomItems($elements)
    {
        $arrRes = array();
        foreach ($elements as $ind => $elem)
        {
            if (is_numeric($elem['id']))
            {
                $arrRes[] = $elem;
            }
            else
            {
                if (isset($elem['idNumerical']) && checkIfAnyPrinterWasSelected($elem['custom_items_printers']))
                {
                    $elem['id'] = $elem['idNumerical'];
                    unset($elem['idNumerical']);
                    unset($elem['custom_items_printers']);
                    $arrRes[] = $elem;
                }
            }
        }
        return $arrRes;
    }

}


if (!function_exists('divideItemsBetweenPrinters'))
{

    /**
     *  Parses items  and separates them between printers
     * @param type $contents
     * @return type
     */
    function divideItemsBetweenPrinters($contents)
    {

        $CI = &get_instance();
        $content = json_decode($contents, true);
        $arrContentOfItem = json_decode($content["contents"], true);

//        var_dump($arrContentOfItem);
//        die("fd");

        $arrContentOfItem = cleanUpFromCustomItems($arrContentOfItem);


        usort($arrContentOfItem,
              function($a, $b)
        {
            return $a['id'] - $b['id'];
        });

//        echo "content";
//        var_dump($arrContentOfItem);
//
//        die("gfdf");


        $arrIdsOfItems = array();
        foreach ($arrContentOfItem as $elem)
        {
            $arrIdsOfItems[] = $elem['id'];
        }

        //removing numbers from array
//        $arrIdsOfItems = array_filter($arrIdsOfItems, 'is_numeric'); 
        $arrIdsOfItems = replaceIdsForItemsWithNonRealIDs($arrIdsOfItems);



        $arrIdsOfItemsAsArray = $arrIdsOfItems;
        $arrIdsOfItems = join(',', $arrIdsOfItems);

        $sql = "SELECT `idPrinter`, `product_id` FROM tbl_product WHERE `product_id` IN ($arrIdsOfItems)";


//        echo "sql request";
//        var_dump($sql);

        $resCorrespondingPrintersToItems = $CI->db->query($sql)->result_array();


//        echo "corresponding";
//        var_dump($resCorrespondingPrintersToItems);


        if (count($resCorrespondingPrintersToItems) != count($arrIdsOfItemsAsArray))
        {
            $resCorrespondingPrintersToItems = reproduceCopies($arrIdsOfItemsAsArray,
                  $resCorrespondingPrintersToItems);
        }

        // cleaning up from the additional field
        for ($i = 0; $i < count($resCorrespondingPrintersToItems); $i++)
        {
            unset($resCorrespondingPrintersToItems[$i]["product_id"]);
        }

//        echo "corresponding resulsts _changed";
//        var_dump($resCorrespondingPrintersToItems);
//
//        die("ready");

        $id_printers = getPrintersIds();
//        var_dump($id_printers);
//        echo "bunch of printers";
//        var_dump($id_printers);
//        echo "bynch of corresp pr";
//        var_dump($resCorrespondingPrintersToItems);
//        var_dump($id_printers);


        $itemsWithCorrespondingPrinters = attachDataToPrinter($id_printers,
              $resCorrespondingPrintersToItems, $arrContentOfItem);

//        echo "attached elements";
//        var_dump($itemsWithCorrespondingPrinters);

        return $itemsWithCorrespondingPrinters;
    }

}

if (!function_exists('addFieldToData'))
{
/**
 * Attaches an attribute to Class
 * @param type $originalData
 * @param type $dataToAdd
 * @return type
 */
    function addFieldToData($originalData, $dataToAdd)
    {
        $originalData = json_decode($originalData);
        $originalData->manager_printer = $dataToAdd;
        $originalData = json_encode($originalData);
        return $originalData;
    }

}
