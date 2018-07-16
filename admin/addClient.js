import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('AdminAddClientCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', '$stateParams', ($scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Add Client | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        const currentUser = Session.get('currentUser');
        if (currentUser) {
            Meteor.call('getUserById', $location.search().estatePlannerId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.estatePlanner = cb;
                })
            });
        }

        self.submitForm = client => {
            if (client.$valid) {
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
                        Meteor.call('addExistingClient', newClient.email, self.estatePlanner, (error, cb) => {
                            if (error) {
                                return toastr.error(error.message, 'ERROR');
                            }
                            if (cb.client) {
                                $location.path(`/admin/estate-planner-center/${$location.search().estatePlannerId}`).search({});
                                $scope.$apply();
                                return toastr.success(cb.message, 'SUCCESS');
                            } else {
                                $location.path(`/admin/estate-planner-center/${$location.search().estatePlannerId}`).search({});
                                $scope.$apply();
                                return toastr.warning(cb.message, 'WARNING');
                            }
                        });
                    } else if (err) {
                        return toastr.error(err.message, 'ERROR');
                    } else {
                        Meteor.call('createClientInvited', Meteor.userId(), newClient, self.estatePlanner, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            toastr.success(cb.message, 'SUCCESS');
                            $location.path(`/admin/estate-planner-center/${$location.search().estatePlannerId}`).search({});
                            $scope.$apply();
                        });
                    }
                });
            }
        };
    }]);
