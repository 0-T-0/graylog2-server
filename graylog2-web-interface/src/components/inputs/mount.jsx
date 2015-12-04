'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var InputIOMetrics = require('./InputIOMetrics');

var inputMetrics = document.getElementsByClassName('react-input-metrics');
if (inputMetrics) {
    for (var i = 0; i < inputMetrics.length; i++) {
        var elem = inputMetrics[i];
        var inputId = elem.getAttribute('data-input-id');
        var nodeId = elem.getAttribute('data-node-id');
        var inputClassName = elem.getAttribute('data-input-classname');
        ReactDOM.render(<InputIOMetrics metricsPrefix={inputClassName} inputId={inputId} nodeId={nodeId}/>, elem);
    }
}
