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

  constructor(private messageService: SimuladorService) {
    let _this = this;
    messageService.msg.subscribe(data => {
      // _this.limpiarGrafo();
      let ksp;
      let demand;
      if(_this.ksp.length > 0)
        _this.limpiarGrafo()
      if(data != undefined){
        _this.demand = {"from" : data.from, "to" : data.to}
        _this.ejecutarDemandaAsync(data)
      }
    });
  }

  iniciarSimulacion () {
    let spectrum;
    this.links.forEach(link => {
      spectrum = new Array(this.options.capacity);
      spectrum.fill(false);//libre
      link.spectrum = spectrum;
    });
    this.messageService.sendMessage(this.options);
  }

  ngOnInit() {
    let lid = 0;
    net.network.forEach((node, id) => {
      this.nodes.push({'id' : id.toString(), 'label' : id, 'color' : '#c4bcb1'})
      node.connections.forEach((c, index)=> {
        this.links.push({'id' : "l"+id+c, 'source' : id.toString(), 'target' : c.toString(), 'label' : node.distance[index], 'color' : '#524b4b'})
        lid++;
      });
    });
    let demandas = [];

    this.initOptions();
  }

  initOptions(){
    this.options = new Options();
    this.options.time = 10;
    this.options.topology = "NSFNet";
    this.options.fsWidth = 12.5;
    this.options.capacity = 16;
    this.options.erlang = 100;
    this.options.lambda = 5;
    this.options.fsRangeMin = 2;
    this.options.fsRangeMax = 6;
    this.options.routingAlg = "fa";
    this.options.cores = 1;
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
    this.nodes[data.from].color = "#f7a1a1";
    this.nodes[data.to].color = "#f7a1a1";
    let linkId;
    let link;
    data.path.forEach((l, i) => {
      linkId = l.from < l.to ? "l"+l.from+l.to : "l"+l.to+l.from
      link = this.links.find(i => i.id == linkId)
      link.color="#f7a1a1";

      for (let i = data.fsIndexBegin; i < data.fs; i++) {
        link.spectrum[i] = true;
      }
      this.update$.next(true);
    })
  }

  ejecutarDemanda(demandas){
    let linkId;
    let demanda;
    let ksp;
    var acu = 0;
    let acuL = 0;
    let x = 0;

    demandas.forEach(async (demanda, index) => {
      ksp = this.ksp[index];
      this.nodes[demanda.from].color = "#f7a1a1";
      this.nodes[demanda.to].color = "#f7a1a1";
      if(index == 0)
        acu = 0;
      else
        acu = 1000 * (this.ksp[index-1].length + 1)

      ksp.forEach(async (k, i) => {
          await this.wait((i)*1000);
          linkId = "l"+k.from+k.to;
          this.links.find(i => i.id == linkId).color="#f7a1a1";
          this.update$.next(true);
          // await(1000)
      });
      acuL = (ksp.length + 2) * 1000;
      await this.wait(4000)
    });

  }

  limpiarGrafo(){
    let linkId;
    this.nodes[this.demand.from].color = "#c4bcb1";
    this.nodes[this.demand.to].color = "#c4bcb1";
    this.ksp.forEach((k, i) => {
        linkId = k.from < k.to ? "l"+k.from+k.to : "l"+k.to+k.from
        linkId = "l"+k.from+k.to;
        this.links.find(i => i.id == linkId).color="#524b4b";
        this.update$.next(true);
    });
  }
}
