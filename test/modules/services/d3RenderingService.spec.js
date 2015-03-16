'use strict';

//TODO(duftler):
//  Add tests for:
//    pinning
//    viewSettingsCache
//    nodeSettingsCache
//    clustered view

describe('D3 rendering service', function() {
  var d3RenderingService;
  var d3UtilitiesService;
  var parentDiv;
  var graphDiv;
  var scope;
  var d3Rendering;

  // Work around to get ngLodash correctly injected.
  beforeEach(function() {
    angular.module('testModule', ['ngLodash', 'krakenApp.Graph']);
  });

  beforeEach(module('testModule'));

  beforeEach(inject(function(_d3RenderingService_, _d3UtilitiesService_) {
    d3RenderingService = _d3RenderingService_;
    d3UtilitiesService = _d3UtilitiesService_;

    // Build the parent <div> and graph <div> to hold the <svg> element.
    parentDiv = d3.select('body').append('div');
    parentDiv.style('width', '500px');
    parentDiv.style('height', '500px');
    graphDiv = parentDiv.append('div');

    // Create the mock scope.
    scope = {
      viewModelService: {
        viewModel: {
          configuration: {},
          data: MOCK_SAMPLE_DATA[0].data
        }
      }
    };

    // Construct and configure the d3 rendering service.
    d3Rendering = d3RenderingService
      .rendering()
      .controllerScope(scope)
      .directiveElement(graphDiv.node());

    // Set the mock data in the scope.
    scope.viewModelService.viewModel.data = MOCK_SAMPLE_DATA[0].data;
  }));

  afterEach(function() {
    parentDiv.remove();
  });

  it('should locate the dimensions of the parent', function() {
    // Test that parent container dimensions are properly calculated before rendering.
    var containerDimensionsBeforeRendering = d3Rendering.getParentContainerDimensions();
    expect(containerDimensionsBeforeRendering[0]).toEqual(500);
    expect(containerDimensionsBeforeRendering[1]).toEqual(500);

    // Render the graph.
    d3Rendering();

    // Test that container dimensions are properly calculated after rendering.
    var containerDimensionsAfterRendering = d3Rendering.getParentContainerDimensions();
    expect(containerDimensionsAfterRendering[0]).toEqual(500);
    expect(containerDimensionsAfterRendering[1]).toEqual(500);
  });

  it('should resize the graph implicitly and explicitly', function() {
    // Render the graph.
    d3Rendering();

    // Test that the initial graph size is calculated properly.
    var initialGraphSize = d3Rendering.graphSize();
    // The initial width is calculated by subtracting 16 from the parent container width.
    // TODO(duftler): Use same constant here as in d3RenderingService.
    expect(initialGraphSize[0]).toEqual(484);
    // The initial height defaults to 700.
    // TODO(duftler): Use same constant here as in d3RenderingService.
    expect(initialGraphSize[1]).toEqual(700);

    // Explicitly set the graph size.
    d3Rendering.graphSize([750, 750]);

    // Test that the modified graph size is calculated properly.
    var modifiedGraphSize = d3Rendering.graphSize();
    expect(modifiedGraphSize[0]).toEqual(750);
    expect(modifiedGraphSize[1]).toEqual(750);
  });

  it('should respect "selected" property in view model', function() {
    // Render the graph.
    d3Rendering();

    // Test that the initial selection is calculated properly.
    var initialNodeSelection = d3Rendering.nodeSelection();
    expect(initialNodeSelection.size).toEqual(3);
    expect(d3UtilitiesService.setHas(initialNodeSelection, {id: 1})).toBeTruthy();
    expect(d3UtilitiesService.setHas(initialNodeSelection, {id: 2})).toBeTruthy();
    expect(d3UtilitiesService.setHas(initialNodeSelection, {id: 3})).toBeTruthy();
  });

  it('should completely replace node selection when explicitly set', function() {
    // Render the graph.
    d3Rendering();

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the updated selection is calculated properly.
    var updatedNodeSelection = d3Rendering.nodeSelection();
    expect(updatedNodeSelection.size).toEqual(2);
    expect(d3UtilitiesService.setHas(updatedNodeSelection, {id: 2})).toBeTruthy();
    expect(d3UtilitiesService.setHas(updatedNodeSelection, {id: 55})).toBeTruthy();
  });

  it('should select appropriate edges with respect to selected nodes in view model', function() {
    // Render the graph.
    d3Rendering();

    // Test that the expected edges are selected and no more.
    var initialEdgeSelectionIterator = d3Rendering.edgeSelection().values();

    // Test that the first selected edge goes from node with id 1 to node with id 2.
    var current = initialEdgeSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(1);
    expect(current.value.target.id).toEqual(2);

    // Test that the second selected edge goes from node with id 1 to node with id 3.
    current = initialEdgeSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(1);
    expect(current.value.target.id).toEqual(3);

    // Test that there are only 2 edges selected.
    current = initialEdgeSelectionIterator.next();
    expect(current.done).toBeTruthy();
  });

  it('should select appropriate edges with respect to explicitly set node selection', function() {
    // Render the graph.
    d3Rendering();

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the expected edges are selected and no more.
    var updatedEdgeSelectionIterator = d3Rendering.edgeSelection().values();

    // Test that the first selected edge goes from node with id 2 to node with id 55.
    var current = updatedEdgeSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(2);
    expect(current.value.target.id).toEqual(55);

    // Test that there is only 1 edge selected.
    current = updatedEdgeSelectionIterator.next();
    expect(current.done).toBeTruthy();
  });

  it('should select appropriate edgelabels with respect to selected nodes in view model', function() {
    // Render the graph.
    d3Rendering();

    // Test that the expected edgelabels are selected and no more.
    var initialEdgelabelsSelectionIterator = d3Rendering.edgelabelsSelection().values();

    // Test that the first selected edgelabel goes from node with id 1 to node with id 2.
    var current = initialEdgelabelsSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(1);
    expect(current.value.target.id).toEqual(2);

    // Test that the second selected edgelabel goes from node with id 1 to node with id 3.
    current = initialEdgelabelsSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(1);
    expect(current.value.target.id).toEqual(3);

    // Test that there are only 2 edgelabels selected.
    current = initialEdgelabelsSelectionIterator.next();
    expect(current.done).toBeTruthy();
  });

  it('should select appropriate edgelabels with respect to explicitly set node selection', function() {
    // Render the graph.
    d3Rendering();

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the expected edgelabels are selected and no more.
    var updatedEdgelabelsSelectionIterator = d3Rendering.edgelabelsSelection().values();

    // Test that the first selected edgelabel goes from node with id 2 to node with id 55.
    var current = updatedEdgelabelsSelectionIterator.next();
    expect(current.done).toBeFalsy();
    expect(current.value.source.id).toEqual(2);
    expect(current.value.target.id).toEqual(55);

    // Test that there is only 1 edgelabel selected.
    current = updatedEdgelabelsSelectionIterator.next();
    expect(current.done).toBeTruthy();
  });

  it('should set opacity of selected nodes to 1, and opacity of all others to something else', function() {
    // Render the graph.
    d3Rendering();

    // Test that the initial selection is calculated properly.
    var initialNodeSelection = d3Rendering.nodeSelection();
    expect(initialNodeSelection.size).toEqual(3);

    graphDiv.selectAll('.node').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(initialNodeSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(initialNodeSelection, e)).toBeFalsy();
      }
    });

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the updated node selection is calculated properly.
    var updatedNodeSelection = d3Rendering.nodeSelection();
    expect(updatedNodeSelection.size).toEqual(2);

    graphDiv.selectAll('.node').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(updatedNodeSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(updatedNodeSelection, e)).toBeFalsy();
      }
    });
  });

  it('should set opacity of selected edges to 1, and opacity of all others to something else', function() {
    // Render the graph.
    d3Rendering();

    // Test that the initial selection is calculated properly.
    var initialEdgeSelection = d3Rendering.edgeSelection();
    expect(initialEdgeSelection.size).toEqual(2);

    graphDiv.selectAll('.link').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(initialEdgeSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(initialEdgeSelection, e)).toBeFalsy();
      }
    });

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the updated edge selection is calculated properly.
    var updatedEdgeSelection = d3Rendering.edgeSelection();
    expect(updatedEdgeSelection.size).toEqual(1);

    graphDiv.selectAll('.link').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(updatedEdgeSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(updatedEdgeSelection, e)).toBeFalsy();
      }
    });
  });

  it('should set opacity of selected edgelabels to 1, and opacity of all others to something else', function() {
    // Render the graph.
    d3Rendering();

    // Test that the initial selection is calculated properly.
    var initialEdgelabelsSelection = d3Rendering.edgelabelsSelection();
    expect(initialEdgelabelsSelection.size).toEqual(2);

    graphDiv.selectAll('.edgelabel').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(initialEdgelabelsSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(initialEdgelabelsSelection, e)).toBeFalsy();
      }
    });

    // Create and set a new node selection.
    var newNodeSelection = new Set();
    newNodeSelection.add({id: 2});
    newNodeSelection.add({id: 55});
    d3Rendering.nodeSelection(newNodeSelection);

    // Test that the updated edgelabels selection is calculated properly.
    var updatedEdgelabelsSelection = d3Rendering.edgeSelection();
    expect(updatedEdgelabelsSelection.size).toEqual(1);

    graphDiv.selectAll('.edgelabel').each(function(e) {
      var opacity = d3.select(this).style('opacity');

      if (opacity === '1') {
        expect(d3UtilitiesService.setHas(updatedEdgelabelsSelection, e)).toBeTruthy();
      } else {
        expect(d3UtilitiesService.setHas(updatedEdgelabelsSelection, e)).toBeFalsy();
      }
    });
  });

  it('should set opacity of all nodes, edges, edgelabels and images to 1 when nothing is selected', function() {
    // Render the graph.
    d3Rendering();

    // Set the node selection to an empty set.
    d3Rendering.nodeSelection(new Set());

    graphDiv.selectAll('.node').each(function(e) {
      expect(d3.select(this).style('opacity')).toEqual('1');
    });

    graphDiv.selectAll('.link').each(function(e) {
      expect(d3.select(this).style('opacity')).toEqual('1');
    });

    graphDiv.selectAll('.edgelabel').each(function(e) {
      expect(d3.select(this).style('opacity')).toEqual('1');
    });

    graphDiv.selectAll('image').each(function(e) {
      expect(d3.select(this).style('opacity')).toEqual('1');
    });
  });

  var MOCK_SAMPLE_DATA = [
    {
      'name' : 'All Types',
      'data' : {
        'nodes': [
          {
            'name': 'service: guestbook',
            'radius': 16,
            'fill': 'olivedrab',
            'id': 1,
            'selected': true
          },
          {
            'name': 'pod: guestbook-controller',
            'radius': 20,
            'fill': 'palegoldenrod',
            'id': 2,
            'selected': true
          },
          {
            'name': 'pod: guestbook-controller',
            'radius': 20,
            'fill': 'palegoldenrod',
            'id': 3,
            'selected': true
          },
          {
            'name': 'pod: guestbook-controller',
            'radius': 20,
            'fill': 'palegoldenrod',
            'id': 55
          },
          {
            'name': 'container: php-redis',
            'radius': 24,
            'fill': 'cornflowerblue',
            'id': 77
          },
        ],
        'links': [
          {
            'source': 0,
            'target': 1,
            'width': 2,
            'stroke': 'black',
            'distance': 80
          },
          {
            'source': 0,
            'target': 2,
            'width': 2,
            'stroke': 'black',
            'distance': 80
          },
          {
            'source': 1,
            'target': 3,
            'width': 2,
            'stroke': 'black',
            'distance': 80
          },
        ],
        'settings': {
          'clustered': false,
          'showEdgeLabels': true,
          'showNodeLabels': true
        }
      }
    },
  ];
});
