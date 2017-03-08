var socket = io();
var YNRQuestion_section_default = {};
var MCRQ_correct_answer = {};
// var MCRQ_title = [];
var MCRQ_title = {};
var ActionFunc = null;
var isMobile = false;
var mobileSize = 110;
var mobilePos = "110%"
// var cnt = 0;

//YNRQuestion/YNRQ - Yes No Response Question

var standardYNRQuestions = {
    'like': {title:'Like', src:'images/like.png', tip:'I find this content interesting'},
    'difficult': {title:'Difficult', src:'images/hard.png', tip:'I find this content difficult'},
    'study': {title:'Study', src:'images/study.png', tip:'I think I should study this for the test'}
};

//hide the multiplechoice html
$('multiplechoice').css('display','none');

//for each multiple choice html, convert it to current html
$('multiplechoice').each(function(index){
    //the current multiple choice object
    var multi = this;
    var title = $(multi).attr('title');

    var id = title.replace(/ /g, '_');
    // MCRQ_title.push(title);
    MCRQ_title[title] = $(multi).attr('ca');

    //Get the correct answer
    MCRQ_correct_answer[id] = $(multi).attr('ca');
    $(multi).attr('ca', '-1');
    
    //add a spot for the question, and get the question text
    $(multi).after('<div id="question_'+id+'"></div>');
    var question = $(multi).find('question').html();
    
    //add the question text and an ordered list
    $('#question_'+id).append('<h2 id="'+id+'">'+question+'</h2>');
    $('#question_'+id).append('<ol id="answers_'+id+'" title="'+title+'"></ol>');

    //for each answer in the question add it to the question div, add 2 classes, answer for adding
    //click functionality and answer_'index' to be able to refrenece all answers in one question
    $(multi).find('answer').each(function(a_index){
        $('#answers_'+id).append('<li id="a_'+a_index+'" class="answer answers_'+index+'">'+$(this).text()+'</li>');
    });
});

function setYNRQ_section_default(index, text, section, tip)
{
    YNRQuestion_section_default['h_' + index] = {xml: text, section:section};
}

$('.slides').children().each(function(index){
    //check for the instances of YNRQs
    var found = $(this).find('.YNRQuestion-default');
    //if an item is found
    if(found[0])
    {
        setYNRQ_section_default(index, $(found[0]).text(), $(found).attr('YNRQuestion-section'));// add the first YNRQuestion_section_default to the default map
    }
});

function getXMLData(item)
{
    var standard = standardYNRQuestions[$(item)[0].tagName.toLowerCase()];

    if(!standard)
    {
        var title = $(item).attr('title');
        var src = $(item).attr('src');
        var tip = $(item).attr('tip');
        return {title: title, src:src, tip: tip};
    }
    else
        return standard;
}

function tagAction()
{
    if(ActionFunc !== null)
        ActionFunc();
}

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;   
}

//send the user the lecture id
if(LectureID)
    socket.emit('lecture_server_setup', {title: $('title').text(), lectureID: LectureID});

socket.on('lecture_client_setup', function(isInstuctor){
    if(isInstuctor)
        Instructor();
    else
        Student();

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


    function Chart(chart_data, canvas, length){

        this.create = function(chart_data, canvas, length)
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

        this.chartFormat = function(score, length)
        {
            return ((length === 0) ? 0 :(score/length) * 100);
        }

        //return the format of chart.js rgba color
        this.RGBA = function(rgb, a)
        {
            return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
        }

        //randomaly generate a color
        this.randRGB = function()
        {
            return {r:rand(255), g:rand(255), b:rand(255)};
        }

        //random function that get the color from 0 to the max
        this.rand = function(max)
        {
            return Math.floor(Math.random() * max);
        }

        this.create(chart_data, canvas, length);
    }
});
