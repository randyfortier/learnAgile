# learnAgile

This is a project about collecting real-time classroom analytics, inside a web-based classroom management system.

## Goals

The ultimate goal is to provide a better learning experience for the student.  This may be achieved through the following means:

 - instructor is able to adapt her/his classroom according to student responses
 - students are able to see some feedback about their weaknesses before tests
 - students are able to organize into symbiotic study groups, where each member may have mutually beneficial strengths as well as weaknesses
 - instructors may be able to better understand the challenges face by their students in the classroom
 - attendance to lectures may be improved by increasing student engagement

## Components

### Instructor Client

This client is a web application that shows the presentation, as well as some representation of the classroom analytic data, updated in real time.

### Student Client

This client is a web application that shows the presentation, and allows students to tag (e.g. I like this topic, This is hard, This will be on the test) each topic of the lecture.

### Server

The server is the information broker in this system.  Tag (and possibly other) data is collected from the student client, and fed to the instructor client.  Progression through the presentation/topics is collected from the instructor client, and fed to the student client.