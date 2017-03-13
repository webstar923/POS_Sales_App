<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/13/14
 * Time: 3:43 PM
 */
class Orders extends CI_Model
{

    public function getOrderList($id = false)
    {
//        $this->db->select('id, order_code, table, status, total, userId, pay_value, pay_type, note, date, address, voided, contents, order_type, order_time, credit_card_fee', 'rounding','order_status'); 
        
//        echo "herefdmnkjdfnjkn";
        $this->db->select('id, display_id, order_code, table, status, total, userId, pay_value, pay_type, note, date, address, voided, contents, order_type, order_time, credit_card_fee, rounding, order_status, unique_id');
        
        $this->db->where('date >', strtotime("midnight", time()));
        if ($id !== false)
        {
            $this->db->where('id', $id);
        }
        $orders = $this->db->get('pos_orders');

        $data = array();

        foreach ($orders->result_array() as $order)
        {
            if ($order['date'] != '')
            {
                $order['hour'] = date('h', $order['date']);
            } else
            {
                $order['hour'] = 0;
            }
            $order['date'] = date("Y-m-d h:i:s", $order['date']);
            array_push($data, $order);
        }
//        print_r($data);
//        var_dump($data);
        return $data;
    }

    public function getOrderListForCloseTilt($dateOpen)
    {
        $sql = 'SELECT SUM( total ) AS total, pos_taxes.type FROM pos_orders JOIN pos_taxes ON pos_taxes.id = pos_orders.pay_type WHERE pos_orders.pay_type !=0  AND pos_orders.voided=0 ' . 
                'AND DATE >=  ? GROUP BY pos_taxes.type';
        $orders = $this->db->query($sql, array($dateOpen));
        $data = array();
        $sql = 'SELECT value FROM pos_balances WHERE type="money_in" and id > (SELECT max(id) FROM pos_balances where type = "open_tilt" and value>=?)';
        $balances = $this->db->query($sql, array($dateOpen));
        $balVal = $balances->row_array();
        $data[] = array('type' => 'money_in', 'total' => $balVal['value']);

        $sql = 'SELECT SUM( total ) AS total FROM pos_orders  WHERE pos_orders.pay_type=0 AND DATE >=  ? AND  pos_orders.voided=0 '; 
        $ordersAlreadyPaid = $this->db->query($sql, array($dateOpen)); 
        if ($ordersAlreadyPaid->num_rows() > 0)
        {
            $row = $ordersAlreadyPaid->row_array();
            $data[] = array('type' => 'paid', 'total' => $row['total']);
        } else
        {
            $data[] = array('type' => 'paid', 'total' => 0);
        }
        foreach ($orders->result_array() as $row)
        {
            $data[] = array('type' => $row['type'], 'total' => $row['total']);
        }
        return $data;
    }

    public function getOrderListForPanel($userId, $showAllParkedOrders, $showAllClosedOrders)
    {
        $dateOpenTilt = 0;

//		$sql = 'SELECT  max(`value`) as value, `type` FROM pos_balances WHERE `type` IN ("open_tilt", "close_tilt")';
        $sql = 'SELECT `value`, `type` FROM pos_balances WHERE `type` IN ("open_tilt", "close_tilt") ORDER BY value desc LIMIT 1';
        $tilt = $this->db->query($sql);
        if ($tilt->num_rows() > 0)
        {
            $row = $tilt->row_array();
            if ($row['type'] == 'open_tilt')
            {
                $dateOpenTilt = $row['value'];
            }
        }
        //$sql = 'SELECT o.*,ot.name as "ot_name", ot.id as "ot_id" FROM pos_orders as o LEFT JOIN pos_order_types as ot ON o.order_type= ot.id WHERE o.date >= ? ';
        //$sql = 'SELECT `table`, status, contents, total, user_id, pay_value, pay_type, note, order_code, order_type, FROM_UNIXTIME(  `date` ,  "%Y-%m-%d %h:%i:%s" ) as date FROM pos_orders WHERE date >= ? ';
        $sql = 'SELECT `table`, status, contents, total, userId, pay_value, pay_type, note, order_code, order_type,  date, order_time, address, voided, credit_card_fee, rounding, order_status, display_id, unique_id  FROM pos_orders WHERE date >= ? ';
        //DOESN"T WORK for some reason $sql = 'SELECT `table`, name, status, contents, total, userId, pay_value, pay_type, note, order_code, order_type,  date, order_time, address, voided, credit_card_fee, rounding, order_status, display_id, unique_id  FROM pos_taxes JOIN pos_orders ON pos_taxes.id = pos_orders.pay_type WHERE date >= ? ';
                                                                                                                                                                                                                                                                                        
        $selectData = array($dateOpenTilt);
        if ($showAllParkedOrders == 0 && $showAllClosedOrders == 0)
        {
            $selectData[] = $userId;
            $sql .= ' AND userId=?';
        }
        if ($showAllParkedOrders == 1 && $showAllClosedOrders == 0)
        {
            $selectData[] = $userId;
            $sql .= ' AND (status="park" OR(status="checkout" AND userId=?))';
        }
        if ($showAllParkedOrders == 0 && $showAllClosedOrders == 1)
        {
            $selectData[] = $userId;
            $sql .= ' AND (status="checkout" OR(status="park" AND userId=?))';
        }
        $orders = $this->db->query($sql, $selectData);
        
        
//        var_dump($orders->result_array());
        
        return $orders->result_array();
    }

    public function getOrderItems($id = false)
    {
        if ($id !== false)
        {
            $this->db->where('order_id', $id);
        }
        $items = $this->db->get('pos_orderitems');

        $data = array();

        foreach ($items->result_array() as $item)
        {
            array_push($data, $item);
        }

        return $data;
    }

    public function getAllCoupons()
    {
        $now = date('Y-m-d');
        $coupons = $this->db->get_where('tbl_coupon', array('coupontype' => 'discount', 'discountper >' => '0', 'status' => 'active', 'expirydate >=' => $now));

        $data = array();

        foreach ($coupons->result_array() as $item)
        {
            array_push($data, array(
                'id' => $item['id'],
                'code' => $item['couponcode'],
                'description' => $item['coupondescription'],
                'percentage' => $item['discountper']
            ));
        }

        return $data;
    }

    /**
     * Verify if coupon is active
     * @param $coupon : coupon code
     * @return mixed
     */
    public function getCoupons($coupon)
    {

        $now = date('Y-m-d');
        $getCoupon = $this->db->where('couponcode', $coupon)->
                where('status', 'active')->
                where('expirydate >=', $now)->
                get('tbl_coupon')->
                row();

        if ($getCoupon)
        {
            return $getCoupon;
        } else
        {
            return false;
        }
    }

    public function getOrderTypes()
    {
        $types = $this->db->get('pos_order_types');

        $out = array();
        foreach ($types->result() as $type)
        {
            $out[] = array(
                'id' => $type->id,
                'name' => $type->name,
                'action' => $type->action,
                'type' => $type->type,
                'enabled' => $type->enabled
            );
        }

        return $out;
    }

    public function checkParkedOrder($unique_id)
    {
//        var_dump($unique_id);
        
        $canClose = false;
        $getOrder = $this->db->select('status')->
                where('unique_id', $unique_id)->
                get('pos_orders')->
                row_array();

//        echo "response";
//        var_dump($getOrder);
        
        if (!empty($getOrder) && isset($getOrder['status']))
        {
//             echo " here";
            if ($getOrder['status'] !== 'checkout')
            {
                $canClose = true;
            }
        } else 
        {
//            echo "we didn't come in";
        }
        return $canClose;
    }

}
