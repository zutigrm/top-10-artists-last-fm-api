import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; 
import { Http, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-artist',
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.scss']
})

@Injectable()

export class ArtistComponent implements OnInit {
 
  api_key: string = 'a260a6a388cb750a09bf1c5cfe195629';
  limit: string = "10";
  baseUrl = 'https://ws.audioscrobbler.com/2.0/';
  method: string = '?method=artist.getTopAlbums';
  currentArtist: string;
  page: number = 1;
  canLoad: boolean = true;
  firstAlbum: string;

  // main data and artists names fro later usage
  responseJson: any = {};

  constructor(private http: Http, private route: ActivatedRoute) { 
    this.route.params.subscribe( res => this.fetchData(res.artist) );
    var self = this;

    window.addEventListener("wheel", function(){
      if ( self.canLoad === true && document.querySelector('#load-more') ) {
          self.loadData(self);

          if ( document.querySelector('#home') ) {
            var btn = document.getElementById('home');
            var h = document.getElementById('h1');

            // add sticky class to home button
            if ( self.isElementReached(h) + window.innerHeight + h.clientHeight < h.clientHeight  ) { 
                btn.classList.add('sticky');
            } else {
                btn.classList.remove('sticky');
            }
          }
      }
    });
  }

  ngOnInit() {}

  albumSearch(term: string) {
    var results = document.getElementsByClassName('card-title'),
        searchTerm = term,
        container = document.getElementById('albums-list');

      // add class to hodler so we can know search is active
      if ( searchTerm != '' ) {
        container.classList.add('searching');
      } else {
        container.classList.remove('searching');
      }

     // reset the search by removing hidden items first
     this.clearSearch();

     for ( var i = 0; i < results.length; i++ ) {
          var card = results[i].closest('.card-wrapper');

         // if album is not a match, hide it
         if ( results[i].textContent.toLowerCase().search(searchTerm) != -1 ) {
            card.classList.add('active');
         } else {
           card.classList.remove('active');
         }
     }
  }

  // Main loader method
  loadData(main) {
    var load = document.getElementById('load-more');
    var reached = load.offsetTop;
    var $this;

     if ( typeof main != 'undefined' ) {
       $this = main;
     } else {
       $this = this;
     }

    if ( $this.isElementReached(load) <= (load.clientHeight + 180 ) ) {
       $this.canLoad = false;
       $this.page++;

       $this.fetchData($this.currentArtist, main);
    }
  }

  isElementReached (el) {
    var rect = el.getBoundingClientRect();

    return rect.top - window.innerHeight;
}

  fetchData(artist, main = null) {
    this.getAlbums(artist, main);
    this.currentArtist = artist;
  }

// get response from url
  getData(url) {
    return this.http.get(url)
      .map((res: Response) => res.json());
  }

  // function which gets the main data for top albums
  // and puts it in responseJson object
  getAlbums(artist, main) {
    var $this,
        trackGet = false;

    if ( main != null && typeof main == 'object' ) {
      $this = main;

    } else {
      $this = this;
    }
          
    // build url
    var url: string = $this.baseUrl + $this.method + '&artist=' + artist + '&limit=' + $this.limit + '&api_key=' + $this.api_key + '&format=json' + '&page=' + $this.page;
    
    this.getData(url).subscribe(
       data => { 
          

          if ( typeof $this.responseJson.album != 'undefined' && typeof $this.responseJson.album == 'object' ) {

            /*
            * check if there is first album present, if it is not
            * then push it to the existing array to avoid
            * overriding of existing data because api has strange
            * way of returning pages.
            */
            if ( data.topalbums.album.length > $this.limit && $this.getIndexIfObjWithOwnAttr(data.topalbums.album, 'name', $this.firstAlbum) != -1 ) {
              $this.responseJson.album = data.topalbums.album;
              trackGet = true;

            } else { 

              // avoid including duplicate albums
              if ( $this.getIndexIfObjWithOwnAttr($this.responseJson.album, 'name', data.topalbums.album[0].name) == -1 ) {
                
                for ( var i = 0; i < data.topalbums.album.length; i++ ) {

                  if ( $this.getIndexIfObjWithOwnAttr($this.responseJson.album, 'name', data.topalbums.album[i].name) > -1 ) {
                    data.topalbums.album.splice(i, 1);
                  }
                }

                $this.responseJson.album.push.apply($this.responseJson.album, data.topalbums.album);
                trackGet = true;
              } 
            }

          } else {  
              $this.responseJson = data.topalbums;
              $this.firstAlbum = data.topalbums.album[0].name;
              trackGet = true;
          }
          
          if ( trackGet ) {
            $this.getTracks(artist, data.topalbums);
          } else {
            $this.canLoad = true;
          }
       }
    );
  }


  // get response from url
  getAlbumData(url) {
    return this.http.get(url)
      .map((res: Response) => res.json());
  }

  // function which gets the authors info
  getInfo(url) {
    this.getAlbumData(url).subscribe(
     data => {  
         //this.responseJson = data;
        if ( typeof data.error == 'undefined' ) {
            this.mergeAlbumInfo(this.responseJson, data);
        }   

        this.canLoad = true;
     }
    );
  }

  // Function that fetches names of top artists
  getTracks(artist, albums) {
     for (let album of albums.album) {
      var url  = this.getInfoUrl(artist, album.name); 

      this.getInfo(url);
     }
  }

  // get info of each artist and store it 
  //into artistsData object
  getInfoUrl(artist, album) {
    var url = this.baseUrl + '?method=album.getinfo&artist=' + artist + '&album=' + album + '&api_key=' + this.api_key + '&format=json';

    return url;

  }

   mergeAlbumInfo(albums, data) {
    var k = 0;

    for ( let albumInfo of albums.album ) {  

      if ( data.album.name == albumInfo.name && typeof data.album.tracks != 'undefined' && data.album.tracks.track.length > 0 ) {
         this.responseJson.album[k].tracks = data.album.tracks.track;
      } 

       k++;
    }
  }

  // Reset the search by removing hidden class from all elements
  clearSearch() {

    if ( document.getElementsByClassName('active').length ) {
      var active = document.getElementsByClassName('active');

      for ( var i in active ) { 

        if ( typeof active[i] === 'object' ) {
          active[i].classList.remove('active');
        }
      }
    }
  }

  // Check if key exists in array
  // @credits - https://stackoverflow.com/questions/11258077/how-to-find-index-of-an-object-by-key-and-value-in-an-javascript-array/39810268
  getIndexIfObjWithOwnAttr(array, attr, value) {
    for(var i = 0; i < array.length; i++) {
        if(array[i].hasOwnProperty(attr) && array[i][attr] === value) {
            return i;
        }
    }
    return -1;
  }

}
