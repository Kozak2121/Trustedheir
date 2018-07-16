import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('EstatePlannerAddClientCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        document.title = "Add a New Client | Enter Client Information";
        const self = this;
        self.statesList = STATES;

        self.submitForm = client => {
            if (client.$valid) {
                const estatePlanner = Session.get('currentUser');
                const newClient = {
                    username: `${client.firstName.$viewValue} ${client.lastName.$viewValue} _${Random.id()}`,
                    email: client.email.$viewValue,
                    password: Random.id(),
                    profile: {
                        firstName: client.firstName.$viewValue,
                        lastName: client.lastName.$viewValue,
                        email: client.email.$viewValue,
                        address: client.address.$viewValue,
                        city: client.city.$viewValue,
                        state: client.state.$viewValue,
                        zipCode: client.zipCode.$viewValue
                    }
                };
                Accounts.createUser(newClient, (err, cb) => {
                    if (err && err.reason === 'Email already exists.') {
                        Meteor.call('addExistingClient', newClient.email, estatePlanner, (error, cb) => {
                            if (error) {
                                return toastr.error(error.message, 'ERROR');
                            }
                            if (cb.client) {
                                Meteor.call('setRecentActivity', estatePlanner._id);
                                $location.path('/estate-planner/client-center');
                                $scope.$apply();
                                return toastr.success(cb.message, 'SUCCESS');
                            } else {
                                $location.path('/estate-planner/client-center');
                                $scope.$apply();
                                return toastr.warning(cb.message, 'WARNING');
                            }
                        });
                    } else if (err) {
                        return toastr.error(err.message, 'ERROR');
                    } else {
                        Meteor.call('createClientInvited', Meteor.userId(), newClient, estatePlanner, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            toastr.success(cb.message, 'SUCCESS');
                            Meteor.call('setRecentActivity', estatePlanner._id);
                            $location.path('/estate-planner/client-center');
                            $scope.$apply();
                        });
                    }
                });
            }
        };
    }]);
