# Yes or No Response Questions

Yes/No Response Question(YNRQ) is Icon based quesiton that has 2 states, in the Reveal side they are repersented Icons that run along the right side of the lecture slide.  When the icon is coloured, then Icon it repersents a Yes answer, and when the icon is in gray scale, the Icon repersents the No answer.

In order to have YNRQ in you lecture slide, 2 thinks are needed

1. The inclusion of the Reveal Response System javascript file, the guide to with can be found in SETUP.md
2. Adding the YNRQ markup to each slide that a YNRQ	is wanted.

## The Markup

Each of the Markup YNRQ's will come in the form of a XML tag. These XML tags have a simple format, and requrire 3 fields of information
	
	-The Question name
	-The title of the question
	-The location of the icon for the question
	-A helpful tip about th Question

An example of the XML format:

	<question_name title="question_title" src="question_icon_location" tip="helpful_tip"></question_name>

Here is an example of a YNRQ, where:
-name is ishard
-title is isHard
-icon location is /image_location/Hard.png
-helpful tip is I think the subject is hard
	
	<ishard title="isHard" src="/image_location/Hard.png" tip="I think the subject is hard"></ishard>

## Adding the Markup to the Lecture

There is a format that need to be folow in order to have the Reveal Response System pick up the YNRQ markup. This format is to have The XML tags in a HTML script tag. This Si what the HTML Script tag should look like:

	<script class='YNRQuestion' YNRQuestion-section='Intro' type='text/xml'>

class - include 'YNRQuestion' to identify that this script tag include YNRQ XML tags.
YNRQuestion-section - This is to repersent which section the YNRQ XML tags belong to
type - 'text/xml' to indicate that the text in the script is in XML format


This is an example of a complete HTML script tag:

	<script class='YNRQuestion' YNRQuestion-section='Open data' type='text/xml'>
        <ishard title="isHard" src="/image_location/Hard.png" tip="I think the subject is hard"></ishard>
        <like title="Like" src="/image_location/Like.png" tip="I like this Section"></like>
	</script>

Having to write out the title, src, and tip all the time can be tedious, There are a set of standard YNRQ XML tags that can be used instead of having to write your own XML tags.

These are Standad Tags that are available:
    
    <difficult></difficult>
    <like></like>
    <study></study>
    

## Chosing a default

When there is a set of YNRQuestio that is wanted to be shown on each lecture slide in a section,
add the class "YNRQuestion-default", this will make that set of YNRQs appear on every slide that doesn't have any YNRQ markup.

A Example of a YNRQ default:

	<script class='YNRQuestion YNRQuestion-default' YNRQuestion-section='Outline' type='text/xml'>

	