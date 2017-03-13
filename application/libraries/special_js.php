<?php
class Special_js {
    public function delay($js_time) {
        if ($js_time > 0) {
            $php_time = time();
            return $php_time - $js_time;
        } else {
            return 0;
        }
    }
}