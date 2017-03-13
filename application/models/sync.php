<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/11/14
 * Time: 11:05 AM
 */
//define('LOG_FILE', 'logcache67.txt');

class Sync extends CI_Model
{

    var $CI;

    public function __construct()
    {
        // Call the Model constructor
        parent::__construct();
        $this->CI = & get_instance();
    }

    public function cleanTokensAndSyncData($number_of_days)
    {      //run this on logout/login or via cron/mysql events
        $delete_old_tokens = $this->db->query("DELETE FROM pos_tokens WHERE `date_added` < (NOW() - INTERVAL $number_of_days DAY)");
        $delete_old_sync = $this->db->query("DELETE FROM pos_sync WHERE `timestamp` < (NOW() - INTERVAL $number_of_days DAY)");
        if ($delete_old_sync == "1" AND $delete_old_tokens == "1" ) {
           return true;
        }
        else {
            return false;
        }
    }

    private function formLastPartDisplayID($order_code)
    {
        $explotedLine = explode('-', $order_code);
        $res = $this->db->query("SELECT GetNextDisplayId()");
        $resulting_array = $res->result_array();

        $displayID = $resulting_array[0]['GetNextDisplayId()'];

        $displayID = $explotedLine[0] . '-' . $explotedLine[1] . '-' . $displayID;
        return $displayID;
    }

    /**
     *  Gets display_id by order code
     * @param type $unique_id
     */
    public function getDisplayId($unique_id)
    {

        $this->db->query("SELECT controlDisplayID()");

        $this->db->select('display_id');
        $this->db->where('unique_id', $unique_id);
        $orders = $this->db->get('pos_orders');

        return $orders->row_array();
    }

    /**
     *  Checks whether this is a new item
     * @param type $unique_id
     * @return boolean
     */
    private function checkExistenceOfOrder($unique_id)
    {
        $data = $this->getDisplayId($unique_id);
        if (isset($data['display_id']))
        {
            return $data['display_id'];
        } else
        {
            return false;
        }
    }

    /**
     * @param $data
     * @param $table
     * @return array
     */
    public function store($data, $table, $curtime = 0)
    {
//           echo "s";
//                var_dump($table);
//
//        echo "data ";
//        var_dump($data);

        switch ($table)
        {

            case 'pos_orderitems':

//                echo "tabled entered ";
//                var_dump($table);
//
//                echo "here entered - data";
//                var_dump($data);

                $this->db->insert_batch($table, $data);
                $id = $this->db->insert_id();

                break;
            case 'pos_balances':
                $this->db->insert_batch($table, $data);
                $id = $this->db->insert_id();
                break;

            case 'pos_orders':
//                echo "hererrrrrrr";
              // var_dump($data);

                if (isset($data[0]) && is_array($data[0]))
                {
                    foreach ($data as $elem)
                    {
                        $dataToUpdate = array('voided' => $elem['voided']);
                        $this->db->where('unique_id', $elem['unique_id']);
                        $this->db->update($table, $dataToUpdate);
//                        $this->db->where('userid', $data['userid'])->update($table, $data);
                    }
//                    $this->generatingDisplayId();
                } else
                {
//                    echo "only one";
                    $this->CI->load->library('special_js');
                    $user = $this->getUserByPhone($data);
                    $data['user_id'] = $user['id'];
                    $delay = $this->CI->special_js->delay($curtime);
                    $data['date'] = $data['date'] + $delay;
                    $data['order_id'] = 0;
                    $display_id = $this->checkExistenceOfOrder($data['unique_id']);

//                    echo "returned value ";
//                    var_dump($display_id);

                    if (is_bool($display_id) && $display_id == false)
                    {
//                        echo "generating new";
                        $data['display_id'] = $this->formLastPartDisplayID($data['order_code']);
                    } else
                    {
//                        echo "using old one";
                        $data['display_id'] = $display_id;
                    }

//                    echo " all data <br/>";
//                    echo "order code";
//                   var_dump($data['order_code']);
//                    echo "inserting a field";
//                    var_dump($data);

                    $this->db->delete($table, array('unique_id' => $data['unique_id']));
                    $this->db->insert($table, $data);
                    $id = $this->db->insert_id();

//                    $this->generatingDisplayId();

                    $this->must_sync(array(
                        'orders' => $id,
                        'order_items' => $id
                    ));
                }


//                echo "finised fine";
                break;

            case 'users':

//                            $db = $this->db->get_where('users', array('mobile' => $data['mobile']))->row_array();
//                            var_dump($db);
//                            echo "next_parameter";
                // getting users with this phone number
//                             $length = $this->db->get_where('users', array('mobile' => $data['mobile']))->num_rows();
//                             var_dump($length);
//                            echo "finished";
//                var_dump($data);
                if ($data['userid'] == 0)
                {
//                                    echo "inserting";
                    $this->db->insert($table, $data);
                    $id = $this->db->insert_id();
                } else
                {
//                                       echo "updating";
                    $this->db->where('userid', $data['userid'])->update($table, $data);
//                                var_dump($res);
                    $id = $data['userid'];
                }
                break;



            default:
                $this->db->insert($table, $data);
                $id = $this->db->insert_id();
                break;
        }

        $out = Array();
        $out['success'] = true;
        $out['inserted_id'] = $id;

        return $out;
    }

    public function getUserByPhone($data)
    {
        if (!isset($data['address']))
        {
            return array('id' => 0);
        }

        $customer_data = explode(' ', $data['address']);
        $number = array_pop($customer_data);
        $out_data = array();

        $db = $this->db->get_where('users', array('mobile' => $number))->row_array();

        if (is_array($db) && count($db) > 0)
        {
            $out_data['name'] = $db['first_name'] . ' ' . $db['last_name'];
            $out_data['address'] = $db['address'];
            $out_data['phone_number'] = $db['mobile'];
            $out_data['id'] = $db['userid'];
        } else
        {
            $out_data['name'] = $customer_data[0] . ' ' . $customer_data[1];
            $out_data['address'] = $customer_data[2] . ' ' . $customer_data[3] . ' ' . $customer_data[4] . ' ' . $customer_data[5];
            $out_data['phone_number'] = $customer_data[6];
            $out_data['id'] = 0;
        }

        return $out_data;
    }

    public function getPOSUserByPhone($data)
    {
        if (!isset($data['address']))
        {
            return array('id' => 0);
        }

        $customer_data = explode(' ', $data['address']);
        $number = array_pop($customer_data);
        $out_data = array();

        $db = $this->db->get_where('users', array('mobile' => $number, 'usertypeid' => 3))->row_array();

        if (is_array($db) && count($db) > 0)
        {
            $out_data['name'] = $db['first_name'] . ' ' . $db['last_name'];
            $out_data['address'] = $db['address'];
            $out_data['phone_number'] = $db['mobile'];
            $out_data['id'] = $db['userid'];
        } else
        {
            $out_data['name'] = $customer_data[0] . ' ' . $customer_data[1];
            $out_data['address'] = $customer_data[2] . ' ' . $customer_data[3] . ' ' . $customer_data[4] . ' ' . $customer_data[5];
            $out_data['phone_number'] = $customer_data[6];
            $out_data['id'] = 0;
        }

        return $out_data;
    }

    /**
     * @param $data
     * @param $table
     */
    public function del($data, $table)
    {
        switch ($table)
        {
            case 'pos_orders':

                /* $this->db->where('order_id', $data['order_id']);
                  $this->db->delete('pos_orders');

                  $this->db->where('order_id', $data['order_id']);
                  $this->db->delete('pos_orderitems');
                 */
                $db = $this->db->get_where($table, array('order_code' => $data['order_code']))->row_array();
                if (is_array($db))
                {
                    $idOrder = $db['id'];
                    $this->db->delete($table, array('order_code' => $data['order_code']));
                    $this->db->delete('pos_orderitems', array('order_id' => $idOrder));
                }
                break;
        }
        return array();
    }

    /**
     * @param $time
     * @return array
     */
    public function get($time)
    {
        $return = array();
        //$date = date("d-m-Y h:i:s", $time);

        $data = $this->db->where(array("UNIX_TIMESTAMP(`timestamp`) >" => $time))->get("pos_sync");

        foreach ($data->result() as $sync)
        {
            $return[] = $sync;
        }

        return $return;
    }

    /**
     * @param $table
     * @param $id
     * @param $i
     * @param $coll
     * @return mixed
     */
    public function selectiveSync($table, $id, $i, $coll, $action)
    {
        $return['info'] = array(
            'table' => $table,
            'id' => $id,
            'i' => $i,
            'coll' => $coll
        );
        $return['action'] = $action;


        switch ($table)
        {
            case 'products':
                $this->CI->load->model('products_model');
                $product = $this->CI->products_model->getProducts($id);
                $return['data'] = $product[0];
                break;
            case 'product_options':
                $this->CI->load->model('products_model');
                $product = array(
                    'product_id' => $id,
                    'options' => json_encode($this->CI->products_model->getOptionsForProduct($id))
                );
                $return['data'] = $product;
                break;
            case 'orders':
                $this->CI->load->model('orders');
                $order = $this->orders->getOrderList($id);
                $return['data'] = $order[0];
                break;
            case 'order_items':
                $this->CI->load->model('orders');
                $order_items = $this->orders->getOrderItems($id);
                $return['data'] = $order_items;
                $return['info']['multi'] = true;
                break;
        }

        return $return;
    }

    public function must_sync($what, $action = 'update')
    {
        $data = array();

        foreach ($what as $type => $type_id)
        {
            $data[] = array(
                'type' => $type,
                'type_id' => $type_id,
                'action' => $action
            );
        }

        if (count($what) == 1)
        {
            $this->db->insert('pos_sync', $data[0]);
        } else
        {
            $this->db->insert_batch('pos_sync', $data);
        }
    }

    public function get_admin_customers()
    {
        $data = array();
        $q = $this->db->query("SELECT u.`userid` as `id`, CONCAT(u.`first_name`, ' ', u.`last_name`) as `name`, COUNT(u.`userid`) as `count`
                                FROM `pos_orders` o, `users` u
                                WHERE o.`user_id` = u.`userid`
                                GROUP BY u.`userid`");

        foreach ($q->result() as $row)
        {
            array_push($data, (array) $row);
        }

        return $data;
    }

    private function _contains_array($array)
    {
        foreach ($array as $value)
        {
            if (is_array($value))
            {
                return true;
            }
        }
        return false;
    }

//    $user = $this->getUserByPhone($data);
//				$data['user_id'] = $user['id'];
//				$delay = $this->CI->special_js->delay($curtime);
//				$data['date'] = $data['date'] + $delay;
//				$this->db->delete($table, array('order_code' => $data['order_code']));
//				$this->db->insert($table, $data);
//				$id = $this->db->insert_id();
//
//				$this->must_sync(array(
//					'orders'        => $id,
//					'order_items'   => $id
//				));
//

    public function getDisplayIdForUniqueId($unique_id)
    {

        define('ORDER_IS_CHECKED_OUT_IDENTIFIER', 'checkout');
        $this->db->select('display_id');
        $this->db->where('unique_id', $unique_id);
        $orders = $this->db->get('pos_orders');

//
//          echo "all orders <br/>";
//        var_dump($orders);
        $resulting_array = $orders->result_array();

//        echo "resulting array";
//        var_dump($resulting_array);
        if (count($resulting_array) > 0)
        {
//            echo "this parked order was already checke out";
            return $resulting_array[0];
        }

//        echo "as array";
//        var_dump($orders->row_array());
//        echo "false";
        return false;
//        return $orders->row_array();
    }

    public function checkOrderCodeForPresenseInDB($unique_id)
    {

        define('ORDER_IS_CHECKED_OUT_IDENTIFIER', 'checkout');
        $this->db->select('status');
        $this->db->where('unique_id', $unique_id);
        $orders = $this->db->get('pos_orders');

//
//          echo "all orders <br/>";
//        var_dump($orders);
        $resulting_array = $orders->result_array();

//        echo "resulting array";
//        var_dump($resulting_array);
        if (count($resulting_array) > 0 && $resulting_array[0]['status'] == ORDER_IS_CHECKED_OUT_IDENTIFIER)
        {
//            echo "this parked order was already checke out";
            return true;
        }

//        echo "as array";
//        var_dump($orders->row_array());
//        echo "false";
        return false;
//        return $orders->row_array();
    }

    public function pushLocalData($data)
    {
        if (is_array($data))
        {

            foreach ($data as $item)
            {
                $db_data = json_decode($item['data'], 1);
//                var_dump($db_data);
                if ($this->_contains_array($db_data))
                {
//                    echo " Atable is   ";
//                    var_dump($db_data);
//                     if ($item['table'] == 'pos_orders') {
//
//                        echo "this pos_orders table 1";
//                    }

                    if (!isset($db_data['order_code']))
                    {
                        continue;
                    }

                    $this->db->delete($item['table'], array('unique_id' => $item['unique_id']));

//                    echo "first";
                    $db_data['display_id'] = $this->formLastPartDisplayID($db_data['order_code']);


                    $this->db->insert_batch($item['table'], $db_data);
                } else
                {
//                       echo "second";
//                    echo " Btable is   ";
//                    var_dump($db_data);

                    $elementAccessible = json_decode($item['data'], true);
//                    var_dump($elementAccessible);
//                    echo "this order code is <br/>";
//                    var_dump($elementAccessible['order_code']);


                    if (!isset($db_data['order_code']))
                    {
                        continue;
                    }

                    if ($item['table'] == 'pos_orders')
                    {
                        $this->db->delete($item['table'], array('unique_id' => $elementAccessible['unique_id']));
                    }

                    $db_data['display_id'] = $this->formLastPartDisplayID($db_data['order_code']);
                    $this->db->insert($item['table'], $db_data);
                }
            }
        }

        return array('status' => 'done');
    }

    public function storeToken($fp, $token)
    {
        // store the record for update/insert
        $record = array('finger_print' => $fp, 'token' => $token);

        $this->db->insert('pos_tokens', $record);
    }

    public function checkToken($old, $new)
    {
        $status = false;
        list($token, $fp) = explode('/', $old);
        if ($token && $fp)
        {
            $q = $this->db->select('UNIX_TIMESTAMP(`date_added`) as `time`, UNIX_TIMESTAMP(NOW()) as `now`')->where(array(
                        'finger_print' => $fp, 'token' => $token))->get('pos_tokens');
//            echo $this->db->last_query();
            if ($q->num_rows() > 0)
            {
                $d = $q->row();
//                if ($d->time - $d->now < 300) {
                $status = true;
                $this->storeToken($fp, $new);
                /* } else {
                  $status = false;
                  } */
            } else
            {
                $status = false;
            }
        }
        return $status;
    }

    /**
     * Check user device against token.
     * If device name and token exists, return 1 else return -1
     * @param $name
     * @param $token
     * @return integer
     */
    public function checkUserDevice($name, $token)
    {
//        $data = 'checking(gfmmkldmkld) users device ' . $name . ' ' . $token;
//        file_put_contents(LOG_FILE, $data, FILE_APPEND);

        try
        {
            list(, $key) = explode('/', $token);
        } catch (Exception $e)
        {
//            file_put_contents(LOG_FILE, 'check failed with exception(vnjnvjkf)', FILE_APPEND);
//            file_put_contents(LOG_FILE, var_export($e,true), FILE_APPEND);

            return -1;
        }

//        file_put_contents(LOG_FILE, 'check was successful (nvcjkdfnj)', FILE_APPEND);

        $q = $this->db->where(array(
                    'key' => $key,
                    'name' => $name
                ))->get('pos_user_devices');

//        file_put_contents(LOG_FILE, 'reslt of search (oidfkdjdf)', FILE_APPEND);\
//        file_put_contents(LOG_FILE,var_export($q,true),FILE_APPEND);
        return ($q->num_rows() > 0) ? 1 : -1;
    }

    public function setOrderVoided($unique_id)
    {

        $dataToUpdate = array('voided' => 1);
        $this->db->where('unique_id', $unique_id);
        $result = $this->db->update('pos_orders', $dataToUpdate);

        return $result;
    }

}

//controlDisplayID()  -code built in as stored function in mysql, just in case
/*
 *
 * use pizza;

#SELECT * FROM pos_reset_plan;
SELECT * FROM pos_settings;


DELIMITER $$

DROP FUNCTION IF EXISTS controlDisplayID$$

CREATE FUNCTION  controlDisplayID() RETURNS VARCHAR(20)
BEGIN

BEGIN


SET @now := NOW();
#SET @now := str_to_date('2014-09-06 05:05:00','%Y-%m-%d %H:%i:%s');

# next_reset

SELECT  nextReset INTO @dateA FROM pos_reset_plan;
SELECT @now INTO @dateB;

SELECT ( unix_timestamp(@dateB) -  unix_timestamp(@dateA) ) INTO @difference;


#RETURN @difference;

# then we should reset
#IF @difference > 60*60*24 THEN
IF @difference > 0 THEN



SELECT value INTO @timeOfReset FROM `pos_settings` WHERE `name` = 'timeOfReset';
#RETURN @timeOfReset;

SELECT HOUR(@now) INTO @hoursCurTime;
#RETURN @hoursCurTime;



# calculating next day of resetting
IF @hoursCurTime > HOUR(@timeOfReset) THEN

 SET @newTime :=  DATE_FORMAT( DATE_ADD( @now, INTERVAL 1 DAY), '%Y-%m-%d' );
 SET @newTime := CONCAT_WS(' ',@newTime,@timeOfReset);


ELSE
  SET @newTime := DATE_FORMAT( @now, '%Y-%m-%d' );
  SET @newTime := CONCAT_WS(' ',@newTime,@timeOfReset);

END IF;

# we have a new time for updating here

SELECT value INTO @startNumber FROM `pos_settings` WHERE `name` = 'start_number';
UPDATE `pos_settings` SET `value` = @startNumber WHERE `name` = 'current_display_id';
UPDATE `pos_reset_plan` SET `nextReset` = @newTime WHERE id = '1';

RETURN @newTime;

END IF;

RETURN 'no need';

END

 *
 */

    /**
     *
     *  THIS IS THE CODE OF GetNextDisplayId function, just in case if something happens with db
     *
     * DELIMITER $$
      DROP FUNCTION IF EXISTS GetNextDisplayId$$

      CREATE FUNCTION GetNextDisplayId() RETURNS VARCHAR(50)

      BEGIN

      SELECT value INTO @step FROM `pos_settings` WHERE `name` = 'step_number';
      SELECT value INTO @currentDisplayID FROM `pos_settings` WHERE `name` = 'current_display_id';


      UPDATE `pos_settings` SET `value` = `value` + @step WHERE `name` = 'current_display_id';


      RETURN (@currentDisplayId + @step);
      END

     */
