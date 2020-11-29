var xhr = new XMLHttpRequest();
var uploadInProgress = false;

$('.upload-button').on('click', function () {

  $('.progress').addClass('hidden');
  $('.key-label').addClass('hidden');

  if (!uploadInProgress) {
    $('#upload-input').click();
  }
  else {
    xhr.abort();
    uploadInProgress = false;
    $('.upload-button').html('Upload File');
  }

});


$('#upload-input').on('change', function () {

  $('.progress__text').text('0%');
  $('.progress__bar').width('0%');
  $('.key-label').addClass('hidden');


  var files = $(this).get(0).files;

  if (files.length > 0) {
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        console.log('upload successful!\n' + data);
        $('.key-label').html('link: ' + window.location.href + data);

        if ($('.key-label').hasClass('hidden')) {
          $('.key-label').removeClass('hidden');
        }
      },
      xhr: function () {


        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function (evt) {

          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            $('.progress__text').text(percentComplete + '%');
            $('.progress__bar').width(percentComplete + '%');

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
              $('.progress__text').html('Done');
              uploadInProgress = false;
              $('.upload-button').html('Upload File');
            }

          }

        }, false);


        if ($('.progress').hasClass('hidden')) {
          $('.progress').removeClass('hidden');
        }

        $('.upload-button').html('Cancel');
        uploadInProgress = true;

        return xhr;
      }
    });

  }
});
