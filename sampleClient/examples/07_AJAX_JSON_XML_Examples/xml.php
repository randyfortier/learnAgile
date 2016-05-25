<?php
header('Content-type: application/xml');

$people = array();

$person1 = array();
$person1['firstName'] = 'Jane';
$person1['lastName'] = 'Arquet';
$person1['age'] = 19;
$people[] = $person1;

$person2 = array();
$person2['firstName'] = 'Akshai';
$person2['lastName'] = 'Nayyar';
$person2['age'] = 24;
$people[] = $person2;

$person3 = array();
$person3['firstName'] = 'Wang';
$person3['lastName'] = 'Liu';
$person3['age'] = 27;
$people[] = $person3;

$index = $_GET['index'] - 1; // subtract one to account for zero-based indexing
?>
<results>
  <person firstName="<?php echo $people[$index]['firstName']; ?>" 
          lastName="<?php echo $people[$index]['lastName']; ?>"
          age="<?php echo $people[$index]['age']; ?>" />
</results>