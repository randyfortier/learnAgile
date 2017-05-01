//socket stuff
var socket = io();

//store the yn question date and the mc data
var YNRQuestion_section_default = {};
var MCRQ_correct_answer = {};
var MCRQ_question_status = {};

//have the student lectures follow the teacher lecture
var _studentFollow = null;

//adjusting size for mobile devices
var isMobile = false;
var mobileSize = 110;
var mobilePos = "110%"

/*
YNRQuestion/YNRQ - Yes No Response Question
MCRQuestion/MCRQ - Mutiple Choice Response Question
*/

/*********************************************
        Yes No Response Question Setup
**********************************************/
var standardYNRQuestions = {
    'like': {title:'Like', src:'/images/like.png', tip:'I find this content interesting'},
    'difficult': {title:'Difficult', src:'/images/hard.png', tip:'I find this content difficult'},
    'study': {title:'Study', src:'/images/study.png', tip:'I think I should study this for the test'}
};

/**
* Finds the default question in section of of the lecture and save that question
*so it can show up on the slides in the section that don't have questions.
*/
$('.slides').children().each(function(index){
    //check for the instances of YNRQs default question
    var default_question = $(this).find('.YNRQuestion-default');

    //if there is a default, save that default
    if(default_question[0])
    {
        setYNRQ_section_default(index, $(default_question[0]).text(), $(default_question).attr('YNRQuestion-section'));// add the first YNRQuestion_section_default to the default map
    }
});

function setYNRQ_section_default(index, text, section, tip)
{
    YNRQuestion_section_default['h_' + index] = {xml: text, section:section};
}

function getYNRQDataFromXML(xml)
{
    var standard = standardYNRQuestions[$(xml)[0].tagName.toLowerCase()];

    if(standard)
        return standard;
    else
    {
        var title = $(xml).attr('title');
        var src = $(xml).attr('src');
        var tip = $(xml).attr('tip');
        return {title: title, src:src, tip: tip};
    }
}



/*********************************************
    Mutiple Choice Response Question Setup
**********************************************/
//for each multiple choice html, convert it to current html
$('multiplechoice').each(function(index){
    //hide the question, so it won't appear on the screen anymore
    $(this).css('display', 'none');

    //the current multiple choice object
    var multiQuestion = this;
    var title = $(multiQuestion).attr('title');

    //replace the spaces in title with underscores, and make space for student answer
    //this is to make it work with the id properity in html
    var id = title.replace(/ /g, '_');
    MCRQ_question_status[title] = $(multiQuestion).attr('ca');

    //Get the correct answer
    MCRQ_correct_answer[id] = $(multiQuestion).attr('ca');
    $(multiQuestion).attr('ca', '-1');
    
    //add a spot for the question, and get the question text
    $(multiQuestion).after('<div id="question_'+id+'"></div>');
    var question = $(multiQuestion).find('question').html();
    
    //add the question text and an ordered list
    $('#question_'+id).append('<h2 id="'+id+'">'+question+'</h2>');
    $('#question_'+id).append('<ol id="answers_'+id+'" title="'+title+'"></ol>');

    //for each answer in the question add it to the question div, add 2 classes, answer for adding
    //click functionality and answer_'index' to be able to refrenece all answers in one question
    $(multiQuestion).find('answer').each(function(a_index){
        $('#answers_'+id).append('<li id="a_'+a_index+'" class="answer answers_'+index+'">'+$(this).text()+'</li>');
    });
});



/*********************************************
            Mobile Device Setup
**********************************************/
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;   
}


/*********************************************
            Student Follow Function
**********************************************/
function studentFollow()
{
    if(_studentFollow)
        _studentFollow();
}




/*********************************************
        Socket.IO Functionality
**********************************************/

//send the user the lecture id
if(LectureID && CourseID){
    socket.emit('lecture_server_setup', {title: $('title').text(), lectureID: LectureID, courseID: CourseID});
}

socket.on('lecture_client_setup', function(isInstuctor){
    //Set Up Student or Instructor Functionality
    if(isInstuctor){
        setUpInstructor();
    }
    else{
        setUpStudent();
    }


    /*********************************************
            Mutiple Choice Question 
    **********************************************/

    /*
    *Send answer to server, and check if any answers are closed
    */
    Object.keys(MCRQ_question_status).forEach(function(question){
        //send the title of the question and the answer to the question
        socket.emit('check_multiple_choice_question', {title:question, answer: MCRQ_question_status[question]});
        //set the status of the question to false
        MCRQ_question_status[question] = 0;
    });

    //close a MCRQ
    socket.on('close_multiple_choice_question', function(chart_data){
        
        //if the status is 0(question open), then close it.
        if(MCRQ_question_status[chart_data.title] === 0){
            MCRQ_question_status[chart_data.title] = 1;//only close the question once

            //setup the question title and the total number of answers
            var question_title = chart_data.title.replace(/ /g, '_');
            var num_answers = $('#'+question_title).next().children().length;
            

            var answer_list = "";
            //hide the answers to show the chart, all but the corrent answer
            $('#'+question_title).next().children().each(function(val, index){
                //on the correct answer
                if(index === (parseInt(MCRQ_correct_answer[question_title]) -1)){
                    //create a new ol with the answer set up
                    answer_list = '<ol start="'+ (index + 1) +'"><li>'+$(this).html()+'</li></ol>';
                }
            });

            //remove the old ol and and the new ol
            //NOTE: this is to get ride of the students onclick funtion that is attached to the
            //old ol's il. tried to get ride of it other ways and was running into trouble
            $('#'+question_title).next().remove();
            $('#'+question_title).after(answer_list);

            //add the canvas to the screen above the ol
            $('#'+question_title).after('<canvas id="'+question_title+'_chart" height="300" width="300" style="padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;"></canvas>');

            //create the chart on the canvas
            createChart(chart_data, $('#'+question_title+'_chart'), num_answers);

        }
    });


    /*********************************************
                Chart Functionality
    **********************************************/

    function createChart(chart_data, canvas, length)
    {
        //Bar chart API found here : http://www.chartjs.org/docs/#bar-chart

        //setup variables for use
        //title,the locaiton of the answer in MCRQ_correct_answer
        //data, the holder of the the chart data
        //data.labels, label for each of the bar graphs
        //data.datasets, the locaiton that holds the actual data the colour of the bar
        var title = chart_data.title.replace(/ /g, '_');
        var data = {};
        data.labels = [];
        data.datasets = [];

        //push onto the dataset the default data
        data.datasets.push({
            borderWidth : 1,
            borderColor : [],
            backgroundColor : [],
            data : []
        });


        //for each answer in the chart_data({a_\\NUMBER// : # of responses, ...})
        //add that data with the correct colour to the dataset
        for(var cnt = 0; cnt < length; cnt++){
            //push the label
            data.labels.push('Answer '+ (cnt + 1));
            data.datasets[0].data.push(0);
            
            //if the correct answer the use the green else black for the colour of the bar
            var color = {};
            if(MCRQ_correct_answer[title] === ""+(cnt+1)){
                color = {r:0,g:255,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
            else{
                color = {r:0,g:0,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
        }

        //get active users
        var activeUsers = chart_data.length - chart_data.inactive;

        //update chart with data for server
        //chart_data.answer format ({a_\\NUMBER// : # of responses, ...})
        Object.keys(chart_data.answers).forEach(function(item){
            // add data to the dataset
            //remove a_ from the item, its in the format of a_#
            var index = parseInt(item.replace('a_', ''));
            data.datasets[0].data[index] = chartFormat(chart_data.answers[item], activeUsers);
        });

        //set what the label of the bar is
        data.datasets[0].label = "% of Responses: "


        //add the data and options to the chart, add which canvus to the paint to. 
        var barChart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: false,
                animation: false,
                scales: {
                    //set that on the y axes there is a min of 0% max of 100% there is index at
                    //ever 25% (0,25,50,75,100), and there is a max of 4 ticks for 0% to 100%
                    yAxes:[{
                        ticks: {
                            min : 0,
                            max : 100,
                            maxTicksLimit: 4,
                            stepSize: 25
                        }
                    }]
                },

                //set the title of the chart
                title: {
                    display: true,
                    text: "# of Responses Vs. # Active Users : " + activeUsers + ' vs. '+ chart_data.length
                }
            }
        });
    }

  
});
