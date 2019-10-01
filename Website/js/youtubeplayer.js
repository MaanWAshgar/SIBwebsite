/*jshint esversion: 6 */
/*
Javascript file for youtube video playing in the articles.
Author: Maan Ashgar
Last updated: 17/02/2019
*/

/* The following code for including a video in a page was
acquired from
https://developers.google.com/youtube/iframe_api_reference
*/
let videoid = '';
// to make sure the page finish loading, window.onload is used
window.onload = function() {
  // instead of having a js file for every video, just fetch the id from the tag
  videid =   document.getElementById('youtubeplayer').innerText;

  let tag = document.createElement('script');

  tag.src = 'https://www.youtube.com/iframe_api';
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

function onYouTubeIframeAPIReady() {
  let player = new YT.Player('youtubeplayer', {
    videoId: videid
  });
}
