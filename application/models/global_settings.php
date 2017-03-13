<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 2/25/14
 * Time: 2:26 PM
 */
define('LOG_FILE', 'logcache67.txt');

class Global_settings extends CI_Model
{

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();
    }

    public function getTexts()
    {
        $texts = $this->db
                ->get('pos_texts');

        $data = array();

        foreach ($texts->result_array() as $text)
        {
            array_push($data, $text);
        }

        return $data;
    }


    public function getSettings()
    {
        $settings = $this->db
                ->get('pos_settings');

        $data = array();

        foreach ($settings->result_array() as $setting)
        {
            array_push($data, $setting);
        }

        return $data;
    }   

    public function getUsers()
    {
        $users = $this->db->select('id, username, firstname, lastname, phone, password, isadmin, show_all_parked_orders as allparkedorders, show_all_closed_orders as allclosedorders, show_glympse as glympse, show_open_close_day as dayfunctions, show_drawer_kick_open, can_delete_orders') 
                ->get('pos_users');
 
        $data = array();

        foreach ($users->result_array() as $user)
        {
            array_push($data, $user);
        }

        return $data;
    }

    public function getUsersSettings()
    {
        $settings = $this->db->get('pos_user_settings');



        $data = array();

        foreach ($settings->result_array() as $setting)
        {
            array_push($data, $setting);
        }

        return $data;
    }

    public function getTaxes()
    {
        $settings = $this->db->get('pos_taxes');

        $data = array();

        foreach ($settings->result_array() as $setting)
        {
            array_push($data, $setting);
        }

        return $data;
    }

    public function getBalances()
    {
//        $settings = $this->db->get('pos_balances'); 
//        $settings = $this->db->query('SELECT * FROM (SELECT * FROM pos_balances ORDER BY id DESC) as output GROUP BY type'); 
//        $settings = $this->db->query('SELECT * FROM (SELECT * FROM pos_balances ORDER BY id DESC) as output GROUP BY type ORDER BY date DESC');
//         $settings = $this->db->query('SELECT * FROM (SELECT * FROM pos_balances ORDER BY id DESC) as output GROUP BY type ORDER BY id DESC'); 
 
        $settings = $this->db->query('SELECT * FROM (SELECT * FROM pos_balances ORDER BY id DESC) as output GROUP BY type ORDER BY id DESC'); 


        $data = array();

        foreach ($settings->result_array() as $setting)
        {
            array_push($data, $setting);
        }

        return $data;
    }

    public function getAddresses()
    {
        $addresses = $this->db->get('pos_addresses');

        $data = array();

        foreach ($addresses->result_array() as $address)
        {
            array_push($data, $address);
        }

        return $data;
    }

    public function getSuburb()
    {
        $suburbs = $this->db->get('pos_suburb');

        $data = array();

        foreach ($suburbs->result_array() as $suburb)
        {
            array_push($data, $suburb);
        }

        return $data;
    }

    public function getPrinters()
    {
        $printers = $this->db->select('id, printer_name, ip, port, type, status')
                ->get('pos_printers');

        $data = array();

        foreach ($printers->result_array() as $printer)
        {
            array_push($data, $printer);
        }

        return $data;
    }

    public function getUser($id)
    {
        $user = $this->db->get_where('pos_users', array('id' => $id))->row();

        return $user;
    }

    public function loginUser($pass, $key)
    {
//        define('APPPATH', BASEPATH.$application_folder.'/');
//        define ('LOG_FILE', BASEPATH.'/logcache67.txt'); 



        $user = $this->db->get_where('pos_users', array('password' => $pass));
        $status = array();

        if ($user->num_rows() > 0)
        {
            $user = $user->row();
            $status['success'] = true;
            $status['id'] = $user->id;
            $status['isadmin'] = $user->isadmin;



//            $data = __LINE__ . '(vbkjnjkfg) user was foundnj ' . var_export($user, true);
//            file_put_contents(LOG_FILE, $data, FILE_APPEND);
        } else
        {


//            file_put_contents(LOG_FILE, '(cljhijohi)user not found', FILE_APPEND);
            $status['success'] = false;
        }

        if ($name = $this->input->cookie('b_cookie_name'))
        {

//            file_put_contents(LOG_FILE, '(ohykpkfh)cookies was found ', FILE_APPEND);

            $found = $this->db->get_where('pos_user_devices', array(
                        'name' => $name,
                        'key' => $key/* ,
                              'user_id'   => $user->id */
                    ))->num_rows();


//            $data = 'name ' . $name . '  key  ' . $key . ' (vdfoijd)';
//            file_put_contents(LOG_FILE, $data, FILE_APPEND);

            if ($found > 0)
            {
                $status['ds'] = true;


//                file_put_contents(LOG_FILE, ' found (gfjdjio)', FILE_APPEND);
            } else
            {
                $status['ds'] = false;


//                file_put_contents(LOG_FILE, ' not found (hpgkop)', FILE_APPEND);
            }
        } else
        {

//            file_put_contents(LOG_FILE, 'cookies was not found (pkpdsd)', FILE_APPEND);

            $status['ds'] = false;
        }

//        file_put_contents(LOG_FILE, 'total status (cmvnkjngi)' . var_export($status, true), FILE_APPEND);

        return $status;
    }

    public function checkTiltOpened()
    {

//		$sql = 'SELECT  max(`value`), `type` FROM pos_balances WHERE `type` IN ("open_tilt", "close_tilt")';
        $sql = 'SELECT `value`, `type` FROM pos_balances WHERE `type` IN ("open_tilt", "close_tilt") ORDER BY value desc LIMIT 1';
        $tilt = $this->db->query($sql);
        $tmp = $tilt->row_array();
        return ($tmp['type'] == 'open_tilt');
    }

    public function getCustomers()
    {
        $users = $this->db->select('*')->get_where('users', array('usertypeid' => 3));

        $data = array();

        foreach ($users->result_array() as $user)
        {
            array_push($data, $user);
        }
        return $data;
    }

    public function getHalfPizza()
    {
        $half = $this->db->select('half_pizza_group_name, half_pizza_group_fee')->get('half_pizza_group');

        $data = array();

        foreach ($half->result_array() as $item)
        {
            array_push($data, $item);
        }
        return $data;
    }

    public function getOpeningHours()
    {
        $hours = $this->db->select('day, first_half_fr, second_half_t')->get_where('tbl_shop_timings', array('timing_for' => 'D'));

        $weekday = array();
        $data = array();
        //var_dump($hours->result_array());
        foreach ($hours->result_array() as $item)
        {
            if (!is_null($item['first_half_fr']))
            {
                $start = explode(':', $item['first_half_fr']);
                $end = explode(':', $item['second_half_t']);

                $data['hours'][date('w', strtotime($item['day']))]['startHour'] = $start[0];
                $data['hours'][date('w', strtotime($item['day']))]['startMinute'] = $start[1];
                $data['hours'][date('w', strtotime($item['day']))]['endHour'] = $end[0];
                $data['hours'][date('w', strtotime($item['day']))]['endMinute'] = $end[1];
            } else
            {
                $data['exclude_days'][] = date('w', strtotime($item['day']));
            }
        }
        /*
          $data['exclude_days'] = '';
          if(isset($data['tmp_exclude_days']))
          {
          $data['exclude_days'] = implode(',', $data['tmp_exclude_days']);
          unset($data['tmp_exclude_days']);
          }
         */

        //var_dump($data); die;
        return $data;
    }

}
