var chai = require('chai');

var Engine = require('../Engine.js');

describe("Engine", function() {
  describe('#smoke', function() {
    it('#start the game state', function() {
      chai.expect(Engine.start).to.not.throw();
      chai.expect(Engine.game).not.equal(undefined);
    });
  })
  
  describe('game state started, see if it actually runs', function() {
    it('#pass create step', function() {
      Engine.game.state.create();
      chai.expect(Engine.game.physics.started).true;

      chai.expect(Engine.update).to.not.throw();
    });
  });
  
});
