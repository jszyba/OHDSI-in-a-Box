
var response = require('cfn-response');
var AWS = require('aws-sdk');
exports.handler = function(event, context) {
    console.log("event ==> ==> ==> ==> ==>")
    console.log(event)
    var physicalId = event.PhysicalResourceId || 'none';
    console.log("physicalId ==> ==> ==> ==> ==>");
    console.log(physicalId);
    function success(data) {
        console.log("success function data ==> ==> ==> ==> ==>");
        console.log(data);
        return response.send(event, context, response.SUCCESS, data, physicalId);
    }
    function failed(e) {
        console.log("failed function e ==> ==> ==> ==> ==>");
        console.log(e);
        return response.send(event, context, response.FAILED, e, physicalId);
    }
    var ec2 = new AWS.EC2();
    var instances;
    // Create
    if (event.RequestType == 'Create') {
        var launchParams = event.ResourceProperties;
        console.log("launchParams ==> ==> ==> ==> ==>");
        console.log(launchParams);
        delete launchParams.ServiceToken;
        ec2.runInstances(launchParams).promise().then((data) => {
            console.log("runInstances function promise data ==> ==> ==> ==> ==>");
            console.log(data);
            instances = data.Instances.map((data)=> data.InstanceId);
            physicalId = instances.join(':');
            return ec2.waitFor('instanceRunning', {InstanceIds: instances}).promise();
        }).then((data) => {
            console.log("then function promise data ==> ==> ==> ==> ==>");
            console.log(data);
            success({
                Instances: instances
            })
        }).catch((e) => {
            console.log("failed function promise e ==> ==> ==> ==> ==>");
            console.log(e);
            failed(e);
        });
    // Delete
    } else if (event.RequestType == 'Delete') {
        if (physicalId == 'none') {
            return success({

            });
        }
        var deleteParams = {InstanceIds: physicalId.split(':')};
        ec2.terminateInstances(deleteParams).promise().then((data) => {
            ec2.waitFor('instanceTerminated', deleteParams).promise()
        }).then((data) => {
            success({})
        }).catch((e) => {
                failed(e)
        });
    } else {
        return failed({Error: "In-place updates not supported."});
    }
};