<?php
/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 4/3/14
 * Time: 4:24 PM
 */

//define('LOG_FILE', 'logcache67.txt');

class Twofa {
    var $CI;

    public function __construct() {
        $this->CI =& get_instance();
    }

    public function genCode($user) {

        $this->CI->load->library('email');

        //$code = rand(1000, 9999);
        $code = "9999"; //TEMP

        $this->CI->db->update('pos_users', array(
            'last_code' => $code
        ), "id = " . $user->id);


        $this->CI->email->from('code@posapp.bywmds.us', 'Code Generator');
        $this->CI->email->to($user->phone);

        $this->CI->email->subject('Your Code is: ' . $code);
        $this->CI->email->message($code);

        $this->CI->email->send();

    }

    public function checkCode($code, $user_id, $device_name, $fp) {
        $check = $this->CI->db->get_where('pos_users', array(
                                                            'id' => $user_id,
                                                            'last_code' => $code
                                                        ));
        
//        file_put_contents(LOG_FILE, 'inserting a new user - checkcode', FILE_APPEND);
        
        
        if ($return = ($check->num_rows() > 0)) {
//        file_put_contents(LOG_FILE, 'a new user was inserted', FILE_APPEND);    
        
//        $data = 'more data : ' . $user_id . '  ' . $device_name . '  ' . $fp;
//        file_put_contents(LOG_FILE, $data, FILE_APPEND);    
             
            $this->CI->db->insert('pos_user_devices', array(
                'user_id'   => $user_id,
                'name'      => $device_name,
                'key'       => $fp
            ));
        }

        return $return;
    }
}


/**
 * Get Admin Email (TODO: Change to phone number)
 */
//$admin_email = $this->CI->db
//    ->get_where('pos_settings', array('name' => 'admin_phone_number'))->row();
//
//
//$this->CI->email->from('code@posapp.bywmds.us', 'Code Generator');
//$this->CI->email->to($admin_email->value);