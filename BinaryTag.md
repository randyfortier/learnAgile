The binary tag format is a script html tag that includes "binary_tag" as it's class, and a field called "binary-section".

Example:

	<script class='binary_tag' binary-section='Outline' type='text/xml'>


Inside the script tag the xml format is <btag>.
the followed by xml tags of the icons that are to be displayed

Example:

	<btag>
		<like></like>
		<hard></hard>
	</btag>

There are a set of pre-made tags that are available. They are

	- <hard></hard>
	- <like></like>
	- <study></study>

Example :
	section - Outline
	tags - hard, like, study

	<script class='binary_tag' binary-section='Outline' type='text/xml'>
		<btags>
		    <hard></hard>
		    <like></like>
		    <study></study>
		</btags>
	</script>


How to create your own tags.

To create a new binary tag you will need:
	- Tag name
	- Tag title
	- Location of the tag image

This is how the binary tag xml is formated.

	<binary_tag_name title="binary_tag_title" src="binary_tag_icon_image_location"></binary_tag_name>

Example: of the tag

	<hard title="Hard" src="images/hard.png"></hard>

Example: of the whole tag

	<script class='binary_tag' binary-section='Outline' type='text/xml'>
		<btags>
		    <hard></hard>
		    <like></like>
		    <study></study>
		    <heart title='Heart' src='images/Heart.png'></heart>
		</btags>
	</script>


Binary Tag Default

What is it?
	It is the binary tag that will appear when there is no hard coded tag on that slide.

How to make a binary tag default?
	In the defintion of the script tag, add "binary_default" as a class and that will then become the default
	
	Example:

		<script class='binary_tag binary_default' binary-section='Outline' type='text/xml'>

What happend if there is no default?
	
	/*this is up for to you guys, this is how i currently have it*/
	the first available tag becomes the default
	/*i could as easly make it so the first tag is not the deafult(delete 3 line of code)*/