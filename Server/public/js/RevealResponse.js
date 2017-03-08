//socket stuff
var socket = io();

//store the yn question date and the mc data
var YNRQuestion_section_default = {};
var MCRQ_correct_answer = {};
var MCRQ_title = {};

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
    'like': {title:'Like', src:'images/like.png', tip:'I find this content interesting'},
    'difficult': {title:'Difficult', src:'images/hard.png', tip:'I find this content difficult'},
    'study': {title:'Study', src:'images/study.png', tip:'I think I should study this for the test'}
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
    MCRQ_title[title] = $(multiQuestion).attr('ca');

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



//send the user the lecture id
if(LectureID)
    socket.emit('lecture_server_setup', {title: $('title').text(), lectureID: LectureID});

socket.on('lecture_client_setup', function(isInstuctor){
    if(isInstuctor){
        setUpInstructor();
    }
    else{
        setUpStudent();
    }

    /*
    *Send answer to server, and check if any answers are closed
    */
    Object.keys(MCRQ_title).forEach(function(item){
        socket.emit('check_multiple_choice_question', {title:item, answer: MCRQ_title[item]});
        MCRQ_title[item] = 0;
    });

    socket.on('close_multiple_choice_question', function(chart_data){
        
        if(MCRQ_title[chart_data.title] === 0){
            MCRQ_title[chart_data.title] = 1;

            var title = chart_data.title.replace(/ /g, '_');

            var len = $('#'+title).next().children().length;

            $('#'+title).next().css('display', 'none');

            $('#'+title).after('<canvas id="'+title+'_chart" height="300" width="300" style="padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;"></canvas>');

            createChart(chart_data, $('#'+title+'_chart'), len);

        }
    });



    function createChart(chart_data, canvas, length)
    {
        var title = chart_data.title.replace(/ /g, '_');
        var data = {};
        data.labels = [];
        data.datasets = [];

        data.datasets.push({
            
            borderWidth : 1,
            borderColor : [],
            backgroundColor : [],
            data : []
        });

        for(var cnt = 0; cnt < length; cnt++){
            data.labels.push('Answer '+ (cnt + 1));
            data.datasets[0].data.push(0);
            
            if(MCRQ_correct_answer[title] === ""+(cnt+1))
            {
                var color = {r:0,g:255,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
            else{
                var color = {r:0,g:0,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
        }

        data.datasets[0].data = []
        for(var cnt = 0; cnt < length; cnt++)
            data.datasets[0].data.push(0);
        //get active users
        var activeUsers = chart_data.length - chart_data.inactive;

        //update chart with data for server
        Object.keys(chart_data.answers).forEach(function(item){
            var index = parseInt(item.replace('a_', ''));
            data.datasets[0].data[index] = chartFormat(chart_data.answers[item], activeUsers);
        });

        data.datasets[0].label = "% of Responses: "



        var barChart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: false,
                animation: false,
                scales: {
                    yAxes:[{
                        ticks: {
                            min : 0,
                            max : 100,
                            maxTicksLimit: 4,
                            stepSize: 25
                        }
                    }]
                },
                title: {
                    display: true,
                    text: "# of Responses Vs. # Active Users : " + activeUsers + ' vs. '+ chart_data.length
                }
            }
        });
    }

    function chartFormat(score, length)
    {
        return ((length === 0) ? 0 :(score/length) * 100);
    }

    //return the format of chart.js rgba color
    function RGBA(rgb, a)
    {
        return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
    }

    //randomaly generate a color
    function randRGB()
    {
        return {r:rand(255), g:rand(255), b:rand(255)};
    }

    //random function that get the color from 0 to the max
    function rand(max)
    {
        return Math.floor(Math.random() * max);
    }
});
