import {
  Component,
  OnInit,
  ElementRef, 
  ViewChild
} from '@angular/core';

import { AbstractObserver } from '../shared/abstract/observer.abstract';

import { Song } from '../shared/models/song.model';
import { Chord } from '../shared/models/chord.model';

import { SongService } from '../services/song.service';
import { ChordService } from '../services/chord.service';
import { AppState } from '../app.state';

@Component({
  selector: 'app-song',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.scss'],
  providers: [SongService, ChordService]
})
export class SongComponent 
extends AbstractObserver 
implements OnInit {

  // Access video DOM
  @ViewChild('video') video: ElementRef;
  @ViewChild('chordSlider') chordSlider: ElementRef;

  songModels: Song[];
  chordModels: Chord[];
  activeSong: Song;

  toggleAddSongForm: boolean;
  toggleEditSongForm: boolean;
  toggleAddChordForm: boolean;
  toggleEditChordForm: boolean;
  
  videoTime: number;
  // Toggle for editing chord data
  toggleEditMode: boolean;

  public constructor(
    protected _songService: SongService,
    protected _chordService: ChordService,
    public appState: AppState
  ) {
    // Invoke parent class constructor
    super();

    this.toggleEditMode = false;
    this.toggleEditSongForm = false;
    this.toggleEditChordForm = false;
    this.toggleAddSongForm = false;
    // Initialize to true so at least one form is shown by default
    this.toggleAddChordForm = true;
    
    this.songModels = Array();
    this.chordModels = Array();
    this.activeSong = Object();
  }

  ngOnInit(): void {
    if (this.songModels.length === 0) {
      // Invoke retrieval, transform, and setter of all songs stream
      this._songService.getAllSongs().subscribe(
        super.observable(
          this.setSongModels,
          this.setActiveSongModel,
          this.getChordsBySongId
        )
      );
    }
  }

  public onChangeSong(event: any) {
    // event.target.value is the song id
    this.appState.activeSong = this.activeSong =
      this.findSongById(this.songModels, event.target.value);
    // Invoke function for getting chords for selected song
    this.getChordsBySongId();
    // Stop event from bubbling
    event.stopPropagation();
  }

  public getChordsBySongId() {
    this._chordService.getChordsBySongId(this.activeSong._id).subscribe(
      super.observable(this.setChordModels)
    );
  }

  public setChordModels(httpData: Array<Object>) {
    this.appState.chordModels = this.chordModels = this.assignChordModels(httpData);
  }

  public assignChordModels(httpData: Array<Object>) {
    return httpData.map((element: Object) => {
      return Object.assign(new Chord("", "", 0, "", ""), element);
    });
  }

  public setSongModels(httpData: Array<Object>) {
    this.appState.songModels = this.songModels = this.assignSongModels(httpData);
  }

  public assignSongModels(httpData: Array<Object>) {
    return httpData.map((element: Object) => {
      return Object.assign(new Song("", "", "", ""), element);
    });
  }

  public findSongById(songs: Song[], songID: string): Song {
    return songs.find(element => element._id === songID);
  }

  public setActiveSongModel() {
    this.appState.activeSong = this.activeSong = this.findSongById(
      this.songModels,
      this.songModels[0]._id
    );
  }

  public toggleVisible(event: any): void {
    const self = this;
    const source = event.target;
    const siblings = document.querySelectorAll(
      `[name='${event.target.name}']`
    );
    siblings.forEach(ele => {
      if (ele.id == source.id) 
        self[source.id] = true;
      else 
        self[ele.id] = false;
    });
  }

  public onChangePlayback(event: any): void {
    this.video.nativeElement.playbackRate = event.target.value;
    // Stop event from bubbling
    event.stopPropagation();
  }

  public onChangeVideoTime(event: any): void {
    // Stop event from bubbling
    event.stopPropagation();
    
    const videoTime = this.videoTime = event.srcElement.currentTime;

    const domElements: any = Array.from(this.chordSlider.nativeElement.children);
    domElements.sort((a: any, b: any) => {
      const prev = a.firstChild.getAttribute('data-timestamp');
      const current = b.firstChild.getAttribute('data-timestamp');
      return Math.abs(videoTime - prev) - Math.abs(videoTime - current)
    });

    domElements.forEach((ele, index) => {
      if (index === 0) {
        // Scroll to current chord and center horizontally
        ele.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'center'
        });
        // Highlight chord that matches video time
        ele.style.backgroundColor = 'var(--dark-purple)';
      }
      else {
        // Change color back to default
        ele.style.backgroundColor = 'var(--medium-purple)';
      }
    });
  }
}
