<?php
 $people = array();
 $people['1'] = '{ "firstName": "Jane", "lastName": "Arquet", "age": 19 }';
 $people['2'] = '{ "firstName": "Akshai", "lastName": "Nayyar", "age": 24 }';
 $people['3'] = '{ "firstName": "Wang", "lastName": "Liu", "age": 27 }';
 $index = $_GET['id'];
 echo $people[$index];
?>