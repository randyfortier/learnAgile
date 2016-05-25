// enable cross-origin resource sharing
$.support.cors = true;

$(document).ready(function() {
	// handler for searching by keyword
	$('#searchByKeywordButton').click(function() {
		var max_videos = 5;
		var keyword = $('#keyword').val();
	
    var searchURL = 'https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&q=' + escape(keyword) + '&key=AIzaSyBKl-NXWdXHsj6dCYrNRqgU5k5h_bH6Ua8';
	
		// clear any previous search results
		$('#output ol').html('');
		$('#videos').html('');
	
		// Get the data from the web service and process
        $.getJSON(searchURL, function(data) {
            $.each(data.items, function(i,item) {
                $('#output ol').append(renderSearchResultItem(item));
                $('#videos').append(renderVideoPlayback(item.id));
            });
        });
    });
});

function renderSearchResultItem(item) {
    if (item.id.kind == 'youtube#video') {
       return '<li><a href="http://www.youtube.com/v/' + item.videoId + 
              '">' + item.snippet.title + '</a></li>';
    } else {
        return '';
    }
}

function renderVideoPlayback(id) {
    if (id.kind == 'youtube#video') {
       var text = '<div>' +
                  '    <embed width="420" height="345" ' +
                  '       src="http://www.youtube.com/v/' + id.videoId + '"' +
                  '       type="application/x-shockwave-flash">' +
                  '    </embed>' +
                  '</div>'
        return text;
    } else {
        return '';
    }
}
