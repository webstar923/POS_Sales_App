<?php
/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 4/26/14
 * Time: 12:22 AM
 */

class Admin extends CI_Model {
    public function query($table, $p='', $perpag=4, $pag=0,$search='') {
        $return = array(
            'data'  => array()
        );
        $limit = ($pag*$perpag) . ", " . $perpag;

        switch ($table) {
            case 'orders':
                $order_type = false;
                if (strstr($p,'|')) {
                    list($p, $order_type) = explode('|', $p);
                }

                $where_search = '';
                if($search != '') {
                  $where_search = "AND LOWER(CONCAT_WS('|',o.contents,o.address,o.id,o.unique_id,o.display_id,o.status)) LIKE LOWER('%$search%')";
                }

                switch ($p) {
                    case 'today':
                        $start = strtotime(date('Y-m-d 00:00:00'));
                        $end = time();
                        break;
                    case 'last_week':
                        $start = strtotime('-7 days');
                        $end = time();
                        break;
                    case 'last_month':
                        $start = strtotime(date('Y-m-1'));
                        $end = time();
                        break;
                    case 'last_3_months':
                        $start = strtotime('-3 months 00:00:00');
                        $end = time();
                        break;
                    case 'other':
                        $start = strtotime('-3 months 00:00:00');
                        $end = time();
                        break;
                }

                $sql = "SELECT
                        o.*,
                        t.`name` AS `payment_method`,
                        u.`username`,
                        ot.`name` as `order_type`
                        FROM
                        `pos_orders` o
                        LEFT JOIN `pos_order_types` ot on ot.`id` = o.`order_type`
                        LEFT JOIN `pos_taxes` t ON t.`id` = o.`pay_type`
                        JOIN `pos_users` u ON o.`userId` = u.`id`
                        WHERE o.`date` between $start AND $end
                        $where_search
                        ORDER BY o.`date` DESC
                        LIMIT $limit";

                if ($order_type !== false && is_numeric($order_type) && $order_type > 0) {
                    $sql = "SELECT
                        o.*,
                        t.`name` AS `payment_method`,
                        u.`username`,
                        ot.`name` as `order_type`
                        FROM
                        `pos_orders` o
                        LEFT JOIN `pos_order_types` ot on ot.`id` = o.`order_type`
                        LEFT JOIN `pos_taxes` t ON t.`id` = o.`pay_type`
                        JOIN `pos_users` u ON o.`userId` = u.`id`
                        WHERE o.`date` between $start AND $end
                        AND o.`order_type` = '$order_type'
                        $where_search
                        ORDER BY o.`date` DESC
                        LIMIT $limit";
                }

                $data = $this->db->query($sql);

                foreach ($data->result() as $item) {
                    $return['data'][] = get_object_vars($item);
                }

                $sql = "SELECT COUNT(*) as `count`, SUM(`total`) as `total`, t.`type`
                        FROM `pos_orders` o
                        LEFT JOIN `pos_taxes` t ON t.`id` = o.`pay_type`
                        JOIN `pos_users` u ON o.`userId` = u.`id`
                        WHERE o.`date` between $start AND $end
                        $where_search
                        GROUP BY t.`type`";

                if ($order_type !== false && is_numeric($order_type) && $order_type > 0) {
                    $sql = "SELECT COUNT(*) as `count`, SUM(`total`) as `total`, t.`type`
                        FROM `pos_orders` o
                        LEFT JOIN `pos_taxes` t ON t.`id` = o.`pay_type`
                        JOIN `pos_users` u ON o.`userId` = u.`id`
                        WHERE o.`date` between $start AND $end
                        AND o.`order_type` = '$order_type'
                        $where_search
                        GROUP BY t.`type`";
                }

                $count = $this->db->query($sql);
                $split_total = array();
                $total = 0;
                foreach ($count->result() as $item) {
                    $split_total[$item->type] = $item->total;
                    $total += $item->count;
                }

                $return['all'] = ceil($total/$perpag);
                $return['total'] = $split_total;
                break;
            case 'tops':
                switch ($p) {
                    case 'staff':
                        $limit = "0, " . $perpag;
                        $sql = "SELECT
                                u.`id`,
                                CONCAT(u.`firstname`, ' ', u.`lastname`) as `name`,
                                COUNT(o.`userId`) as `count`
                                FROM
                                `pos_users` u
                                LEFT JOIN `pos_orders` o ON u.`id` = o.`userId`
                                GROUP BY o.`userId`
                                ORDER BY `count` DESC
                                LIMIT $limit";

                        $data = $this->db->query($sql);

                        foreach ($data->result() as $item) {
                            $return['data'][] = get_object_vars($item);
                        }

                        break;
                    case 'client':
                        $limit = "0, " . $perpag;
                        $sql = "SELECT u.`userid` as `id`, CONCAT(u.`first_name`, ' ', u.`last_name`) as `name`, COUNT(u.`userid`) as `count`
                                FROM `pos_orders` o, `users` u
                                WHERE o.`user_id` = u.`userid`
                                GROUP BY u.`userid`
                                ORDER BY `count` DESC
                                LIMIT $limit";

                        $data = $this->db->query($sql);

                        foreach ($data->result() as $item) {
                            $return['data'][] = get_object_vars($item);
                        }
                        break;
                    case 'products':
                        $limit = "0, " . $perpag;
                        $sql = "(SELECT
                                p.`product_id` as `id`,
                                p.`product_name` as `name`,
                                SUM(o.`quantity`) AS `count`
                                FROM
                                `tbl_product` p,
                                `pos_orderitems` o
                                WHERE
                                p.`product_id` = o.`product_id`
                                GROUP BY o.`product_id`
                                ORDER BY `count` DESC)
                                    UNION
                                (SELECT
                                p.`product_id` as `id`,
                                p.`product_name` as `name`,
                                SUM(o.`quantity`) AS `count`
                                FROM
                                `pos_products` p,
                                `pos_orderitems` o
                                WHERE
                                p.`product_id` = o.`product_id`
                                GROUP BY o.`product_id`
                                ORDER BY `count` DESC)
                                LIMIT $limit";

                        $data = $this->db->query($sql);

                        foreach ($data->result() as $item) {
                            $return['data'][] = get_object_vars($item);
                        }
                        break;
                }
                break;
            case 'staff-reports':
                $limit = ($pag*$perpag) . ', ' . $perpag;
                $sql = "SELECT *
                        FROM `pos_orders`
                        WHERE `userId` = $p
                        LIMIT $limit";

                $data = $this->db->query($sql);

                foreach ($data->result() as $item) {
                    $return['data'][] = get_object_vars($item);
                }

                $sql = "SELECT COUNT(*) as 'count', SUM(`total`) as `total`
                        FROM `pos_orders`
                        WHERE `userId` = $p";

                $count = $this->db->query($sql)->row();

                $return['all'] = ceil($count->count/$perpag);
                $return['total'] = $count->total;
                $return['staff'] = $p;

                $sql = "SELECT * FROM `pos_users`";
                $data = $this->db->query($sql);

                $return['users'] = array();
                foreach ($data->result() as $item) {
                    $return['users'][] = get_object_vars($item);
                }
                break;
            case 'pos_balances':
                $sql = "SELECT * FROM `pos_balances` ORDER BY `date` DESC";

                $data = $this->db->query($sql);
                $return['data'] = array();
                foreach ($data->result() as $item) {
                    $return['data'][$item->date][$item->type] = $item->value;
                }
                break;
        }

//        print_r($return);

        return $return;
    }
}