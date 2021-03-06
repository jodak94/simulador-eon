import { Component } from '@angular/core';
import net from './topologies/nsfnet.json';
import * as shape from 'd3-shape';
import { Subject } from 'rxjs';
import { SimuladorService } from './services/simulador.service';
import { Options } from './models/options';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'simulador-eon';
  links = [];
  nodes = [];
  curve = shape.curveLinear;
  demand = null;
  options = null;
  ksp = [];
  update$: Subject<any> = new Subject();
  acu;
  useColor = '#4e90e6';
  cNodeColor = '#c4bcb1'
  cLinkColor = '#524b4b';
  simulanding = false;
  blocked = true;
  time = 0;
  constructor(private messageService: SimuladorService) {
    let _this = this;
    messageService.msg.subscribe(data => {
      let ksp;
      let demand;
      console.log(data)
      if(data.released != undefined && data.released){
        _this.time = data.time;
        data.releasedSlots.forEach(releaseSlot => {
          _this.links.find(i => i.id == releaseSlot.link).cores[releaseSlot.core][releaseSlot.slot] = false;
        });
        // _this.links.find(i => i.id == data.link).cores[data.core][data.slot] = false;
        return;
      }
      if(data.end != undefined && data.end == true){
        _this.limpiarGrafo()
        // _this.cleanLinks();
        _this.time = 0;
        _this.demand = null;
        _this.simulanding = false;
        return;
      }
      if(data.blocked){
          _this.blocked = true;
          if(_this.ksp.length > 0)
            _this.limpiarGrafo()
          return;
      }

      if(_this.ksp.length > 0)
        _this.limpiarGrafo()

      _this.blocked = false;
      if(data != undefined && data.end == undefined){
        _this.demand = {"from" : data.from, "to" : data.to, "fs" : data.fs, "tl" : data.timeLife}
        _this.ejecutarDemandaAsync(data)
      }
    });
  }

  iniciarSimulacion () {
    this.simulanding = true;
    this.cleanLinks()
    this.ksp = [];
    this.time = 0;
    this.messageService.sendMessage(this.options);
  }

  cleanLinks () {
    let spectrum;
    let cores;
    this.links.forEach(link => {
      cores = new Array(this.options.cores);
      for (let core = 0; core < cores.length; core++) {
        spectrum = new Array(this.options.capacity);
        spectrum.fill(false);//libre
        cores[core] = spectrum
      }
      link.cores = cores;
    });
  }

  ngOnInit() {
    let lid = 0;
    net.network.forEach((node, id) => {
      this.nodes.push({'id' : id.toString(), 'label' : id, 'color' : this.cNodeColor})
      node.connections.forEach((c, index)=> {
        this.links.push({'id' : "l"+id+c, 'source' : id.toString(), 'target' : c.toString(), 'label' : node.distance[index], 'color' : this.cLinkColor, 'class' : 'line'})
        lid++;
      });
    });
    let demandas = [];

    this.initOptions();
  }

  initOptions(){
    this.options = new Options();
    this.options.time = 20;
    this.options.topology = "NSFNet";
    this.options.fsWidth = 12.5;
    this.options.capacity = 48;
    this.options.erlang = 100;
    this.options.lambda = 3;
    this.options.fsRangeMin = 2;
    this.options.fsRangeMax = 6;
    this.options.routingAlg = "fa";
    this.options.cores = 2;
    this.options.k = 5;
  }

  wait(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(ms)
      }, ms )
    })
  }

  ejecutarDemandaAsync(data){
    this.ksp = data.path;
    this.nodes[data.from].color = this.useColor;
    this.nodes[data.to].color = this.useColor;
    let linkId;
    let link;
    data.path.forEach((l, i) => {
      linkId = l.from < l.to ? "l"+l.from+l.to : "l"+l.to+l.from
      link = this.links.find(i => i.id == linkId)
      link.color=this.useColor;
      link.class = "line pen"
      for (let i = data.fsIndexBegin; i <  data.fsIndexBegin + data.fs; i++) {
        link.cores[data.core][i] = true;
      }
      this.update$.next(true);
    })
  }

  limpiarGrafo(){
    let linkId;
    this.nodes[this.demand.from].color = this.cNodeColor;
    this.nodes[this.demand.to].color = this.cNodeColor;
    this.ksp.forEach((k, i) => {
        linkId = k.from < k.to ? "l"+k.from+k.to : "l"+k.to+k.from
        linkId = "l"+k.from+k.to;
        this.links.find(i => i.id == linkId).color=this.cLinkColor;
        this.links.find(i => i.id == linkId).class="line";
        this.update$.next(true);
    });
  }
}
