import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

@Injectable()

export class HomeComponent implements OnInit {

  // define our api params
  api_key: string = 'a260a6a388cb750a09bf1c5cfe195629';
  limit: string = "10";
  baseUrl = 'https://ws.audioscrobbler.com/2.0/';
  method: string = '?method=tag.gettopartists';
  tag: string = 'tag=rock';

  // build url
  url: string = this.baseUrl + this.method + '&' + this.tag + '&limit=' + this.limit + '&api_key=' + this.api_key + '&format=json';


  // main data and artists names fro later usage
  responseJson: any = {};

  constructor(private http: Http) { 
    this.getArtists();  
  }

  ngOnInit() {}

  // get response from url
  getData() {
    return this.http.get(this.url)
      .map((res: Response) => res.json());
  }

  // function which gets the main data for top artists
  // and puts it in responseJson object
  getArtists() {
	  this.getData().subscribe(
       data => {
           this.responseJson = data.topartists;

           this.getNames(data.topartists);
       }
    );
  }

  // get response from url
  getAuthorData(url) {
    return this.http.get(url)
      .map((res: Response) => res.json());
  }

  // function which gets the authors info
  getInfo(url) {
    this.getAuthorData(url).subscribe(
     data => {  
         //this.responseJson = data;

         this.mergeAuthorInfo(this.responseJson, data);
         
     }
    );
  }

  // Function that fetches names of top artists
  getNames(artists) {
     for (let artist of artists.artist) {
      var url  = this.getArtistUrl(artist.name); 

      this.getInfo(url);
     }
  }

  // get info of each artist and store it 
  //into artistsData object
  getArtistUrl(artist) {
    var url = this.baseUrl + '?method=artist.getInfo&artist=' + artist + '&api_key=' + this.api_key + '&format=json';

    return url;

  }

  mergeAuthorInfo(artists, data) { 
    var k = 0;

    for ( let artistInfo of artists.artist ) {  

      if ( data.artist.name == artistInfo.name ) {
         var limit = 300;
         this.responseJson.artist[k].author_info = data.artist.bio.content.substr(0, limit);
      } 

       k++;
    }
    
  }
}
