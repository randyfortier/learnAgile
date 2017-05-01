# Running a Reveal Response Server

## 1. Install Node.js


### Windows/Mac
	
Go to [Node](https://nodejs.org/en/download/) and download and install it

### Linux

Google a tutorial, and example one for ubuntu is

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04


## 2. Install the node modules

Run the following to install the following

```bash
npm install
```

## 3. Install mongoDB

### Windows
	
Go to https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows

### Mac

Go to https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x

### Linux

Go to https://docs.mongodb.com/manual/administration/install-on-linux/



### 4. Run the Server

The Server is almost ready, run the server

```bash
node RevealResponseSystem.js
```

After running you should get this error 

```
Server started. Listening at *:3000
Error Trying to set up courses. DB Error: null, results.length: 0
uuid for first course: ....................................

```

This error is there because there is no courses in the database so we need to add one
the "...................................." above should be filled with a uuid that can be used for the creating of the first course



### 5. Adding First Course

First you need you need a course name, course description, course ID for this example we will use:

 - Course Name: CSCI 1040u
 - Course Description: Introduction to Computer Science
 - Course ID: d8085eac-cbfa-49fb-8974-018848065a08

NOTE: The course ID is a uuid was generated for the error found in instruction #4

To insert into the mongo database, open a terminal, and write this command

```bash
mongo
````
When in mongo, use the following command to change to the Reveal Response System database

```
use Response_System
```

From here, we have access to the table in the database. we want to insert into the courses table the information above. this is the following format

```
{
	courseid: "d8085eac-cbfa-49fb-8974-018848065a08",
	coursename: "CSCI 1040u",
	coursedesc: "Introduction to Computer Science"
}
```

This is reflected in the following Statement

```
db.courses.insert({courseid: "d8085eac-cbfa-49fb-8974-018848065a08", coursename: "CSCI 1040u", coursedesc: "Introduction to Computer Science"})
```

You should get a response similar to this:
 - WriteResult({ "nInserted" : 1 })

To confirm that the course was properly inserted, use the following statement

```
db.courses.find()

```

This should give you a statement similar to this
 - { "_id" : ObjectId("5906a4f75fe3d2a1d9a5e519"), "courseid" : "d8085eac-cbfa-49fb-8974-018848065a08", "coursename" : "CSCI 1040u", "coursedesc" : "Introduction to Computer Science" }


With this confirmed, Exit mongo


## 6. Make a folder for the course

Now we need to make a folder for the new course, go to the public folder that is the same folder as the RevealResponseSystem.js

In the public folder make a folder named after your course. This Name is made from the course Name with spaces removed and all letter make lowercase.

Ex.
 - Course Name: CSCI 1040u
 - Folder Name: csci1040u 

In this folder, then create a folder called "lectures". the final product should something like this

```
RevealResponseSystem.js
public (folder)
	js
	css
	csci1040u (folder)
		lecture (folder)

```

## 7. Start the server

```bash
node RevealResponseSystem.js
```

After running you should get the output:

```
Server started. Listening at *:3000
csci1040u CSCI 1040u d8085eac-cbfa-49fb-8974-018848065a08
```

This is to show that the course csci1040u is working, it will output all available courses.

## 8. Making a Instructor account

Finally navigate to your site

 - http://{Server_Location}/csci1040

This will redirect you to the login page. this is good, but not what we want, we want to register an account so, got to the following page

- http://{Server_Location}/csci1040/register_XDAPRTONGTY_InstructorForm


Fill out a username and password this will insert you as a Instructor


And with that you are good to go.

## Things To Note

1. to change the link for the register instructor see the extras.md
2. from now on it is easier to add courses see Client/createCourse.md
3. save the course uuid it will be needed when creating lectures




