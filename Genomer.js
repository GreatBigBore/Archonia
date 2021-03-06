/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Proxy */

"use strict";

var Archonia = Archonia || { Axioms: {}, Cosmos: {}, Engine: {}, Essence: {}, Form: {} };
var tinycolor = tinycolor || {};

if(typeof window === "undefined") {
  tinycolor = require('./widgets/tinycolor.js');
  Archonia.Axioms = require('./Axioms.js');
  Archonia.Essence = require('./Essence.js');
  tinycolor = require('./TinyColor/tinycolor.js');
}

(function(Archonia) {
  
Archonia.Form.Gene = function() {
  // Archonia always begins with a 10% chance of a +/- 10% change
  this.changeProbability = 10;
  this.changeRange = 10;
};

Archonia.Form.Gene.prototype = {
  inherit: function() { Archonia.Axioms.hurl(new Error("Gene base class doesn't inherit")); },
  
  mutateMutatability: function(parentGene) {
    // Have to assign these first, before the mutation, because the
    // mutation function needs them in place before it can
    // operate properly.
    this.changeProbability = parentGene.changeProbability;
    this.changeRange = parentGene.changeRange;

    var newChangeProbability = this.mutateScalar(parentGene.changeProbability);
    var newChangeRange = this.mutateScalar(parentGene.changeRange);
    
    this.changeProbability = newChangeProbability;
    this.changeRange = newChangeRange;
  },
  
  mutateScalar: function(value, sizeOfDomain) {
    var probability = this.changeProbability;
    var range = this.changeRange;
  
    // Hopefull make creation a bit more interesting
    if(Archonia.Cosmos.momentOfCreation) { probability *= 10; range *= 10; }

    // Just to make it interesting, every once in a while, a big change
    var i = null;
    for(i = 0; i < 3; i++) {
      if(this.mutateYN(probability)) {
        range += 10;
        probability += 10;
      } else {
        break;
      }
    }
    
    if(i === 0) {
      return value; // No mutation on this gene for this baby
    } else {
      if(sizeOfDomain === undefined) {
        return Archonia.Axioms.realInRange(
          value * (1 - range / 100), value * (1 + range / 100)
        );
      } else {
        var r = sizeOfDomain * (1 + range / 100);
      
        return Archonia.Axioms.realInRange(value - r, value + r);
      }
    }
  },
  
  mutateYN: function() { return Archonia.Axioms.integerInRange(1, 100) < this.changeProbability; }
};

Archonia.Form.ScalarGene = function(geneScalarValue) { this.value = geneScalarValue; Archonia.Form.Gene.call(this); };

Archonia.Form.ScalarGene.prototype = Object.create(Archonia.Form.Gene.prototype);
Archonia.Form.ScalarGene.prototype.constructor = Archonia.Form.ScalarGene;
Archonia.Form.ScalarGene.prototype.newGene = function() { return new Archonia.Form.ScalarGene(); };

Archonia.Form.ScalarGene.prototype.inherit = function(parentGene) {
  this.mutateMutatability(parentGene);
  this.value = this.mutateScalar(parentGene.value);
  
  if(this.value < 0) { Archonia.Axioms.hurl(new Archonia.Essence.BirthDefect("Scalar gene value < 0")); }
};

Archonia.Form.ColorGene = function(gene) { this.color = tinycolor(gene); Archonia.Form.Gene.call(this); };

Archonia.Form.ColorGene.prototype = Object.create(Archonia.Form.Gene.prototype);
Archonia.Form.ColorGene.prototype.constructor = Archonia.Form.ColorGene;
Archonia.Form.ColorGene.prototype.newGene = function() { return new Archonia.Form.ColorGene(); };

Archonia.Form.ColorGene.prototype.inherit = function(parentGene) {
  this.mutateMutatability(parentGene);
  
  var color = tinycolor(parentGene.color);
  var hsl = color.toHsl();
  
  // Because tinycolor stores them 0 - 1 but hsl string wants 0 - 100%
  hsl.s *= 100; hsl.l *= 100;
  
  var h = this.mutateScalar(hsl.h, 90); // Make the domain sizes artificially small to
  var s = this.mutateScalar(hsl.s, 25); // limit the amount of color change between
  var L = this.mutateScalar(hsl.l, 25); // generations. I like to see some signs of inheritance
  
  // In case tinycolor doesn't like long strings of decimals
  h = h.toFixed(); s = s.toFixed(); L = L.toFixed();
  
  hsl = 'hsl(' + h + ', ' + s + '%, ' + L + '%)';
  this.color = tinycolor(hsl);

  var r = this.getTempRange();
  if(r < 0 || r > Archonia.Axioms.temperatureHi || s < 0 || s > 100 || L < 0 || L > 100) {
    Archonia.Axioms.hurl(new Archonia.Essence.BirthDefect("Bad color gene: " + hsl));
  }
};

Archonia.Form.ColorGene.prototype.getColorAsDecimal = function() { return parseInt(this.color.toHex(), 16); };
Archonia.Form.ColorGene.prototype.getTempRadius = function() { return this.getTempRange() / 2; };
Archonia.Form.ColorGene.prototype.getOptimalTempHi = function() { return this.getOptimalTemp() + this.getTempRange() / 2; };
Archonia.Form.ColorGene.prototype.getOptimalTempLo = function() { return this.getOptimalTemp() - this.getTempRange() / 2; };

Archonia.Form.ColorGene.prototype.getOptimalTemp = function() {
  var L = this.color.toHsl().l;
  var t = Archonia.Essence.worldTemperatureRange.convertPoint(L, Archonia.Essence.oneToZeroRange);
  return t;
};

Archonia.Form.ColorGene.prototype.getTempRange = function() {
  var h = this.color.toHsl().h;
  var r = Archonia.Essence.archonTolerableTempRange.convertPoint(h, Archonia.Essence.hueRange);
  return r;
};

Archonia.Form.GenomeProxy = {
  get: function(target, name) {
    switch(name) {
      case "color":         return target.core.color.getColorAsDecimal();
      case "optimalTempHi": return target.core.color.getOptimalTempHi();
      case "optimalTempLo": return target.core.color.getOptimalTempLo();
      case "optimalTemp":   return target.core.color.getOptimalTemp();
      case "tempRange":     return target.core.color.getTempRange();
      case "tempRadius":    return target.core.color.getTempRadius();
      
      case "core": return target.core;
      
    default:
      // The only names in the genome itself are the core and
      // the genome functions
      if(name in target) { return target[name]; }
      else if(name in target.core) { return target.core[name].value; }
      else { Archonia.Axioms.hurl(new Error("No such property '" + name + "' in genome")); }
      break;
    }
  }
};

Archonia.Form.Genome = function(archon, parentGenome) {
  this.archon = archon;
  this.core = [];
  
  for(var i in parentGenome.core) {
    if(parentGenome.core[i] instanceof Archonia.Form.Gene) {
      if(parentGenome.core[i] === null) { this.core[i] = null; }
      else { this.core[i] = parentGenome.core[i].newGene(); }
    }
  }
};

Archonia.Form.Genome.prototype = {
  inherit: function(parentGenome) {
    for(var i in parentGenome.core) { 
      if(parentGenome.core[i] === null) { this.core[i] = null; }
      else {
        try {
          this.core[i].inherit(parentGenome.core[i]);
        } catch(e) {
          if(e.message === "Scalar gene value < 0") {
            Archonia.Axioms.hurl(new Archonia.Essence.BirthDefect(
              "Scalar gene '" + i + "' value = " + this.core[i].value.toFixed(4)
            ));
          } else {
            throw Archonia.Axioms.hurl(e);
          }
        }
      }
    }
  }
};

var primordialGenome = { core: {
  color:                     new Archonia.Form.ColorGene(tinycolor('hsl(180, 100%, 50%)')),

  maxMAcceleration:          new Archonia.Form.ScalarGene(15),
  maxMVelocity:              new Archonia.Form.ScalarGene(30),
  sensorScale:               new Archonia.Form.ScalarGene(Archonia.Axioms.standardSensorScale),
  
  birthMassAdultCalories:      new Archonia.Form.ScalarGene(100),
  birthMassLarvalCalories:     new Archonia.Form.ScalarGene(100),
  offspringMassLarvalCalories: new Archonia.Form.ScalarGene(100),
  offspringMassAdultCalories:  new Archonia.Form.ScalarGene(100),
  predationRatio:              new Archonia.Form.ScalarGene(1.5),
  predatorFearRatio:           new Archonia.Form.ScalarGene(1.5),

  // dummy entries so the getters will work
  optimalTemp: null,
  optimalTempHi: null,
  optimalTempLo: null,
  tempRange: null,
  tempRadius: null,
  
  toxinStrength:               new Archonia.Form.ScalarGene(1),
  toxinResistance:             new Archonia.Form.ScalarGene(1),
  reproductionThreshold:       new Archonia.Form.ScalarGene(500),
  embryoThreshold:             new Archonia.Form.ScalarGene(200),

  tempToleranceMultiplier:     new Archonia.Form.ScalarGene(1),
  tempThresholdEncyst:         new Archonia.Form.ScalarGene(0.85),
  tempThresholdUnencyst:       new Archonia.Form.ScalarGene(0.50),
  tempThresholdVerticalOnly:   new Archonia.Form.ScalarGene(0.80),
  tempThresholdHorizontalOk:   new Archonia.Form.ScalarGene(0.75),
  tempSignalBufferSize:        new Archonia.Form.ScalarGene(10),
  tempSignalDecayRate:         new Archonia.Form.ScalarGene(0.03),

  hungerToleranceMultiplier:   new Archonia.Form.ScalarGene(0.75),
  hungerSignalBufferSize:      new Archonia.Form.ScalarGene(10),
  hungerSignalDecayRate:       new Archonia.Form.ScalarGene(0.03)

  
} };

Archonia.Cosmos.Genomer = {
  
  genomifyMe: function(archon) {
    archon.genome = new Proxy(new Archonia.Form.Genome(archon, primordialGenome), Archonia.Form.GenomeProxy);
  },
  
  inherit: function(childArchon, parentArchon) {
    // We already used the primordial to generate the genome for
    // the child archon. Now, if no parent archon is specified,
    // meaning this is a miraculous birth at creation, we're
    // inheriting from the primordial -- but we're not doing anything 
    // weird, and it doesn't waste anything; we're not creating new
    // genes, we're just updating the existing ones, using the
    // primordial as our starting point
    if(parentArchon === undefined) { parentArchon = { genome: primordialGenome }; }
    childArchon.genome.inherit(parentArchon.genome);
  }
};


})(Archonia);

if(typeof window === "undefined") {
  module.exports = {
    Genomer: Archonia.Cosmos.Genomer,
    Gene: Archonia.Form.Gene,
    ScalarGene: Archonia.Form.ScalarGene,
    ColorGene: Archonia.Form.ColorGene
  };
}
