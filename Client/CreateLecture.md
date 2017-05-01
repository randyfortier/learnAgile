# Creating a Lecture With Reveal Response System Attached

There is a few lines that need to be added to a Lecture so that the Reveal Response System can work with the lecture.  These things are:

 - Lecture ID 
 - Course ID
 - A line of including a .css file
 - Including a Handful of .js files
 - (Optional) Add follow functionality

### LectureID

The lecture ID is a unique identifier for the lecture, it can be any string value. the lecture ID is defined in any Javascript HTML script tag. The lecture ID needs to be defined before the .js files are included.

```html
<script type="text/javascript">
	var LectureID = "747969ea-8d7f-4a0f-807f-a2f8cee86eed";
</script>
```

The example above uses a uuid, but any string can be placed there.

### Course ID

The course ID is the unique identifier for the course this lecture is included in. The course ID can be found when first creating a Course or by querying the courses Table in mongo. the course ID is stored in the Lecture the same way that the LectureID is stored, in a Javascript HTML script tag.

```html
<script type="text/javascript">
	var CourseID = "9cdabd48-c208-4154-a62e-0bf8020739e0";
</script>
```

### include RevealResponse.css

Next is simple, include the following line the lecture.

```html
<link rel="stylesheet" href="/css/RevealResponse.css" />
```

### include Javascript files

Finally add the following line to the bottom of you lecture. NOTE: these html script tags need to be at the bottom of your Lecture. if they aren't then problem can occur in using the Reveal Response System.


```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js"></script>		
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.6/Chart.js"></script>
<script type="text/javascript" src="/js/table_func.js"></script>
<script type="text/javascript" src="/js/Instructor.js"></script>
<script type="text/javascript" src="/js/Student.js"></script>
<script type="text/javascript" src="/js/RevealResponse.js"></script>
```

The first 3 lines include socket.io, jquery and chart.js. if the lectures already include any of these lines, they can be delete, no need to have duplicates.

The last 4 lines include the functionality of the the Reveal Response System.



### (Optional) Add follow functionality

With the Reveal Response System, there is the ability for students lecture to follow the instructor’s lecture. So when the instuctor’s changes slide, the lecture on the students slide will change to the same slide. Add add this functionality, add the following line to the Reveal.initialize function.

```javascript
keyboard: {
	70: function() { studentFollow();}
}
```
NOTE: this just adds to the keyboard part of the Reveal.initialize function. the studentFollow() function is the function that does the work.


## An Example

There is an example called "LectureTemplate.html" that is in Templates Folder. The Templates Folder is located in this Folder.